import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  addTransaction as dbAdd,
  deleteTransaction as dbDelete,
  listTransactions,
  pendingCount as dbPending,
  clearAndImportTransactions,
  listAllRawTransactions,
  type Transaction,
  type Wallet,
} from "./db";
import { useAccount } from "./accounts";
import { useSettings } from "./settings";
import { getSyncFile, saveSyncFile } from "./gdrive";

type SyncState = "synced" | "pending" | "offline";

interface Ctx {
  transactions: Transaction[];
  wallets: Wallet[];
  pending: number;
  online: boolean;
  lastSyncedAt: string | null;
  syncState: SyncState;
  addTx: (t: Omit<Transaction, "id" | "sync_status" | "last_updated">) => Promise<void>;
  removeTx: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  balances: Record<string, number>;
  netBalance: number;
  addWallet: (w: Omit<Wallet, "id">) => void;
  updateWallet: (id: string, w: Partial<Wallet>, targetBalance?: number) => Promise<void>;
  deleteWallet: (id: string) => void;
  restoreBackup: (txs: Transaction[], wallets?: Wallet[]) => Promise<void>;
}

const DEFAULT_WALLETS: Wallet[] = [
  { id: "telebirr", name: "Telebirr", type: "mobile", accountNumber: "12345678", accountHolder: "Abebe Kebede" },
];

const TxCtx = createContext<Ctx | null>(null);

function computeBalances(txs: Transaction[], wallets: Wallet[]) {
  const b: Record<string, number> = {};
  for (const w of wallets) {
    b[w.id] = 0;
  }
  for (const t of txs) {
    if (b[t.account] === undefined) b[t.account] = 0;
    if (t.toAccount && b[t.toAccount] === undefined) b[t.toAccount] = 0;

    if (t.type === "income") b[t.account] += t.amount;
    else if (t.type === "expense") b[t.account] -= t.amount;
    else if (t.type === "transfer" && t.toAccount) {
      b[t.account] -= t.amount;
      b[t.toAccount] += t.amount;
    }
  }
  return b;
}

export function TxProvider({ children }: { children: ReactNode; key?: React.Key }) {
  const { activeAccountId, token, googleSignIn, user } = useAccount();
  const { settings, update: updateSettings } = useSettings();
  
  if (!activeAccountId) {
    throw new Error("TxProvider requires activeAccountId from AccountProvider");
  }

  const walletsKey = `maal-wallets-v1-${activeAccountId}`;
  const lastSyncKey = `maal-last-sync-${activeAccountId}`;
  const syncKey = user && !user.isGuest ? user.id : activeAccountId;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    try {
      const stored = localStorage.getItem(walletsKey);
      return stored ? JSON.parse(stored) : DEFAULT_WALLETS;
    } catch {
      return DEFAULT_WALLETS;
    }
  });
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const txs = await listTransactions(activeAccountId);
    setTransactions(txs);
    setPending(await dbPending(activeAccountId));
  }, [activeAccountId]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    refresh();
    const stored = localStorage.getItem(lastSyncKey);
    if (stored) setLastSyncedAt(stored);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refresh, lastSyncKey]);

  useEffect(() => {
    localStorage.setItem(walletsKey, JSON.stringify(wallets));
  }, [wallets, walletsKey]);

  const addTx: Ctx["addTx"] = async (t) => {
    await dbAdd(activeAccountId, t);
    await refresh();
  };
  const removeTx = async (id: string) => {
    await dbDelete(activeAccountId, id);
    await refresh();
  };
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      throw new Error("You are offline. Cannot sync with Google Drive.");
    }

    let currentToken = token;

    if (!currentToken && user) {
      try {
        const result = await googleSignIn();
        if (result.success && result.token) {
          currentToken = result.token;
        } else {
          throw new Error(result.error || "Authentication required");
        }
      } catch (err: any) {
        throw new Error("Google Drive sync authorization required. Please reconnect or click 'Sync Now'.");
      }
    }

    if (!currentToken) {
      throw new Error("No Google Account connected. Please sign in to sync with Google Drive.");
    }

    // 1. Fetch remote sync data
    const { fileId, data: remoteData } = await getSyncFile(currentToken, syncKey);

    const localTxs = await listAllRawTransactions(activeAccountId);
    const localWallets = wallets;
    const nowStr = new Date().toISOString();
    const hasSyncedBefore = !!localStorage.getItem(lastSyncKey);

    let mergedTxs: Transaction[] = [];
    let mergedWallets: Wallet[] = [];
    let mergedSettings = settings;

    if (!remoteData) {
      // Remote file doesn't exist. Initial Sync / backup!
      const updatedLocalTxs = localTxs
        .map((t) => {
          if (t.sync_status === "pending_delete") {
            return null;
          }
          return {
            ...t,
            sync_status: "synced" as const,
            last_updated: nowStr,
          };
        })
        .filter(Boolean) as Transaction[];

      mergedTxs = updatedLocalTxs;
      mergedWallets = localWallets;
    } else if (!hasSyncedBefore) {
      mergedTxs = remoteData.transactions || [];
      mergedWallets = remoteData.wallets?.length ? remoteData.wallets : localWallets;
    } else {
      // Incremental Sync and Conflict Resolution!
      const remoteTxs = remoteData.transactions || [];
      const remoteWallets = remoteData.wallets || [];

      const txMap = new Map<string, Transaction>();

      for (const rx of remoteTxs) {
        txMap.set(rx.id, rx);
      }

      for (const lx of localTxs) {
        const rx = txMap.get(lx.id);
        if (!rx) {
          if (lx.sync_status === "pending_delete") {
            continue;
          } else {
            txMap.set(lx.id, {
              ...lx,
              sync_status: "synced",
              last_updated: lx.last_updated || nowStr,
            });
          }
        } else {
          const rTime = new Date(rx.last_updated || 0).getTime();
          const lTime = new Date(lx.last_updated || 0).getTime();

          if (lTime > rTime) {
            if (lx.sync_status === "pending_delete") {
              txMap.delete(lx.id);
            } else {
              txMap.set(lx.id, {
                ...lx,
                sync_status: "synced",
                last_updated: lx.last_updated,
              });
            }
          } else {
            txMap.set(lx.id, rx);
          }
        }
      }

      mergedTxs = Array.from(txMap.values());

      const walletMap = new Map<string, Wallet>();
      for (const rw of remoteWallets) {
        walletMap.set(rw.id, rw);
      }
      for (const lw of localWallets) {
        const rw = walletMap.get(lw.id);
        if (!rw) {
          walletMap.set(lw.id, lw);
        } else {
          walletMap.set(lw.id, {
            ...rw,
            ...lw,
            deleted: rw.deleted || lw.deleted,
          });
        }
      }
      mergedWallets = Array.from(walletMap.values());
    }

    if (remoteData?.settings) {
      const remoteSettings = { ...settings, ...remoteData.settings };
      const remoteTime = new Date(remoteSettings.updatedAt || 0).getTime();
      const localTime = new Date(settings.updatedAt || 0).getTime();
      if (!hasSyncedBefore || remoteTime > localTime) {
        mergedSettings = remoteSettings;
        updateSettings(mergedSettings);
      }
    }

    // 2. Clear local and import merged transactions as synced
    await clearAndImportTransactions(activeAccountId, mergedTxs);

    // 3. Save merged wallets locally
    setWallets(mergedWallets);

    // 4. Save to Google Drive
    await saveSyncFile(currentToken, syncKey, fileId, {
      activeAccountId,
      wallets: mergedWallets,
      transactions: mergedTxs,
      settings: mergedSettings,
      lastSyncedAt: nowStr,
    });

    // 5. Update last successful sync time
    localStorage.setItem(lastSyncKey, nowStr);
    setLastSyncedAt(nowStr);

    await refresh();
  }, [activeAccountId, token, user, googleSignIn, lastSyncKey, refresh, wallets, settings, syncKey, updateSettings]);

  // Auto Sync effect
  useEffect(() => {
    if (settings.autoSync && online && pending > 0) {
      syncNow();
    }
  }, [settings.autoSync, online, pending, syncNow]);

  const addWallet = (w: Omit<Wallet, "id">) => {
    const newWallet: Wallet = {
      ...w,
      id: crypto.randomUUID(),
    };
    setWallets((prev) => [...prev, newWallet]);
  };

  const updateWallet = async (id: string, w: Partial<Wallet>, targetBalance?: number) => {
    setWallets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...w } : item))
    );
    if (targetBalance === undefined || Number.isNaN(targetBalance)) return;
    const current = balances[id] || 0;
    const delta = targetBalance - current;
    if (Math.abs(delta) < 0.005) return;
    await dbAdd(activeAccountId, {
      amount: Math.abs(delta),
      type: delta >= 0 ? "income" : "expense",
      account: id,
      description: "Manual balance adjustment",
      timestamp: new Date().toISOString(),
    });
    await refresh();
  };

  const deleteWallet = (id: string) => {
    setWallets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, deleted: true } : item))
    );
  };

  const restoreBackup = async (txs: Transaction[], newWallets?: Wallet[]) => {
    await clearAndImportTransactions(activeAccountId, txs);
    if (newWallets && newWallets.length > 0) {
      setWallets(newWallets);
    }
    await refresh();
  };

  const balances = computeBalances(transactions, wallets);
  const netBalance = Object.keys(balances)
    .filter((id) => wallets.some((w) => w.id === id)) // only sum active wallets for net balance if needed
    .reduce((sum, id) => sum + (balances[id] || 0), 0);
  const syncState: SyncState = !online ? "offline" : pending > 0 ? "pending" : "synced";

  return (
    <TxCtx.Provider
      value={{
        transactions,
        wallets,
        pending,
        online,
        lastSyncedAt,
        syncState,
        addTx,
        removeTx,
        syncNow,
        balances,
        netBalance,
        addWallet,
        updateWallet,
        deleteWallet,
        restoreBackup,
      }}
    >
      {children}
    </TxCtx.Provider>
  );
}

export function useTx() {
  const c = useContext(TxCtx);
  if (!c) throw new Error("TxProvider missing");
  return c;
}
