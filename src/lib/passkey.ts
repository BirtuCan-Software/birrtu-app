function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function registerLocalPasskey(username: string): Promise<string> {
  if (!isPasskeySupported()) {
    throw new Error("Passkeys are not supported on this browser/platform.");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const creationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: "BirrTu",
      id: window.location.hostname || "localhost",
    },
    user: {
      id: userId,
      name: username || "user@birrtu.com",
      displayName: username || "BirrTu User",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },   // ES256
      { type: "public-key", alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // TouchID, FaceID, Windows Hello, etc.
      userVerification: "required",
      residentKey: "preferred",
    },
    timeout: 60000,
  };

  const credential = await navigator.credentials.create({
    publicKey: creationOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error("Passkey registration failed.");
  }

  return bufferToBase64Url(credential.rawId);
}

export async function authenticateLocalPasskey(credentialId: string): Promise<boolean> {
  if (!isPasskeySupported()) {
    throw new Error("Passkeys are not supported on this browser/platform.");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const rawId = base64UrlToBuffer(credentialId);

  const assertionOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: window.location.hostname || "localhost",
    allowCredentials: [
      {
        type: "public-key",
        id: rawId,
      }
    ],
    userVerification: "required",
    timeout: 60000,
  };

  const assertion = await navigator.credentials.get({
    publicKey: assertionOptions,
  });

  return !!assertion;
}
