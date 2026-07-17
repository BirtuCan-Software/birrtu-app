import React, { useState } from "react";
import { useAccount } from "@/lib/accounts";
import { Section } from "./SettingsHelpers";
import { LogOut, Mail, ShieldAlert, User, Key } from "lucide-react";

export function AccountSection() {
  const { user, logout } = useAccount();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <Section title="Google Account Identity">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.username}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full border-2 border-[#ff5a1f] shadow-lg shrink-0 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-300 uppercase shrink-0 shadow-lg">
              {user.username.slice(0, 2)}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1 overflow-hidden w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <User className="h-3.5 w-3.5 text-[#ff5a1f]" />
              <span className="font-bold text-sm text-zinc-100 truncate">{user.username}</span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 truncate font-semibold">{user.email || "No email linked"}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-zinc-500 font-mono">
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
      </div>
    </Section>
  );
}
