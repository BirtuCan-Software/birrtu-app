import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type Account = string;
export type WalletType = "bank" | "cash" | "mobile" | "other";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  accountNumber?: string;
  accountHolder?: string;
  logoUrl?: string; // base64 logo (optional)
  deleted?: boolean;
}

export type TxType = "income" | "expense" | "transfer";
export type SyncStatus = "synced" | "pending_insert" | "pending_delete";

export interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  account: Account;
  toAccount?: Account; // transfers
  description: string;
  timestamp: string;
  sync_status: SyncStatus;
  last_updated: string;
}

interface MaalDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { "by-timestamp": string; "by-sync": string };
  };
}

let dbPromises: Record<string, Promise<IDBPDatabase<MaalDB>>> = {};

export function getDB(accountId: string) {
  if (typeof window === "undefined") throw new Error("DB only in browser");
  if (!accountId) throw new Error("Account ID is required to open DB");
  if (!dbPromises[accountId]) {
    dbPromises[accountId] = openDB<MaalDB>(`maal-db-${accountId}`, 1, {
      upgrade(db) {
        const store = db.createObjectStore("transactions", { keyPath: "id" });
        store.createIndex("by-timestamp", "timestamp");
        store.createIndex("by-sync", "sync_status");
      },
    });
  }
  return dbPromises[accountId];
}

export async function listTransactions(accountId: string): Promise<Transaction[]> {
  const db = await getDB(accountId);
  const all = await db.getAllFromIndex("transactions", "by-timestamp");
  return all
    .filter((t) => t.sync_status !== "pending_delete")
    .reverse();
}

export async function addTransaction(
  accountId: string,
  tx: Omit<Transaction, "id" | "sync_status" | "last_updated">,
) {
  const db = await getDB(accountId);
  const now = new Date().toISOString();
  const record: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    sync_status: "pending_insert",
    last_updated: now,
  };
  await db.add("transactions", record);
  return record;
}

export async function deleteTransaction(accountId: string, id: string) {
  const db = await getDB(accountId);
  const existing = await db.get("transactions", id);
  if (!existing) return;
  if (existing.sync_status === "pending_insert") {
    await db.delete("transactions", id);
  } else {
    await db.put("transactions", {
      ...existing,
      sync_status: "pending_delete",
      last_updated: new Date().toISOString(),
    });
  }
}

export async function pendingCount(accountId: string): Promise<number> {
  const db = await getDB(accountId);
  const tx = db.transaction("transactions");
  let count = 0;
  for await (const cursor of tx.store) {
    if (cursor.value.sync_status !== "synced") count++;
  }
  return count;
}

export async function markAllSynced(accountId: string) {
  const db = await getDB(accountId);
  const tx = db.transaction("transactions", "readwrite");
  for await (const cursor of tx.store) {
    if (cursor.value.sync_status === "pending_delete") {
      await cursor.delete();
    } else if (cursor.value.sync_status === "pending_insert") {
      await cursor.update({ ...cursor.value, sync_status: "synced" });
    }
  }
  await tx.done;
}

export async function clearAndImportTransactions(accountId: string, txs: Transaction[]) {
  const db = await getDB(accountId);
  const tx = db.transaction("transactions", "readwrite");
  await tx.store.clear();
  for (const record of txs) {
    await tx.store.put(record);
  }
  await tx.done;
}

export async function listAllRawTransactions(accountId: string): Promise<Transaction[]> {
  const db = await getDB(accountId);
  return await db.getAll("transactions");
}

