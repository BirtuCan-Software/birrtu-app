import type { Transaction, Wallet } from "./db";
import type { Settings } from "./settings";
import type { SyncedDeviceLock } from "./device-lock";

export interface CloudDeviceLockState {
  enabled: boolean;
  updatedAt: string;
  verifier?: SyncedDeviceLock;
}

export interface CloudJournalV2 {
  schemaVersion: 2;
  userId: string;
  workspaceId?: string;
  deviceId: string;
  updatedAt: string;
  wallets: Wallet[];
  transactions: Transaction[];
  settings?: Partial<Settings>;
  deviceLock?: CloudDeviceLockState;
}

export interface LegacySyncData {
  wallets?: Wallet[];
  transactions?: Transaction[];
  settings?: Partial<Settings>;
  deviceLock?: SyncedDeviceLock;
  lastSyncedAt?: string;
}

export interface MergedSyncData {
  wallets: Wallet[];
  transactions: Transaction[];
  settings?: Partial<Settings>;
  deviceLock?: CloudDeviceLockState;
}

const EPOCH = "1970-01-01T00:00:00.000Z";

function versionOf(
  record: { last_updated?: string; origin_device_id?: string },
  fallbackTime = EPOCH,
  fallbackDevice = "",
) {
  return [
    Date.parse(record.last_updated || fallbackTime) || 0,
    record.origin_device_id || fallbackDevice,
  ] as const;
}

function newer<T extends { last_updated?: string; origin_device_id?: string }>(
  current: T | undefined,
  candidate: T,
) {
  if (!current) return candidate;
  const [currentTime, currentDevice] = versionOf(current);
  const [candidateTime, candidateDevice] = versionOf(candidate);
  if (candidateTime !== currentTime) {
    return candidateTime > currentTime ? candidate : current;
  }
  return candidateDevice > currentDevice ? candidate : current;
}

function mergeRecords<T extends { id: string; last_updated?: string; origin_device_id?: string }>(
  sources: T[][],
) {
  const records = new Map<string, T>();
  for (const source of sources) {
    for (const record of source) {
      records.set(record.id, newer(records.get(record.id), record));
    }
  }
  return Array.from(records.values());
}

function newestByUpdatedAt<T extends { updatedAt?: string }>(values: T[]) {
  return values.reduce<T | undefined>((latest, value) => {
    if (!latest) return value;
    return (Date.parse(value.updatedAt || EPOCH) || 0) >
      (Date.parse(latest.updatedAt || EPOCH) || 0)
      ? value
      : latest;
  }, undefined);
}

export function normalizeWallet(
  wallet: Wallet,
  fallbackTime: string,
  fallbackDevice: string,
): Wallet {
  return {
    ...wallet,
    deleted: !!wallet.deleted,
    sync_status: wallet.sync_status || "synced",
    last_updated: wallet.last_updated || fallbackTime,
    origin_device_id: wallet.origin_device_id || fallbackDevice,
  };
}

export function normalizeTransaction(
  transaction: Transaction,
  fallbackTime: string,
  fallbackDevice: string,
): Transaction {
  return {
    ...transaction,
    deleted:
      !!transaction.deleted || transaction.sync_status === "pending_delete",
    sync_status: transaction.sync_status || "synced",
    last_updated: transaction.last_updated || fallbackTime,
    origin_device_id: transaction.origin_device_id || fallbackDevice,
  };
}

export function mergeSyncSources(
  legacy: LegacySyncData | null,
  journals: CloudJournalV2[],
  local?: {
    wallets: Wallet[];
    transactions: Transaction[];
    settings: Settings;
    deviceLock?: CloudDeviceLockState;
    deviceId: string;
  },
): MergedSyncData {
  const walletSources: Wallet[][] = [];
  const transactionSources: Transaction[][] = [];
  const settings: Partial<Settings>[] = [];
  const locks: CloudDeviceLockState[] = [];

  if (legacy) {
    const fallback = legacy.lastSyncedAt || EPOCH;
    walletSources.push(
      (legacy.wallets || []).map((wallet) =>
        normalizeWallet(wallet, fallback, "legacy"),
      ),
    );
    transactionSources.push(
      (legacy.transactions || []).map((transaction) =>
        normalizeTransaction(transaction, fallback, "legacy"),
      ),
    );
    if (legacy.settings) settings.push(legacy.settings);
    if (legacy.deviceLock) {
      locks.push({
        enabled: true,
        updatedAt: legacy.deviceLock.updatedAt,
        verifier: legacy.deviceLock,
      });
    }
  }

  for (const journal of journals) {
    walletSources.push(
      journal.wallets.map((wallet) =>
        normalizeWallet(wallet, journal.updatedAt, journal.deviceId),
      ),
    );
    transactionSources.push(
      journal.transactions.map((transaction) =>
        normalizeTransaction(transaction, journal.updatedAt, journal.deviceId),
      ),
    );
    if (journal.settings) settings.push(journal.settings);
    if (journal.deviceLock) locks.push(journal.deviceLock);
  }

  if (local) {
    const now = new Date().toISOString();
    walletSources.push(
      local.wallets.map((wallet) =>
        normalizeWallet(wallet, now, local.deviceId),
      ),
    );
    transactionSources.push(
      local.transactions.map((transaction) =>
        normalizeTransaction(transaction, now, local.deviceId),
      ),
    );
    settings.push(local.settings);
    if (local.deviceLock) locks.push(local.deviceLock);
  }

  return {
    wallets: mergeRecords(walletSources),
    transactions: mergeRecords(transactionSources),
    settings: newestByUpdatedAt(settings),
    deviceLock: newestByUpdatedAt(locks),
  };
}

export function hasCloudData(
  legacy: LegacySyncData | null,
  journals: CloudJournalV2[],
) {
  return !!legacy || journals.length > 0;
}

export function hasGenuineLocalChanges(
  wallets: Wallet[],
  transactions: Transaction[],
) {
  return (
    wallets.some((wallet) => wallet.sync_status !== "synced") ||
    transactions.some((transaction) => transaction.sync_status !== "synced")
  );
}

export function needsFirstSyncDecision(
  hasBaseline: boolean,
  legacy: LegacySyncData | null,
  journals: CloudJournalV2[],
  wallets: Wallet[],
  transactions: Transaction[],
) {
  return (
    !hasBaseline &&
    hasCloudData(legacy, journals) &&
    hasGenuineLocalChanges(wallets, transactions)
  );
}

export function markMergedRecordsSynced(data: MergedSyncData): MergedSyncData {
  return {
    ...data,
    wallets: data.wallets.map((wallet) => ({
      ...wallet,
      sync_status: "synced",
    })),
    transactions: data.transactions.map((transaction) => ({
      ...transaction,
      sync_status: "synced",
    })),
  };
}
