import assert from "node:assert/strict";
import test from "node:test";
import {
  deviceLockForSync,
  hasLocalDeviceLock,
  installSyncedDeviceLock,
  mergeSyncedSettings,
  saveLocalPinVerifier,
  settingsForSync,
  verifyLocalPin,
} from "./device-lock.ts";
import type { Settings } from "./settings.tsx";

const localSettings: Settings = {
  preset: "tangelo",
  mode: "dark",
  font: "geometric",
  autoSync: false,
  deviceLock: false,
  timeFormat: "12hr",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function storage(entries: Record<string, string> = {}) {
  return {
    getItem: (key: string) => entries[key] ?? null,
    setItem: (key: string, value: string) => {
      entries[key] = value;
    },
    removeItem: (key: string) => {
      delete entries[key];
    },
  };
}

test("a synced device lock cannot lock a device without local credentials", () => {
  const merged = mergeSyncedSettings(localSettings, {
    deviceLock: true,
    autoSync: true,
  });

  assert.equal(merged.deviceLock, false);
  assert.equal(merged.autoSync, true);
  assert.equal(hasLocalDeviceLock("new-device-workspace", storage()), false);
});

test("only complete local PIN or passkey credentials enable the lock", () => {
  const accountId = "workspace";
  const pinKey = `maal-device-pin-v1-${accountId}`;
  const typeKey = `maal-device-lock-type-v1-${accountId}`;
  const passkeyKey = `maal-device-passkey-id-v1-${accountId}`;

  assert.equal(
    hasLocalDeviceLock(accountId, storage({ [typeKey]: "pin", [pinKey]: "1234" })),
    true,
  );
  assert.equal(
    hasLocalDeviceLock(
      accountId,
      storage({ [typeKey]: "passkey", [pinKey]: "1234", [passkeyKey]: "credential" }),
    ),
    true,
  );
  assert.equal(
    hasLocalDeviceLock(accountId, storage({ [typeKey]: "passkey", [pinKey]: "1234" })),
    false,
  );
});

test("device lock is not embedded in general synced settings", () => {
  assert.equal("deviceLock" in settingsForSync({ ...localSettings, deviceLock: true }), false);
});

test("a PIN verifier syncs and unlocks a new device without exposing the PIN", async () => {
  const oldDevice = storage({
    "maal-device-lock-type-v1-workspace": "pin",
    "maal-device-pin-v1-workspace": "1234",
  });
  const syncedLock = await deviceLockForSync(
    "workspace",
    true,
    "2026-01-01T00:00:00.000Z",
    oldDevice,
  );
  const newDevice = storage();

  assert.ok(syncedLock);
  assert.equal(JSON.stringify(syncedLock).includes("1234"), false);
  assert.equal(installSyncedDeviceLock("workspace", syncedLock, newDevice), true);
  assert.equal(hasLocalDeviceLock("workspace", newDevice), true);
  assert.equal(await verifyLocalPin("workspace", "1234", newDevice), true);
  assert.equal(await verifyLocalPin("workspace", "9999", newDevice), false);
});

test("new PIN setup immediately creates its portable verifier", async () => {
  const device = storage();
  await saveLocalPinVerifier("workspace", "2468", device);
  assert.equal(await verifyLocalPin("workspace", "2468", device), true);
});
