const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
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
