import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { requestDriveAccessToken } from "./google-identity";
import { getDeviceId } from "./device-id";
import {
  mergeWorkspaceCatalogs,
  type CloudWorkspace,
} from "./workspace-sync";

function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missing.join(", ")}`);
  }

  return config;
}

// Initialize Firebase
const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);

export interface AppUser {
  id: string;
  username: string;
  email: string;
  photoURL?: string;
  phone: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface AppAccount {
  id: string;
  syncId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  originDeviceId: string;
  userId: string;
}

interface AccountCtx {
  // Auth state
  user: AppUser | null;
  token: string | null; // Cache the access token in memory.
  isLoggingIn: boolean;
  googleSignIn: () => Promise<{ success: boolean; error?: string; token?: string }>;
  authorizeDrive: () => Promise<{ success: boolean; error?: string; token?: string }>;
  guestSignIn: () => void;
  signUp: (username: string, phone: string, password: string) => { success: boolean; error?: string };
  login: (identifier: string, password: string) => { success: boolean; error?: string };
  updateProfile: (username: string, phone: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;

  // Workspace/Account state
  accounts: AppAccount[];
  workspaceRecords: CloudWorkspace[];
  reconcileWorkspaces: (workspaces: CloudWorkspace[]) => void;
  activeAccountId: string | null;
  alwaysAsk: boolean;
  addAccount: (name: string) => { success: boolean; error?: string };
  importAccount: (name: string) => { success: boolean; error?: string; account?: AppAccount };
  renameAccount: (id: string, newName: string) => void;
  deleteAccount: (id: string) => void;
  switchAccount: (id: string) => void;
  setAlwaysAsk: (val: boolean) => void;
}

const AccountContext = createContext<AccountCtx | null>(null);

const WORKSPACES_KEY_PREFIX = "maal-workspaces-v2-";
const ACTIVE_WORKSPACE_KEY_PREFIX = "maal-active-workspace-v2-";
const WORKSPACE_TOMBSTONES_KEY_PREFIX = "maal-workspace-tombstones-v1-";

// In-memory access token cache
let cachedAccessToken: string | null = null;

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [workspaceTombstones, setWorkspaceTombstones] = useState<CloudWorkspace[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [ready, setReady] = useState(false);
  const accountsRef = useRef(accounts);
  const workspaceTombstonesRef = useRef(workspaceTombstones);
  accountsRef.current = accounts;
  workspaceTombstonesRef.current = workspaceTombstones;

  // Load workspaces for specific user id
  const loadWorkspacesForUser = (userId: string) => {
    const wkKey = `${WORKSPACES_KEY_PREFIX}${userId}`;
    const activeKey = `${ACTIVE_WORKSPACE_KEY_PREFIX}${userId}`;

    let wks: AppAccount[] = [];
    const localDeviceId = getDeviceId();
    try {
      const stored = localStorage.getItem(wkKey);
      wks = stored ? JSON.parse(stored) : [];
    } catch {
      wks = [];
    }

    if (wks.length === 0) {
      const now = new Date().toISOString();
      wks = [
        {
          id: "wk_" + crypto.randomUUID().replace(/-/g, ""),
          syncId: "primary",
          name: "Primary Workspace",
          createdAt: now,
          // A freshly-created placeholder must not beat cloud metadata from an
          // established primary workspace during first sync.
          updatedAt: "1970-01-01T00:00:00.000Z",
          originDeviceId: localDeviceId,
          userId,
        },
      ];
    } else {
      wks = wks.map((workspace, index) => ({
        ...workspace,
        syncId:
          workspace.syncId ||
          (index === 0
            ? "primary"
            : `workspace_${crypto.randomUUID().replace(/-/g, "")}`),
        updatedAt: workspace.updatedAt || workspace.createdAt,
        originDeviceId: workspace.originDeviceId || localDeviceId,
      }));
    }
    localStorage.setItem(wkKey, JSON.stringify(wks));
    try {
      const tombstones = localStorage.getItem(
        `${WORKSPACE_TOMBSTONES_KEY_PREFIX}${userId}`,
      );
      setWorkspaceTombstones(tombstones ? JSON.parse(tombstones) : []);
    } catch {
      setWorkspaceTombstones([]);
    }
    setAccounts(wks);

    const storedActive = localStorage.getItem(activeKey);
    if (storedActive && wks.some((w) => w.id === storedActive)) {
      setActiveAccountId(storedActive);
    } else {
      setActiveAccountId(wks[0].id);
      localStorage.setItem(activeKey, wks[0].id);
    }
  };

  const workspaceRecords: CloudWorkspace[] = [
    ...accounts.map(({ syncId, name, createdAt, updatedAt, originDeviceId }) => ({
      syncId,
      name,
      createdAt,
      updatedAt,
      originDeviceId,
      deleted: false,
    })),
    ...workspaceTombstones,
  ];

  const reconcileWorkspaces = (records: CloudWorkspace[]) => {
    if (!user) return;
    // Include the latest in-memory state so a workspace created, renamed, or
    // deleted while a network round trip is in flight cannot be rolled back.
    const latestLocalRecords: CloudWorkspace[] = [
      ...accountsRef.current.map(
        ({ syncId, name, createdAt, updatedAt, originDeviceId }) => ({
          syncId,
          name,
          createdAt,
          updatedAt,
          originDeviceId,
          deleted: false,
        }),
      ),
      ...workspaceTombstonesRef.current,
    ];
    const resolvedRecords = mergeWorkspaceCatalogs(
      [],
      [...records, ...latestLocalRecords],
    ).sort((a, b) => a.syncId.localeCompare(b.syncId));
    const visible = resolvedRecords.filter((record) => !record.deleted);
    const nextAccounts = visible.map((record) => {
      const existing = accounts.find(
        (workspace) => workspace.syncId === record.syncId,
      );
      return {
        id:
          existing?.id ||
          `wk_${crypto.randomUUID().replace(/-/g, "")}`,
        syncId: record.syncId,
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        originDeviceId: record.originDeviceId,
        userId: user.id,
      };
    });
    if (nextAccounts.length === 0) return;

    const tombstones = resolvedRecords.filter((record) => record.deleted);
    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    const activeKey = `${ACTIVE_WORKSPACE_KEY_PREFIX}${user.id}`;
    const nextActive = nextAccounts.some(
      (workspace) => workspace.id === activeAccountId,
    )
      ? activeAccountId
      : nextAccounts[0].id;

    if (JSON.stringify(nextAccounts) !== JSON.stringify(accounts)) {
      setAccounts(nextAccounts);
      localStorage.setItem(wkKey, JSON.stringify(nextAccounts));
    }
    if (JSON.stringify(tombstones) !== JSON.stringify(workspaceTombstones)) {
      setWorkspaceTombstones(tombstones);
      localStorage.setItem(
        `${WORKSPACE_TOMBSTONES_KEY_PREFIX}${user.id}`,
        JSON.stringify(tombstones),
      );
    }
    if (nextActive !== activeAccountId) {
      setActiveAccountId(nextActive);
      localStorage.setItem(activeKey, nextActive || "");
    }
  };

  // Listen to Auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem("birrtu_guest_logged_in");
        const mappedUser: AppUser = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || undefined,
          phone: firebaseUser.phoneNumber || "",
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        setUser(mappedUser);
        setToken(cachedAccessToken);
        loadWorkspacesForUser(firebaseUser.uid);
      } else {
        const isGuestMode = localStorage.getItem("birrtu_guest_logged_in") === "true";
        if (isGuestMode) {
          const guestUser: AppUser = {
            id: "guest_user_id",
            username: "Guest User",
            email: "guest@local.birrtu",
            phone: "",
            createdAt: new Date().toISOString(),
            isGuest: true,
          };
          setUser(guestUser);
          setToken(null);
          loadWorkspacesForUser("guest_user_id");
        } else {
          setUser(null);
          setToken(null);
          cachedAccessToken = null;
          setAccounts([]);
          setWorkspaceTombstones([]);
          setActiveAccountId(null);
        }
      }
      setReady(true);
    });

    return () => unsubscribe();
  }, []);

  const googleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      localStorage.removeItem("birrtu_guest_logged_in");
      const provider = new GoogleAuthProvider();
      // Add drive scopes and profile scopes
      provider.addScope("https://www.googleapis.com/auth/drive.appdata");
      provider.addScope("openid");
      provider.addScope("https://www.googleapis.com/auth/userinfo.email");
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("Failed to get OAuth access token from Google Sign-In");
      }

      cachedAccessToken = credential.accessToken;
      setToken(cachedAccessToken);

      const firebaseUser = result.user;
      const mappedUser: AppUser = {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || undefined,
        phone: firebaseUser.phoneNumber || "",
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };

      setUser(mappedUser);
      loadWorkspacesForUser(firebaseUser.uid);
      return { success: true, token: cachedAccessToken };
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      return { success: false, error: error.message || "Sign in failed" };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const authorizeDrive = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return googleSignIn();

    setIsLoggingIn(true);
    try {
      cachedAccessToken = await requestDriveAccessToken(clientId, user?.email);
      setToken(cachedAccessToken);
      return { success: true, token: cachedAccessToken };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google Drive authorization failed.",
      };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const guestSignIn = () => {
    localStorage.setItem("birrtu_guest_logged_in", "true");
    const guestUser: AppUser = {
      id: "guest_user_id",
      username: "Guest User",
      email: "guest@local.birrtu",
      phone: "",
      createdAt: new Date().toISOString(),
      isGuest: true,
    };
    setUser(guestUser);
    setToken(null);
    loadWorkspacesForUser("guest_user_id");
  };

  const signUp = () => {
    return { success: false, error: "Traditional signup disabled. Please Sign in with Google." };
  };

  const login = () => {
    return { success: false, error: "Traditional login disabled. Please Sign in with Google." };
  };

  const updateProfile = () => {
    return { success: false, error: "Profile updates are managed via Google Account settings." };
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("birrtu_guest_logged_in");
      await signOut(auth);
      cachedAccessToken = null;
      setToken(null);
      setUser(null);
      setAccounts([]);
      setWorkspaceTombstones([]);
      setActiveAccountId(null);
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  // Workspace actions
  const addAccount = (name: string) => {
    if (!user) return { success: false, error: "Not logged in." };
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Workspace name cannot be empty." };
    }
    if (accounts.length >= 3) {
      return { success: false, error: "Workspace limit of 3 reached." };
    }

    const now = new Date().toISOString();
    const newWorkspace: AppAccount = {
      id: "wk_" + crypto.randomUUID().replace(/-/g, ""),
      syncId: `workspace_${crypto.randomUUID().replace(/-/g, "")}`,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      originDeviceId: getDeviceId(),
      userId: user.id,
    };

    const updatedWks = [...accounts, newWorkspace];
    setAccounts(updatedWks);
    setActiveAccountId(newWorkspace.id);

    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    localStorage.setItem(wkKey, JSON.stringify(updatedWks));

    const activeKey = `${ACTIVE_WORKSPACE_KEY_PREFIX}${user.id}`;
    localStorage.setItem(activeKey, newWorkspace.id);

    return { success: true };
  };

  const importAccount = (name: string) => {
    if (!user) return { success: false, error: "Not logged in." };
    const trimmed = name.trim() || "Imported Workspace";
    const now = new Date().toISOString();
    const newWorkspace: AppAccount = {
      id: "wk_" + crypto.randomUUID().replace(/-/g, ""),
      syncId: `workspace_${crypto.randomUUID().replace(/-/g, "")}`,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      originDeviceId: getDeviceId(),
      userId: user.id,
    };

    const updatedWks = [...accounts, newWorkspace];
    setAccounts(updatedWks);

    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    localStorage.setItem(wkKey, JSON.stringify(updatedWks));

    return { success: true, account: newWorkspace };
  };

  const renameAccount = (id: string, newName: string) => {
    if (!user) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updatedWks = accounts.map((w) =>
      w.id === id
        ? {
            ...w,
            name: trimmed,
            updatedAt: new Date().toISOString(),
            originDeviceId: getDeviceId(),
          }
        : w,
    );
    setAccounts(updatedWks);

    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    localStorage.setItem(wkKey, JSON.stringify(updatedWks));
  };

  const deleteAccount = (id: string) => {
    if (!user || accounts.length <= 1) return;

    const deletedWorkspace = accounts.find((workspace) => workspace.id === id);
    if (!deletedWorkspace) return;
    const deletedAt = new Date().toISOString();
    const nextTombstones = [
      ...workspaceTombstones.filter(
        (workspace) => workspace.syncId !== deletedWorkspace.syncId,
      ),
      {
        syncId: deletedWorkspace.syncId,
        name: deletedWorkspace.name,
        createdAt: deletedWorkspace.createdAt,
        updatedAt: deletedAt,
        originDeviceId: getDeviceId(),
        deleted: true,
      },
    ];
    setWorkspaceTombstones(nextTombstones);
    localStorage.setItem(
      `${WORKSPACE_TOMBSTONES_KEY_PREFIX}${user.id}`,
      JSON.stringify(nextTombstones),
    );

    const filtered = accounts.filter((w) => w.id !== id);
    setAccounts(filtered);

    let nextActive = activeAccountId;
    if (activeAccountId === id) {
      nextActive = filtered[0].id;
      setActiveAccountId(nextActive);
    }

    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    localStorage.setItem(wkKey, JSON.stringify(filtered));

    const activeKey = `${ACTIVE_WORKSPACE_KEY_PREFIX}${user.id}`;
    localStorage.setItem(activeKey, nextActive || "");

    // Cleanup local resources
    try {
      localStorage.removeItem(`maal-settings-v1-${id}`);
      localStorage.removeItem(`maal-wallets-v1-${id}`);
      localStorage.removeItem(`maal-last-sync-${id}`);
      localStorage.removeItem(`maal-sync-baseline-v2-${id}`);
      localStorage.removeItem(`maal-settings-sync-v2-${id}`);
      localStorage.removeItem(`maal-device-pin-v1-${id}`);
      localStorage.removeItem(`maal-device-pin-verifier-v1-${id}`);
      localStorage.removeItem(`maal-device-passkey-id-v1-${id}`);
      localStorage.removeItem(`maal-device-lock-type-v1-${id}`);
      if (typeof window !== "undefined" && window.indexedDB) {
        window.indexedDB.deleteDatabase(`maal-db-${id}`);
      }
    } catch (e) {
      console.error("Failed to delete workspace resources:", e);
    }
  };

  const switchAccount = (id: string) => {
    if (!user) return;
    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    let storedAccounts: AppAccount[] = accounts;
    try {
      const stored = localStorage.getItem(wkKey);
      storedAccounts = stored ? JSON.parse(stored) : accounts;
    } catch {
      storedAccounts = accounts;
    }

    if (storedAccounts.some((w) => w.id === id)) {
      setActiveAccountId(id);
      const activeKey = `${ACTIVE_WORKSPACE_KEY_PREFIX}${user.id}`;
      localStorage.setItem(activeKey, id);
    }
  };

  if (!ready) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#0a0b0f] text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff5a1f] border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-widest">Initialising BirrTu...</p>
        </div>
      </div>
    );
  }

  return (
    <AccountContext.Provider
      value={{
        user,
        token,
        isLoggingIn,
        googleSignIn,
        authorizeDrive,
        guestSignIn,
        signUp,
        login,
        updateProfile,
        logout: handleLogout,
        accounts,
        workspaceRecords,
        reconcileWorkspaces,
        activeAccountId,
        alwaysAsk: false,
        addAccount,
        importAccount,
        renameAccount,
        deleteAccount,
        switchAccount,
        setAlwaysAsk: () => {},
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return ctx;
}
