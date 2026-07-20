/**
 * Google Drive Sync Utility for Maal (BirrTu)
 * Keeps financial logs backed up securely in user's hidden appDataFolder.
 */

interface SyncData {
  activeAccountId: string;
  wallets: any[];
  transactions: any[];
  settings?: any;
  lastSyncedAt: string;
}

export async function getSyncFile(token: string, activeAccountId: string): Promise<{ fileId: string | null; data: SyncData | null }> {
  try {
    const q = encodeURIComponent(`name='maal_sync_${activeAccountId}.json' and 'appDataFolder' in parents`);
    const listUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)`;
    
    const response = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errText = await response.text();
      throw new Error(`Failed to list sync files: ${errText}`);
    }

    const result = await response.json();
    const files = result.files || [];

    if (files.length === 0) {
      return { fileId: null, data: null };
    }

    const fileId = files[0].id;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!downloadResponse.ok) {
      const errText = await downloadResponse.text();
      throw new Error(`Failed to download sync file contents: ${errText}`);
    }

    const data = await downloadResponse.json();
    return { fileId, data };
  } catch (error) {
    console.error("[GDrive] Error fetching sync file:", error);
    throw error;
  }
}

export async function saveSyncFile(
  token: string,
  activeAccountId: string,
  fileId: string | null,
  data: SyncData
): Promise<string> {
  const fileName = `maal_sync_${activeAccountId}.json`;

  if (fileId) {
    // Update existing file using simple media PATCH
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update sync file: ${errText}`);
    }

    await response.json();
    return fileId;
  } else {
    // Create new file using multipart upload POST
    const metadata = {
      name: fileName,
      parents: ["appDataFolder"],
    };
    const boundary = "gdrive_sync_boundary";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body = [
      delimiter,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      delimiter,
      "Content-Type: application/json\r\n\r\n",
      JSON.stringify(data),
      closeDelimiter,
    ].join("");

    const createUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const response = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create sync file: ${errText}`);
    }

    const result = await response.json();
    return result.id;
  }
}
