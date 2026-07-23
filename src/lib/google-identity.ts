const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

const DRIVE_TOKEN_KEY = "birrtu-drive-token-v1";
const EXPIRY_SAFETY_MARGIN_MS = 5 * 60 * 1000;

interface CachedDriveToken {
  accessToken: string;
  email: string;
  expiresAt: number;
}

export function cacheDriveAccessToken(
  accessToken: string,
  email = "",
  expiresInSeconds = 3600,
) {
  try {
    const cached: CachedDriveToken = {
      accessToken,
      email,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    sessionStorage.setItem(DRIVE_TOKEN_KEY, JSON.stringify(cached));
  } catch {
    // In-memory auth still works when storage is blocked.
  }
}

export function restoreDriveAccessToken(email = "") {
  try {
    const cached = JSON.parse(
      sessionStorage.getItem(DRIVE_TOKEN_KEY) || "null",
    ) as CachedDriveToken | null;
    if (
      cached?.accessToken &&
      (!cached.email || cached.email === email) &&
      cached.expiresAt > Date.now() + EXPIRY_SAFETY_MARGIN_MS
    ) {
      return cached.accessToken;
    }
  } catch {
    // Treat malformed or unavailable storage as an expired token.
  }
  clearDriveAccessToken();
  return null;
}

export function clearDriveAccessToken() {
  try {
    sessionStorage.removeItem(DRIVE_TOKEN_KEY);
  } catch {
    // Storage may be unavailable in hardened browser modes.
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            hint?: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string }) => void;
          }): {
            requestAccessToken(config?: { prompt?: string }): void;
          };
        };
      };
    };
  }
}

export function requestDriveAccessToken(clientId: string, email?: string) {
  return new Promise<string>((resolve, reject) => {
    const oauth = window.google?.accounts.oauth2;
    if (!oauth) {
      reject(new Error("Google authorization is still loading. Please retry."));
      return;
    }

    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      hint: email,
      callback: (response) => {
        if (response.access_token) {
          cacheDriveAccessToken(
            response.access_token,
            email,
            response.expires_in,
          );
          resolve(response.access_token);
        } else {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google Drive authorization failed.",
            ),
          );
        }
      },
      error_callback: () =>
        reject(new Error("Google Drive authorization was cancelled.")),
    });
    client.requestAccessToken({ prompt: "" });
  });
}
