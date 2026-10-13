/**
 * Google Drive AppData transport. V2 uses one journal per device so devices
 * never overwrite each other's files.
 */

import type { CloudJournalV2, LegacySyncData } from "./sync-engine";
import type { WorkspaceCatalog } from "./workspace-sync";
import { generateUUID } from "./uuid.ts";

interface DriveFile {
  id: string;
  name: string;
}

export interface SyncBundle {
  legacy: LegacySyncData | null;
  journals: CloudJournalV2[];
  ownFileId: string | null;
  workspaceCatalogs: WorkspaceCatalog[];
  ownCatalogFileId: string | null;
}

function legacyName(userId: string) {
  return `maal_sync_${userId}.json`;
}

function journalPrefix(userId: string) {
  return `maal_journal_v2_${userId}_`;
}

function journalName(userId: string, workspaceId: string, deviceId: string) {
  return `${journalPrefix(userId)}${workspaceId}_${deviceId}.json`;
}

function catalogPrefix(userId: string) {
  return `maal_workspace_catalog_v1_${userId}_`;
}

function catalogName(userId: string, deviceId: string) {
  return `${catalogPrefix(userId)}${deviceId}.json`;
}

async function driveFetch(token: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) {
    throw new Error(`Google Drive request failed: ${await response.text()}`);
  }
  return response;
}

async function listSyncFiles(token: string, userId: string) {
  const legacy = legacyName(userId).replace(/'/g, "\\'");
  const prefix = journalPrefix(userId).replace(/'/g, "\\'");
  const catalogs = catalogPrefix(userId).replace(/'/g, "\\'");
  const query = encodeURIComponent(
    `trashed = false and 'appDataFolder' in parents and (name = '${legacy}' or name contains '${prefix}' or name contains '${catalogs}')`,
  );
  let pageToken = "";
  const files: DriveFile[] = [];

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("spaces", "appDataFolder");
    url.searchParams.set("q", decodeURIComponent(query));
    url.searchParams.set("fields", "nextPageToken,files(id,name)");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await driveFetch(token, url.toString());
    const page = await response.json();
    files.push(...(page.files || []));
    pageToken = page.nextPageToken || "";
  } while (pageToken);

  return files;
}

async function downloadJson(token: string, fileId: string) {
  const response = await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
  );
  return response.json();
}

async function maybeDownloadJson(token: string, file: DriveFile) {
  try {
    return await downloadJson(token, file.id);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      throw error;
    }
    console.warn("Skipping unreadable Google Drive sync file:", file.name, error);
    return null;
  }
}

function isCloudJournal(
  data: unknown,
  userId: string,
  workspaceId: string,
): data is CloudJournalV2 {
  if (!data || typeof data !== "object") return false;
  const journal = data as Partial<CloudJournalV2>;
  return (
    journal.schemaVersion === 2 &&
    journal.userId === userId &&
    (journal.workspaceId || "primary") === workspaceId &&
    typeof journal.deviceId === "string" &&
    typeof journal.updatedAt === "string" &&
    Array.isArray(journal.wallets) &&
    Array.isArray(journal.transactions)
  );
}

function isWorkspaceCatalog(
  data: unknown,
  userId: string,
): data is WorkspaceCatalog {
  if (!data || typeof data !== "object") return false;
  const catalog = data as Partial<WorkspaceCatalog>;
  return (
    catalog.schemaVersion === 1 &&
    catalog.userId === userId &&
    typeof catalog.deviceId === "string" &&
    typeof catalog.updatedAt === "string" &&
    Array.isArray(catalog.workspaces)
  );
}

export async function getSyncBundle(
  token: string,
  userId: string,
  workspaceId: string,
  deviceId: string,
): Promise<SyncBundle> {
  const files = await listSyncFiles(token, userId);
  const ownName = journalName(userId, workspaceId, deviceId);
  const ownCatalogName = catalogName(userId, deviceId);
  const legacyFile = files.find((file) => file.name === legacyName(userId));
  const journalFiles = files.filter((file) =>
    file.name.startsWith(journalPrefix(userId)),
  );
  const catalogFiles = files.filter((file) =>
    file.name.startsWith(catalogPrefix(userId)),
  );

  const [legacy, journalValues, catalogValues] = await Promise.all([
    workspaceId === "primary" && legacyFile
      ? maybeDownloadJson(token, legacyFile)
      : null,
    Promise.all(
      journalFiles.map(async (file) => ({
        file,
        data: await maybeDownloadJson(token, file),
      })),
    ),
    Promise.all(
      catalogFiles.map(async (file) => ({
        file,
        data: await maybeDownloadJson(token, file),
      })),
    ),
  ]);

  return {
    legacy,
    journals: journalValues
      .map(({ data }) => data)
      .filter(
        (data): data is CloudJournalV2 =>
          isCloudJournal(data, userId, workspaceId),
      ),
    ownFileId:
      journalValues.find(({ file }) => file.name === ownName)?.file.id || null,
    workspaceCatalogs: catalogValues
      .map(({ data }) => data)
      .filter(
        (data): data is WorkspaceCatalog =>
          isWorkspaceCatalog(data, userId),
      ),
    ownCatalogFileId:
      catalogValues.find(({ file }) => file.name === ownCatalogName)?.file.id ||
      null,
  };
}

export async function saveDeviceJournal(
  token: string,
  userId: string,
  workspaceId: string,
  deviceId: string,
  fileId: string | null,
  journal: CloudJournalV2,
) {
  if (fileId) {
    await driveFetch(
      token,
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journal),
      },
    );
    return fileId;
  }

  const boundary = `birrtu_${generateUUID()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const body = [
    delimiter,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify({
      name: journalName(userId, workspaceId, deviceId),
      parents: ["appDataFolder"],
    }),
    delimiter,
    "Content-Type: application/json\r\n\r\n",
    JSON.stringify(journal),
    `\r\n--${boundary}--`,
  ].join("");

  const response = await driveFetch(
    token,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  const result = await response.json();
  return result.id as string;
}

export async function saveWorkspaceCatalog(
  token: string,
  userId: string,
  deviceId: string,
  fileId: string | null,
  catalog: WorkspaceCatalog,
) {
  if (fileId) {
    await driveFetch(
      token,
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catalog),
      },
    );
    return fileId;
  }

  const boundary = `birrtu_${generateUUID()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const body = [
    delimiter,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify({
      name: catalogName(userId, deviceId),
      parents: ["appDataFolder"],
    }),
    delimiter,
    "Content-Type: application/json\r\n\r\n",
    JSON.stringify(catalog),
    `\r\n--${boundary}--`,
  ].join("");
  const response = await driveFetch(
    token,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  const result = await response.json();
  return result.id as string;
}
