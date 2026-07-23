import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeWorkspaceCatalogs,
  type CloudWorkspace,
  type WorkspaceCatalog,
} from "./workspace-sync.ts";

const workspace = (
  syncId: string,
  name: string,
  updatedAt: string,
  originDeviceId: string,
  deleted = false,
): CloudWorkspace => ({
  syncId,
  name,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt,
  originDeviceId,
  deleted,
});

test("workspace catalogs retain isolated workspaces from every device", () => {
  const catalog = (
    deviceId: string,
    workspaces: CloudWorkspace[],
  ): WorkspaceCatalog => ({
    schemaVersion: 1,
    userId: "user",
    deviceId,
    updatedAt: "2026-01-01T00:00:00Z",
    workspaces,
  });
  const result = mergeWorkspaceCatalogs(
    [
      catalog("a", [workspace("personal", "Personal", "2026-01-01", "a")]),
      catalog("b", [workspace("business", "Business", "2026-01-02", "b")]),
    ],
    [],
  );
  assert.deepEqual(
    result.map((item) => item.syncId).sort(),
    ["business", "personal"],
  );
});

test("newer workspace deletion wins and remains a tombstone", () => {
  const result = mergeWorkspaceCatalogs(
    [],
    [
      workspace("business", "Business", "2026-01-01", "a"),
      workspace("business", "Business", "2026-01-02", "b", true),
    ],
  );
  assert.equal(result[0].deleted, true);
});

test("a local workspace created during sync survives stale catalog reconciliation", () => {
  const result = mergeWorkspaceCatalogs(
    [],
    [
      workspace("primary", "Primary", "2026-01-01", "a"),
      workspace("new-local", "New local", "2026-01-02", "b"),
    ],
  );
  assert.deepEqual(
    result.map((item) => item.syncId).sort(),
    ["new-local", "primary"],
  );
});
