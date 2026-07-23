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
  sync_status?: SyncStatus;
  last_updated?: string;
  origin_device_id?: string;
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
  deleted?: boolean;
  origin_device_id?: string;
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
    .filter((t) => !t.deleted && t.sync_status !== "pending_delete")
    .reverse();
}

export async function addTransaction(
  accountId: string,
  tx: Omit<Transaction, "id" | "sync_status" | "last_updated">,
  deviceId?: string,
) {
  const db = await getDB(accountId);
  const now = new Date().toISOString();
  const record: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    sync_status: "pending_insert",
    last_updated: now,
    origin_device_id: deviceId,
  };
  await db.add("transactions", record);
  return record;
}

export async function deleteTransaction(
  accountId: string,
  id: string,
  deviceId?: string,
) {
  const db = await getDB(accountId);
  const existing = await db.get("transactions", id);
  if (!existing) return;
  if (existing.sync_status === "pending_insert") {
    await db.delete("transactions", id);
  } else {
    await db.put("transactions", {
      ...existing,
      deleted: true,
      sync_status: "pending_delete",
      last_updated: new Date().toISOString(),
      origin_device_id: deviceId || existing.origin_device_id,
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
    if (cursor.value.sync_status !== "synced") {
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

export async function mergeImportTransactions(
  accountId: string,
  transactions: Transaction[],
) {
  const db = await getDB(accountId);
  const tx = db.transaction("transactions", "readwrite");
  for (const incoming of transactions) {
    const existing = await tx.store.get(incoming.id);
    const existingTime = Date.parse(existing?.last_updated || "1970-01-01") || 0;
    const incomingTime = Date.parse(incoming.last_updated || "1970-01-01") || 0;
    const existingDevice = existing?.origin_device_id || "";
    const incomingDevice = incoming.origin_device_id || "";
    if (
      existing &&
      (existingTime > incomingTime ||
        (existingTime === incomingTime && existingDevice > incomingDevice))
    ) {
      continue;
    }
    await tx.store.put(incoming);
  }
  await tx.done;
}

export async function listAllRawTransactions(accountId: string): Promise<Transaction[]> {
  const db = await getDB(accountId);
  return await db.getAll("transactions");
}
