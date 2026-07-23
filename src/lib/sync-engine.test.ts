import assert from "node:assert/strict";
import test from "node:test";
import type { Transaction, Wallet } from "./db.ts";
import {
  hasGenuineLocalChanges,
  mergeSyncSources,
  needsFirstSyncDecision,
} from "./sync-engine.ts";

const wallet = (
  id: string,
  name: string,
  updated: string,
  device: string,
  deleted = false,
): Wallet => ({
  id,
  name,
  type: "cash",
  last_updated: updated,
  origin_device_id: device,
  sync_status: "synced",
  deleted,
});

const transaction = (
  id: string,
  updated: string,
  device: string,
  deleted = false,
): Transaction => ({
  id,
  amount: 10,
  type: "income",
  account: "cash",
  description: id,
  timestamp: updated,
  last_updated: updated,
  origin_device_id: device,
  sync_status: deleted ? "pending_delete" : "synced",
  deleted,
});

test("fresh local state downloads cloud state without erasing it", () => {
  const result = mergeSyncSources(
    {
      wallets: [wallet("cloud", "Cloud", "2026-01-01T00:00:00Z", "old")],
      transactions: [],
      lastSyncedAt: "2026-01-01T00:00:00Z",
    },
    [],
    undefined,
  );
  assert.deepEqual(result.wallets.map((item) => item.id), ["cloud"]);
});

test("only explicit pending records count as pre-sync local changes", () => {
  assert.equal(hasGenuineLocalChanges([], []), false);
  assert.equal(
    hasGenuineLocalChanges(
      [
        {
          ...wallet("new", "New", "2026-01-01T00:00:00Z", "device"),
          sync_status: "pending_insert",
        },
      ],
      [],
    ),
    true,
  );
});

test("first sync prompts only when both cloud and pending local data exist", () => {
  const legacy = {
    wallets: [wallet("cloud", "Cloud", "2026-01-01T00:00:00Z", "legacy")],
    transactions: [],
  };
  const pendingWallet = {
    ...wallet("local", "Local", "2026-01-02T00:00:00Z", "device"),
    sync_status: "pending_insert" as const,
  };

  assert.equal(needsFirstSyncDecision(false, legacy, [], [], []), false);
  assert.equal(
    needsFirstSyncDecision(false, legacy, [], [pendingWallet], []),
    true,
  );
  assert.equal(
    needsFirstSyncDecision(true, legacy, [], [pendingWallet], []),
    false,
  );
});

test("independent additions from devices are retained", () => {
  const result = mergeSyncSources(null, [
    {
      schemaVersion: 2,
      userId: "user",
      deviceId: "a",
      updatedAt: "2026-01-01T00:00:00Z",
      wallets: [wallet("a", "A", "2026-01-01T00:00:00Z", "a")],
      transactions: [],
    },
    {
      schemaVersion: 2,
      userId: "user",
      deviceId: "b",
      updatedAt: "2026-01-02T00:00:00Z",
      wallets: [wallet("b", "B", "2026-01-02T00:00:00Z", "b")],
      transactions: [],
    },
  ]);
  assert.deepEqual(
    result.wallets.map((item) => item.id).sort(),
    ["a", "b"],
  );
});

test("newest same-wallet edit wins with a deterministic device tie-break", () => {
  const result = mergeSyncSources(null, [
    {
      schemaVersion: 2,
      userId: "user",
      deviceId: "a",
      updatedAt: "2026-01-01T00:00:00Z",
      wallets: [wallet("cash", "Older", "2026-01-02T00:00:00Z", "a")],
      transactions: [],
    },
    {
      schemaVersion: 2,
      userId: "user",
      deviceId: "b",
      updatedAt: "2026-01-01T00:00:00Z",
      wallets: [wallet("cash", "Winner", "2026-01-02T00:00:00Z", "b")],
      transactions: [],
    },
  ]);
  assert.equal(result.wallets[0].name, "Winner");
});

test("newer tombstones prevent stale resurrection", () => {
  const result = mergeSyncSources(null, [
    {
      schemaVersion: 2,
      userId: "user",
      deviceId: "old",
      updatedAt: "2026-01-01T00:00:00Z",
      wallets: [],
      transactions: [
        transaction("tx", "2026-01-01T00:00:00Z", "old"),
      ],
    },
    {
      schemaVersion: 2,
      userId: "user",
      deviceId: "new",
      updatedAt: "2026-01-02T00:00:00Z",
      wallets: [],
      transactions: [
        transaction("tx", "2026-01-02T00:00:00Z", "new", true),
      ],
    },
  ]);
  assert.equal(result.transactions[0].deleted, true);
});
