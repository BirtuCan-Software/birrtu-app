import assert from "node:assert/strict";
import test from "node:test";
import { generateUUID, installUUIDPolyfill } from "./uuid.ts";

test("generates valid RFC4122 v4 UUID format", () => {
  const uuid = generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.match(uuid, uuidRegex);
});

test("generates unique IDs across multiple calls", () => {
  const ids = new Set<string>();
  for (let i = 0; i < 50; i++) {
    ids.add(generateUUID());
  }
  assert.equal(ids.size, 50);
});

test("falls back gracefully when crypto.randomUUID is not present", () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const originalCrypto = globalThis.crypto;
  try {
    // Simulate insecure context where crypto.randomUUID is undefined but getRandomValues exists
    const mockCrypto = {
      getRandomValues: (buf: Uint8Array) => originalCrypto.getRandomValues(buf),
    };
    Object.defineProperty(globalThis, "crypto", {
      value: mockCrypto,
      configurable: true,
      writable: true,
    });
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(uuid, uuidRegex);
  } finally {
    if (desc) {
      Object.defineProperty(globalThis, "crypto", desc);
    }
  }
});

test("falls back gracefully when crypto is completely absent", () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  try {
    // Simulate environment without Web Crypto API
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(uuid, uuidRegex);
  } finally {
    if (desc) {
      Object.defineProperty(globalThis, "crypto", desc);
    }
  }
});

test("polyfill installs randomUUID and satisfies callers without recursion", () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  try {
    const mockCrypto: any = {};
    Object.defineProperty(globalThis, "crypto", {
      value: mockCrypto,
      configurable: true,
      writable: true,
    });
    installUUIDPolyfill();
    assert.equal(typeof (globalThis.crypto as any).randomUUID, "function");
    const uuid = (globalThis.crypto as any).randomUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(uuid, uuidRegex);
  } finally {
    if (desc) {
      Object.defineProperty(globalThis, "crypto", desc);
    }
  }
});
