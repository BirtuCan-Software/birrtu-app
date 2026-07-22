import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

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
  name: string;
  createdAt: string;
  userId: string;
}

interface AccountCtx {
  // Auth state
  user: AppUser | null;
  token: string | null; // Cache the access token in memory.
  isLoggingIn: boolean;
  googleSignIn: () => Promise<{ success: boolean; error?: string; token?: string }>;
  guestSignIn: () => void;
  signUp: (username: string, phone: string, password: string) => { success: boolean; error?: string };
  login: (identifier: string, password: string) => { success: boolean; error?: string };
  updateProfile: (username: string, phone: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;

  // Workspace/Account state
  accounts: AppAccount[];
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

// In-memory access token cache
let cachedAccessToken: string | null = null;

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [ready, setReady] = useState(false);

  // Load workspaces for specific user id
  const loadWorkspacesForUser = (userId: string) => {
    const wkKey = `${WORKSPACES_KEY_PREFIX}${userId}`;
    const activeKey = `${ACTIVE_WORKSPACE_KEY_PREFIX}${userId}`;

    let wks: AppAccount[] = [];
    try {
      const stored = localStorage.getItem(wkKey);
      wks = stored ? JSON.parse(stored) : [];
    } catch {
      wks = [];
    }

    if (wks.length === 0) {
      wks = [
        {
          id: "wk_" + crypto.randomUUID().replace(/-/g, ""),
          name: "Primary Workspace",
          createdAt: new Date().toISOString(),
          userId,
        },
      ];
      localStorage.setItem(wkKey, JSON.stringify(wks));
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

    const newWorkspace: AppAccount = {
      id: "wk_" + crypto.randomUUID().replace(/-/g, ""),
      name: trimmed,
      createdAt: new Date().toISOString(),
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
    const newWorkspace: AppAccount = {
      id: "wk_" + crypto.randomUUID().replace(/-/g, ""),
      name: trimmed,
      createdAt: new Date().toISOString(),
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

    const updatedWks = accounts.map((w) => (w.id === id ? { ...w, name: trimmed } : w));
    setAccounts(updatedWks);

    const wkKey = `${WORKSPACES_KEY_PREFIX}${user.id}`;
    localStorage.setItem(wkKey, JSON.stringify(updatedWks));
  };

  const deleteAccount = (id: string) => {
    if (!user || accounts.length <= 1) return;

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
        guestSignIn,
        signUp,
        login,
        updateProfile,
        logout: handleLogout,
        accounts,
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
