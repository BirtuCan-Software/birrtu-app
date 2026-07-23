import assert from "node:assert/strict";
import test from "node:test";
import {
  getSyncBundle,
  saveDeviceJournal,
  saveWorkspaceCatalog,
} from "./gdrive.ts";
import type { CloudJournalV2 } from "./sync-engine.ts";

test("loads the legacy baseline and every device journal", async () => {
  const originalFetch = globalThis.fetch;
  const journal = (deviceId: string): CloudJournalV2 => ({
    schemaVersion: 2,
    userId: "user",
    workspaceId: "primary",
    deviceId,
    updatedAt: "2026-01-01T00:00:00Z",
    wallets: [],
    transactions: [],
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/drive/v3/files?")) {
      return Response.json({
        files: [
          { id: "legacy", name: "maal_sync_user.json" },
          { id: "a", name: "maal_journal_v2_user_primary_device-a.json" },
          { id: "b", name: "maal_journal_v2_user_primary_device-b.json" },
        ],
      });
    }
    if (url.includes("/legacy?")) {
      return Response.json({ wallets: [], transactions: [], lastSyncedAt: "2025-01-01" });
    }
    if (url.includes("/a?")) return Response.json(journal("device-a"));
    if (url.includes("/b?")) return Response.json(journal("device-b"));
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const bundle = await getSyncBundle(
      "token",
      "user",
      "primary",
      "device-b",
    );
    assert.equal(bundle.journals.length, 2);
    assert.equal(bundle.ownFileId, "b");
    assert.equal(bundle.legacy?.lastSyncedAt, "2025-01-01");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updates only the current device journal", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestMethod = "";
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestMethod = init?.method || "GET";
    return Response.json({});
  };
  const journal: CloudJournalV2 = {
    schemaVersion: 2,
    userId: "user",
    workspaceId: "primary",
    deviceId: "device-a",
    updatedAt: "2026-01-01T00:00:00Z",
    wallets: [],
    transactions: [],
  };

  try {
    await saveDeviceJournal(
      "token",
      "user",
      "primary",
      "device-a",
      "own-file",
      journal,
    );
    assert.match(requestUrl, /\/own-file\?uploadType=media$/);
    assert.equal(requestMethod, "PATCH");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("creates a journal in the selected workspace namespace", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody = "";
  globalThis.fetch = async (_input, init) => {
    requestBody = String(init?.body || "");
    return Response.json({ id: "created" });
  };
  const journal: CloudJournalV2 = {
    schemaVersion: 2,
    userId: "user",
    workspaceId: "workspace_business",
    deviceId: "device-a",
    updatedAt: "2026-01-01T00:00:00Z",
    wallets: [],
    transactions: [],
  };

  try {
    await saveDeviceJournal(
      "token",
      "user",
      "workspace_business",
      "device-a",
      null,
      journal,
    );
    assert.match(
      requestBody,
      /maal_journal_v2_user_workspace_business_device-a\.json/,
    );
    assert.match(requestBody, /"workspaceId":"workspace_business"/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reports expired Drive authorization distinctly", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 401 });
  try {
    await assert.rejects(
      getSyncBundle("expired", "user", "primary", "device"),
      /UNAUTHORIZED/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("loads only journals belonging to the selected workspace", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/drive/v3/files?")) {
      return Response.json({
        files: [
          {
            id: "primary",
            name: "maal_journal_v2_user_primary_device-a.json",
          },
          {
            id: "business",
            name: "maal_journal_v2_user_workspace_business_device-a.json",
          },
        ],
      });
    }
    const workspaceId = url.includes("/business?")
      ? "workspace_business"
      : "primary";
    return Response.json({
      schemaVersion: 2,
      userId: "user",
      workspaceId,
      deviceId: "device-a",
      updatedAt: "2026-01-01T00:00:00Z",
      wallets: [{ id: workspaceId }],
      transactions: [],
    });
  };

  try {
    const bundle = await getSyncBundle(
      "token",
      "user",
      "primary",
      "device-a",
    );
    assert.equal(bundle.journals.length, 1);
    assert.equal(bundle.journals[0].workspaceId, "primary");
    assert.deepEqual(
      bundle.journals[0].wallets.map((wallet) => wallet.id),
      ["primary"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updates only the current device workspace catalog", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  globalThis.fetch = async (input) => {
    requestUrl = String(input);
    return Response.json({});
  };

  try {
    await saveWorkspaceCatalog("token", "user", "device-a", "catalog-file", {
      schemaVersion: 1,
      userId: "user",
      deviceId: "device-a",
      updatedAt: "2026-01-01T00:00:00Z",
      workspaces: [],
    });
    assert.match(requestUrl, /\/catalog-file\?uploadType=media$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
