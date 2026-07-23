import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addTransaction as dbAdd,
  deleteTransaction as dbDelete,
  updateTransaction as dbUpdate,
  listTransactions,
  pendingCount as dbPending,
  clearAndImportTransactions,
  mergeImportTransactions,
  listAllRawTransactions,
  type Transaction,
  type Wallet,
} from "./db";
import { useAccount } from "./accounts";
import { useSettings, type Settings } from "./settings";
import {
  getSyncBundle,
  saveDeviceJournal,
  saveWorkspaceCatalog,
} from "./gdrive";
import {
  markMergedRecordsSynced,
  mergeSyncSources,
  needsFirstSyncDecision,
  normalizeWallet,
  type CloudDeviceLockState,
  type CloudJournalV2,
} from "./sync-engine";
import {
  deviceLockForSync,
  installSyncedDeviceLock,
  settingsForSync,
} from "./device-lock";
import { getDeviceId } from "./device-id";
import {
  mergeWorkspaceCatalogs,
  type CloudWorkspace,
  type WorkspaceCatalog,
} from "./workspace-sync";

export type SyncState =
  | "syncing"
  | "pending"
  | "synced"
  | "offline"
  | "reconnect"
  | "error";

export type SyncResult =
  | { status: "synced" }
  | { status: "authorization_required" }
  | {
      status: "first_sync_decision_required";
      localWallets: number;
      localTransactions: number;
      cloudWallets: number;
      cloudTransactions: number;
    }
  | { status: "error"; error: string };

export type FirstSyncResolution = "merge" | "discard-local";

export interface FirstSyncDecision {
  localWallets: number;
  localTransactions: number;
  cloudWallets: number;
  cloudTransactions: number;
}

interface Ctx {
  transactions: Transaction[];
  wallets: Wallet[];
  pending: number;
  online: boolean;
  lastSyncedAt: string | null;
  syncState: SyncState;
  syncError: string | null;
  firstSyncDecision: FirstSyncDecision | null;
  addTx: (t: Omit<Transaction, "id" | "sync_status" | "last_updated">) => Promise<void>;
  updateTx: (
    id: string,
    t: Omit<Transaction, "id" | "sync_status" | "last_updated" | "deleted" | "origin_device_id">,
  ) => Promise<void>;
  removeTx: (id: string) => Promise<void>;
  syncNow: (resolution?: FirstSyncResolution) => Promise<SyncResult>;
  cancelFirstSync: () => void;
  balances: Record<string, number>;
  netBalance: number;
  addWallet: (w: Omit<Wallet, "id">) => void;
  updateWallet: (id: string, w: Partial<Wallet>, targetBalance?: number) => Promise<void>;
  deleteWallet: (id: string) => void;
  restoreBackup: (txs: Transaction[], wallets?: Wallet[]) => Promise<void>;
}

const TxCtx = createContext<Ctx | null>(null);

function computeBalances(txs: Transaction[], wallets: Wallet[]) {
  const balances: Record<string, number> = {};
  for (const wallet of wallets) {
    if (!wallet.deleted) balances[wallet.id] = 0;
  }
  for (const transaction of txs) {
    if (transaction.deleted) continue;
    if (balances[transaction.account] === undefined) {
      balances[transaction.account] = 0;
    }
    if (
      transaction.toAccount &&
      balances[transaction.toAccount] === undefined
    ) {
      balances[transaction.toAccount] = 0;
    }

    if (transaction.type === "income") {
      balances[transaction.account] += transaction.amount;
    } else if (transaction.type === "expense") {
      balances[transaction.account] -= transaction.amount;
    } else if (transaction.toAccount) {
      balances[transaction.account] -= transaction.amount;
      balances[transaction.toAccount] += transaction.amount;
    }
  }
  return balances;
}

export function TxProvider({ children }: { children: ReactNode; key?: React.Key }) {
  const {
    accounts,
    activeAccountId,
    token,
    user,
    workspaceRecords,
    reconcileWorkspaces,
  } = useAccount();
  const { settings, update: updateSettings } = useSettings();
  if (!activeAccountId) {
    throw new Error("TxProvider requires activeAccountId from AccountProvider");
  }
  const activeWorkspace = accounts.find(
    (workspace) => workspace.id === activeAccountId,
  );
  if (!activeWorkspace) {
    throw new Error("TxProvider requires an active workspace");
  }

  const walletsKey = `maal-wallets-v1-${activeAccountId}`;
  const oldLastSyncKey = `maal-last-sync-${activeAccountId}`;
  const baselineKey = `maal-sync-baseline-v2-${activeAccountId}`;
  const settingsSyncKey = `maal-settings-sync-v2-${activeAccountId}`;
  const syncKey = user && !user.isGuest ? user.id : activeAccountId;
  const workspaceSyncId = activeWorkspace.syncId;
  const workspaceCatalogSyncKey = `maal-workspace-catalog-sync-v1-${syncKey}`;
  const workspaceCatalogPayload = JSON.stringify(
    [...workspaceRecords].sort((a, b) => a.syncId.localeCompare(b.syncId)),
  );
  const [localDeviceId] = useState(getDeviceId);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    try {
      const stored = localStorage.getItem(walletsKey);
      if (!stored) return [];
      const fallback =
        localStorage.getItem(oldLastSyncKey) || new Date().toISOString();
      const wasPreviouslySynced = !!localStorage.getItem(oldLastSyncKey);
      return (JSON.parse(stored) as Wallet[]).map((wallet) => ({
        ...normalizeWallet(wallet, fallback, localDeviceId),
        sync_status:
          wallet.sync_status ||
          (wasPreviouslySynced ? "synced" : "pending_insert"),
      }));
    } catch {
      return [];
    }
  });
  const [txPending, setTxPending] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () =>
      localStorage.getItem(baselineKey) ||
      localStorage.getItem(oldLastSyncKey),
  );
  const [syncState, setSyncState] = useState<SyncState>(
    navigator.onLine ? "pending" : "offline",
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [firstSyncDecision, setFirstSyncDecision] =
    useState<FirstSyncDecision | null>(null);
  const [firstSyncDismissed, setFirstSyncDismissed] = useState(false);
  const syncInFlight = useRef<Promise<SyncResult> | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const refresh = useCallback(async () => {
    setTransactions(await listTransactions(activeAccountId));
    setTxPending(await dbPending(activeAccountId));
  }, [activeAccountId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(walletsKey, JSON.stringify(wallets));
  }, [wallets, walletsKey]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => {
      setOnline(false);
      setSyncState("offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const walletPending = wallets.filter(
    (wallet) => wallet.sync_status !== "synced",
  ).length;
  const syncedSettingsVersion = localStorage.getItem(settingsSyncKey);
  const settingsPending =
    settings.updatedAt !== "1970-01-01T00:00:00.000Z" &&
    settings.updatedAt !== syncedSettingsVersion
      ? 1
      : 0;
  const workspacePending =
    !user?.isGuest &&
    workspaceCatalogPayload !==
      localStorage.getItem(workspaceCatalogSyncKey)
      ? 1
      : 0;
  const pending =
    txPending + walletPending + settingsPending + workspacePending;

  const addTx: Ctx["addTx"] = async (transaction) => {
    await dbAdd(activeAccountId, transaction, localDeviceId);
    await refresh();
  };

  const updateTx: Ctx["updateTx"] = async (id, transaction) => {
    await dbUpdate(activeAccountId, id, transaction, localDeviceId);
    await refresh();
  };

  const removeTx = async (id: string) => {
    await dbDelete(activeAccountId, id, localDeviceId);
    await refresh();
  };

  const performSync = useCallback(
    async (resolution?: FirstSyncResolution): Promise<SyncResult> => {
      if (!navigator.onLine) {
        setSyncState("offline");
        return { status: "error", error: "You are offline." };
      }
      if (!user || user.isGuest || !token) {
        setSyncState("reconnect");
        return { status: "authorization_required" };
      }

      setSyncState("syncing");
      setSyncError(null);
      const syncStartedAt = new Date().toISOString();
      try {
        const bundle = await getSyncBundle(
          token,
          syncKey,
          workspaceSyncId,
          localDeviceId,
        );
        const localWorkspaceRecords = JSON.parse(
          workspaceCatalogPayload,
        ) as CloudWorkspace[];
        const mergedWorkspaces = mergeWorkspaceCatalogs(
          bundle.workspaceCatalogs,
          localWorkspaceRecords,
        ).sort((a, b) => a.syncId.localeCompare(b.syncId));
        const localTransactions = await listAllRawTransactions(activeAccountId);
        const hasBaseline =
          !!localStorage.getItem(baselineKey) ||
          !!localStorage.getItem(oldLastSyncKey);
        const cloudOnly = mergeSyncSources(bundle.legacy, bundle.journals);
        if (
          needsFirstSyncDecision(
            hasBaseline,
            bundle.legacy,
            bundle.journals,
            wallets,
            localTransactions,
          ) &&
          !resolution
        ) {
          const decision = {
            localWallets: wallets.filter(
              (wallet) => wallet.sync_status !== "synced" && !wallet.deleted,
            ).length,
            localTransactions: localTransactions.filter(
              (transaction) =>
                transaction.sync_status !== "synced" && !transaction.deleted,
            ).length,
            cloudWallets: cloudOnly.wallets.filter((wallet) => !wallet.deleted)
              .length,
            cloudTransactions: cloudOnly.transactions.filter(
              (transaction) => !transaction.deleted,
            ).length,
          };
          setFirstSyncDismissed(false);
          setFirstSyncDecision(decision);
          setSyncState("pending");
          return { status: "first_sync_decision_required", ...decision };
        }

        const localVerifier = await deviceLockForSync(
          activeAccountId,
          settings.deviceLock,
          settings.updatedAt,
        );
        const localLock: CloudDeviceLockState = {
          enabled: settings.deviceLock,
          updatedAt: settings.updatedAt,
          verifier: localVerifier,
        };
        const merged =
          resolution === "discard-local"
            ? cloudOnly
            : mergeSyncSources(bundle.legacy, bundle.journals, {
                wallets,
                transactions: localTransactions,
                settings,
                deviceLock: localLock,
                deviceId: localDeviceId,
              });

        let lockEnabled = settings.deviceLock;
        if (merged.deviceLock) {
          lockEnabled =
            merged.deviceLock.enabled &&
            !!merged.deviceLock.verifier &&
            installSyncedDeviceLock(
              activeAccountId,
              merged.deviceLock.verifier,
            );
        }
        const nextSettings: Settings = {
          ...settings,
          ...(merged.settings || {}),
          deviceLock: lockEnabled,
        };
        const synced = markMergedRecordsSynced(merged);
        const journal: CloudJournalV2 = {
          schemaVersion: 2,
          userId: syncKey,
          workspaceId: workspaceSyncId,
          deviceId: localDeviceId,
          updatedAt: syncStartedAt,
          wallets: synced.wallets,
          transactions: synced.transactions,
          settings: settingsForSync(nextSettings),
          deviceLock: merged.deviceLock || localLock,
        };

        await saveDeviceJournal(
          token,
          syncKey,
          workspaceSyncId,
          localDeviceId,
          bundle.ownFileId,
          journal,
        );
        const catalog: WorkspaceCatalog = {
          schemaVersion: 1,
          userId: syncKey,
          deviceId: localDeviceId,
          updatedAt: syncStartedAt,
          workspaces: mergedWorkspaces,
        };
        await saveWorkspaceCatalog(
          token,
          syncKey,
          localDeviceId,
          bundle.ownCatalogFileId,
          catalog,
        );

        if (resolution === "discard-local") {
          await clearAndImportTransactions(activeAccountId, synced.transactions);
          setWallets(synced.wallets);
        } else {
          await mergeImportTransactions(activeAccountId, synced.transactions);
          setWallets((currentWallets) =>
            mergeSyncSources(null, [journal], {
              wallets: currentWallets,
              transactions: [],
              settings: settingsRef.current,
              deviceId: localDeviceId,
            }).wallets,
          );
        }
        const currentSettings = settingsRef.current;
        const settingsToApply =
          (Date.parse(currentSettings.updatedAt) || 0) >
          (Date.parse(nextSettings.updatedAt) || 0)
            ? currentSettings
            : nextSettings;
        if (
          JSON.stringify(settingsToApply) !== JSON.stringify(currentSettings)
        ) {
          updateSettings(settingsToApply);
        }
        localStorage.setItem(baselineKey, syncStartedAt);
        localStorage.setItem(oldLastSyncKey, syncStartedAt);
        localStorage.setItem(settingsSyncKey, nextSettings.updatedAt);
        localStorage.setItem(
          workspaceCatalogSyncKey,
          JSON.stringify(mergedWorkspaces),
        );
        reconcileWorkspaces(mergedWorkspaces);
        setLastSyncedAt(syncStartedAt);
        setFirstSyncDecision(null);
        setFirstSyncDismissed(false);
        setSyncState("synced");
        await refresh();
        return { status: "synced" };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Synchronization failed.";
        if (message === "UNAUTHORIZED") {
          setSyncState("reconnect");
          return { status: "authorization_required" };
        }
        setSyncError(message);
        setSyncState("error");
        return { status: "error", error: message };
      }
    },
    [
      activeAccountId,
      baselineKey,
      localDeviceId,
      oldLastSyncKey,
      refresh,
      reconcileWorkspaces,
      settings,
      settingsSyncKey,
      syncKey,
      token,
      updateSettings,
      user,
      wallets,
      workspaceCatalogPayload,
      workspaceCatalogSyncKey,
      workspaceSyncId,
    ],
  );

  const syncNow = useCallback(
    (resolution?: FirstSyncResolution) => {
      if (syncInFlight.current) return syncInFlight.current;
      const operation = performSync(resolution).finally(() => {
        syncInFlight.current = null;
      });
      syncInFlight.current = operation;
      return operation;
    },
    [performSync],
  );

  useEffect(() => {
    if (
      !user ||
      user.isGuest ||
      firstSyncDecision ||
      firstSyncDismissed ||
      syncState === "reconnect" ||
      !online
    ) {
      return;
    }
    const needsInitialSync = !localStorage.getItem(baselineKey);
    if (!needsInitialSync && pending === 0) return;
    const timer = window.setTimeout(() => void syncNow(), 900);
    return () => window.clearTimeout(timer);
  }, [
    baselineKey,
    firstSyncDecision,
    firstSyncDismissed,
    online,
    pending,
    syncNow,
    syncState,
    token,
    user,
  ]);

  useEffect(() => {
    if (
      !user ||
      user.isGuest ||
      firstSyncDecision ||
      firstSyncDismissed ||
      syncState === "reconnect"
    ) {
      return;
    }
    const retry = () => {
      if (navigator.onLine) void syncNow();
    };
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
    };
  }, [firstSyncDecision, firstSyncDismissed, syncNow, syncState, user]);

  const addWallet = (wallet: Omit<Wallet, "id">) => {
    const now = new Date().toISOString();
    setWallets((current) => [
      ...current,
      {
        ...wallet,
        id: crypto.randomUUID(),
        deleted: false,
        sync_status: "pending_insert",
        last_updated: now,
        origin_device_id: localDeviceId,
      },
    ]);
  };

  const updateWallet = async (
    id: string,
    patch: Partial<Wallet>,
    targetBalance?: number,
  ) => {
    const now = new Date().toISOString();
    setWallets((current) =>
      current.map((wallet) =>
        wallet.id === id
          ? {
              ...wallet,
              ...patch,
              sync_status: "pending_insert",
              last_updated: now,
              origin_device_id: localDeviceId,
            }
          : wallet,
      ),
    );
    if (targetBalance === undefined || Number.isNaN(targetBalance)) return;
    const currentBalance = balances[id] || 0;
    const difference = targetBalance - currentBalance;
    if (Math.abs(difference) < 0.005) return;
    await dbAdd(
      activeAccountId,
      {
        amount: Math.abs(difference),
        type: difference >= 0 ? "income" : "expense",
        account: id,
        description: "Manual balance adjustment",
        timestamp: now,
      },
      localDeviceId,
    );
    await refresh();
  };

  const deleteWallet = (id: string) => {
    const now = new Date().toISOString();
    setWallets((current) => {
      const wallet = current.find((item) => item.id === id);
      if (wallet?.sync_status === "pending_insert") {
        return current.filter((item) => item.id !== id);
      }
      return current.map((item) =>
        item.id === id
          ? {
              ...item,
              deleted: true,
              sync_status: "pending_delete",
              last_updated: now,
              origin_device_id: localDeviceId,
            }
          : item,
      );
    });
  };

  const restoreBackup = async (
    restoredTransactions: Transaction[],
    restoredWallets?: Wallet[],
  ) => {
    const now = new Date().toISOString();
    await clearAndImportTransactions(
      activeAccountId,
      restoredTransactions.map((transaction) => ({
        ...transaction,
        deleted: false,
        sync_status: "pending_insert",
        last_updated: now,
        origin_device_id: localDeviceId,
      })),
    );
    if (restoredWallets) {
      setWallets(
        restoredWallets.map((wallet) => ({
          ...wallet,
          deleted: false,
          sync_status: "pending_insert",
          last_updated: now,
          origin_device_id: localDeviceId,
        })),
      );
    }
    await refresh();
  };

  const balances = useMemo(
    () => computeBalances(transactions, wallets),
    [transactions, wallets],
  );
  const netBalance = Object.keys(balances)
    .filter((id) => wallets.some((wallet) => wallet.id === id && !wallet.deleted))
    .reduce((sum, id) => sum + (balances[id] || 0), 0);

  const visibleState: SyncState = !online
    ? "offline"
    : syncState === "syncing" ||
        syncState === "reconnect" ||
        syncState === "error"
      ? syncState
      : pending > 0
        ? "pending"
        : lastSyncedAt
          ? "synced"
          : "pending";

  return (
    <TxCtx.Provider
      value={{
        transactions,
        wallets,
        pending,
        online,
        lastSyncedAt,
        syncState: visibleState,
        syncError,
        firstSyncDecision,
        addTx,
        updateTx,
        removeTx,
        syncNow,
        cancelFirstSync: () => {
          setFirstSyncDecision(null);
          setFirstSyncDismissed(true);
        },
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
  const context = useContext(TxCtx);
  if (!context) throw new Error("TxProvider missing");
  return context;
}
