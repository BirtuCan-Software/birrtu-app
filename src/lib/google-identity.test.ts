import assert from "node:assert/strict";
import test from "node:test";
import {
  cacheDriveAccessToken,
  clearDriveAccessToken,
  restoreDriveAccessToken,
} from "./google-identity.ts";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test("restores a valid Drive token only for the same Google account", () => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });

  cacheDriveAccessToken("token", "person@example.com", 3600);
  assert.equal(restoreDriveAccessToken("person@example.com"), "token");
  assert.equal(restoreDriveAccessToken("someone-else@example.com"), null);
  clearDriveAccessToken();
});
