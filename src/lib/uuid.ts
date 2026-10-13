/**
 * Universal UUID v4 generator with fallbacks for insecure contexts (HTTP / local IP),
 * older browsers, and non-secure environments where `crypto.randomUUID` is unavailable.
 */
export function generateUUID(): string {
  // 1. Native crypto.randomUUID (available in secure contexts & modern Node.js)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function" &&
    crypto.randomUUID !== generateUUID
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to fallback
    }
  }

  // 2. crypto.getRandomValues (available in most browsers, even in non-secure contexts)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC4122 version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC4122 variant

      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch {
      // Fall through to Math.random
    }
  }

  // 3. Fallback using Math.random for environments without Web Crypto API
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Global polyfill: guarantees that external dependencies or callers of crypto.randomUUID()
 * do not throw "crypto.randomUUID is not a function" even on HTTP / non-secure contexts.
 */
export function installUUIDPolyfill(): void {
  try {
    if (
      typeof Crypto !== "undefined" &&
      Crypto.prototype &&
      typeof Crypto.prototype.randomUUID !== "function"
    ) {
      Object.defineProperty(Crypto.prototype, "randomUUID", {
        value: generateUUID,
        writable: true,
        configurable: true,
      });
    }
  } catch {
    // Ignore if not permitted
  }

  try {
    if (typeof globalThis !== "undefined") {
      const gCrypto = globalThis.crypto;
      if (!gCrypto) {
        Object.defineProperty(globalThis, "crypto", {
          value: { randomUUID: generateUUID },
          configurable: true,
          writable: true,
        });
      } else if (typeof gCrypto.randomUUID !== "function") {
        try {
          Object.defineProperty(gCrypto, "randomUUID", {
            value: generateUUID,
            writable: true,
            configurable: true,
          });
        } catch {
          (gCrypto as any).randomUUID = generateUUID;
        }
      }
    }
  } catch {
    // Ignore if not permitted
  }
}

// Automatically install on module import
installUUIDPolyfill();
