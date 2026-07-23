import type { Settings } from "./settings";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface SyncedDeviceLock {
  algorithm: "PBKDF2-SHA-256";
  salt: string;
  hash: string;
  iterations: number;
  updatedAt: string;
}

const ITERATIONS = 210_000;

function verifierKey(accountId: string) {
  return `maal-device-pin-verifier-v1-${accountId}`;
}

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decode(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function isVerifier(value: unknown): value is SyncedDeviceLock {
  const verifier = value as Partial<SyncedDeviceLock>;
  return (
    verifier?.algorithm === "PBKDF2-SHA-256" &&
    typeof verifier.salt === "string" &&
    typeof verifier.hash === "string" &&
    Number.isInteger(verifier.iterations) &&
    (verifier.iterations || 0) > 0 &&
    typeof verifier.updatedAt === "string"
  );
}

function readVerifier(accountId: string, storage: ReadableStorage) {
  try {
    const value = storage.getItem(verifierKey(accountId));
    const parsed = value ? JSON.parse(value) : null;
    return isVerifier(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function derivePin(pin: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      256,
    ),
  );
}

export async function saveLocalPinVerifier(
  accountId: string,
  pin: string,
  storage: WritableStorage = localStorage,
) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier: SyncedDeviceLock = {
    algorithm: "PBKDF2-SHA-256",
    salt: encode(salt),
    hash: encode(await derivePin(pin, salt, ITERATIONS)),
    iterations: ITERATIONS,
    updatedAt: new Date().toISOString(),
  };
  storage.setItem(verifierKey(accountId), JSON.stringify(verifier));
  return verifier;
}

export async function verifyLocalPin(
  accountId: string,
  pin: string,
  storage: ReadableStorage = localStorage,
) {
  const savedPin = storage.getItem(`maal-device-pin-v1-${accountId}`);
  if (savedPin) return pin === savedPin;

  const verifier = readVerifier(accountId, storage);
  if (!verifier) return false;

  const actual = await derivePin(pin, decode(verifier.salt), verifier.iterations);
  const expected = decode(verifier.hash);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index++) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

export async function deviceLockForSync(
  accountId: string,
  enabled: boolean,
  updatedAt: string,
  storage: WritableStorage = localStorage,
) {
  if (!enabled) return undefined;

  const existing = readVerifier(accountId, storage);
  if (existing) return { ...existing, updatedAt };

  const pin = storage.getItem(`maal-device-pin-v1-${accountId}`);
  if (!pin) return undefined;
  return { ...(await saveLocalPinVerifier(accountId, pin, storage)), updatedAt };
}

export function installSyncedDeviceLock(
  accountId: string,
  verifier: unknown,
  storage: WritableStorage = localStorage,
) {
  if (!isVerifier(verifier)) return false;
  storage.setItem(verifierKey(accountId), JSON.stringify(verifier));
  storage.removeItem(`maal-device-pin-v1-${accountId}`);
  if (!storage.getItem(`maal-device-lock-type-v1-${accountId}`)) {
    storage.setItem(`maal-device-lock-type-v1-${accountId}`, "pin");
  }
  return true;
}

export function hasLocalDeviceLock(
  accountId: string | null,
  storage: ReadableStorage = localStorage,
) {
  if (!accountId) return false;

  const pin = storage.getItem(`maal-device-pin-v1-${accountId}`);
  const verifier = readVerifier(accountId, storage);
  const lockType = storage.getItem(`maal-device-lock-type-v1-${accountId}`);

  if (lockType === "pin") return !!pin || !!verifier;
  if (lockType === "passkey") {
    return (
      (!!pin || !!verifier) &&
      !!storage.getItem(`maal-device-passkey-id-v1-${accountId}`)
    );
  }
  return false;
}

export function mergeSyncedSettings(
  localSettings: Settings,
  remoteSettings: Partial<Settings>,
): Settings {
  const { deviceLock: _remoteDeviceLock, ...syncableRemoteSettings } = remoteSettings;
  return { ...localSettings, ...syncableRemoteSettings };
}

export function settingsForSync(settings: Settings): Omit<Settings, "deviceLock"> {
  const { deviceLock: _deviceLock, ...syncableSettings } = settings;
  return syncableSettings;
}
