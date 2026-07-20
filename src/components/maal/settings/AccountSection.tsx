import React, { useState } from "react";
import { useAccount } from "@/lib/accounts";
import { Section } from "./SettingsHelpers";
import { AlertTriangle, LogOut, Mail, ShieldAlert, Trash2, User, Key } from "lucide-react";
import { Modal } from "@/components/maal/Modal";

export function AccountSection() {
  const { user, logout, accounts } = useAccount();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  if (!user) {
    return null;
  }

  const resetMatches = resetEmail.trim().toLowerCase() === user.email.toLowerCase();

  const handleFactoryReset = async () => {
    if (!resetMatches) return;
    const workspaceIds = accounts.map((a) => a.id);

    try {
      localStorage.clear();
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if (window.indexedDB) {
        workspaceIds.forEach((id) => window.indexedDB.deleteDatabase(`maal-db-${id}`));
        const databases = await (window.indexedDB as any).databases?.();
        databases
          ?.filter((db: { name?: string }) => db.name?.startsWith("maal-db-"))
          .forEach((db: { name?: string }) => db.name && window.indexedDB.deleteDatabase(db.name));
      }
    } finally {
      await Promise.resolve(logout());
      window.location.reload();
    }
  };

  return (
    <Section title="Google Account Identity">
      <div className="space-y-6">
        <div
          className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl"
          style={{
            background: "var(--bg-surface-sunken)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.username}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full border-2 border-[#ff5a1f] shadow-lg shrink-0 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold uppercase shrink-0 shadow-lg bg-[var(--bg-surface-raised)] border-2 border-[var(--border-strong)] text-[var(--text-primary)]">
              {user.username.slice(0, 2)}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1 overflow-hidden w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <User className="h-3.5 w-3.5 text-[#ff5a1f]" />
              <span className="font-bold text-sm text-[var(--text-primary)] truncate">{user.username}</span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-secondary)] truncate font-semibold">{user.email || "No email linked"}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono">
              <Key className="h-3 w-3" />
              <span className="truncate">UID: {user.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2">
          <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-bold text-emerald-400">Security & Authentication Managed by Google</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Your credentials, password, and sign-in keys are handled securely by Google Identity Services. Changes to your profile can be made in your Google Account dashboard.
            </p>
          </div>
        </div>

        {confirmLogout ? (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-red-950/20 border border-red-500/20">
            <p className="text-xs font-semibold text-red-400 text-center">Are you sure you want to log out of your account?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => logout()}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Yes, Log Out
              </button>
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center justify-center gap-2 rounded-[10px] py-3 text-xs font-bold cursor-pointer transition-all border text-red-400 hover:bg-red-950/20"
            style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
          >
            <LogOut size={14} /> Log Out of Account
          </button>
        )}

        <div
          className="rounded-xl border p-3 space-y-3"
          style={{
            background: "rgba(239, 68, 68, 0.06)",
            borderColor: "rgba(239, 68, 68, 0.22)",
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <h4 className="text-xs font-black text-red-500">Factory Reset This Device</h4>
              <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                Clear local workspaces, wallets, transactions, settings, lock credentials, and cached app data from this device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setResetEmail("");
              setConfirmReset(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-[10px] py-3 text-xs font-bold cursor-pointer transition-all border text-red-500 hover:bg-red-500/10"
            style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
          >
            <Trash2 size={14} /> Factory Reset
          </button>
        </div>
      </div>

      {confirmReset && (
        <Modal ariaLabel="Confirm factory reset">
          <div
            className="shadow-hard-lg flex max-h-full w-full max-w-sm touch-auto flex-col gap-4 overflow-y-auto rounded-[16px] p-6"
            style={{
              background: "var(--bg-surface)",
              border: "2px solid var(--border-strong)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-500 border border-red-500/25">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                  Confirm factory reset
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  This clears BirrTu data stored on this device. Type your email to continue.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Type {user.email}
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg-surface-sunken)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-subtle)",
                }}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="btn-ghost flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resetMatches}
                onClick={handleFactoryReset}
                className="flex-1 rounded-[10px] bg-red-600 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}
