import React, { useState } from "react";
import { useSettings } from "@/lib/settings";
import { useTx } from "@/lib/tx-store";
import { useAccount } from "@/lib/accounts";
import { Section, Toggle } from "./SettingsHelpers";
import { PinLockScreen } from "@/components/maal/PinLockScreen";
import { registerLocalPasskey } from "@/lib/passkey";
import { timeAgo } from "@/lib/format";
import { Fingerprint, Key, AlertTriangle, ExternalLink } from "lucide-react";

export function SyncSecuritySection() {
  const { settings, update } = useSettings();
  const {
    lastSyncedAt,
    syncNow,
    syncState,
    pending,
  } = useTx();
  
  const {
    accounts,
    activeAccountId,
  } = useAccount();

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const savedPinKey = `maal-device-pin-v1-${activeAccountId}`;

  const [showSetPin, setShowSetPin] = useState(false);
  const [showVerifyPin, setShowVerifyPin] = useState(false);
  const [showLockChoiceModal, setShowLockChoiceModal] = useState(false);
  const [pinSetupPurpose, setPinSetupPurpose] = useState<"only_pin" | "backup_for_passkey" >("only_pin");
  const [showPasskeySetupErrorModal, setShowPasskeySetupErrorModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Section title="Sync & security">
        <Toggle
          checked={settings.autoSync}
          onChange={(v) => update({ autoSync: v })}
          label="Auto-sync"
          hint="Sync on network when off, conserves mobile data"
        />
        <Toggle
          checked={settings.deviceLock}
          onChange={(v) => {
            if (v) {
              const hasPin = localStorage.getItem(savedPinKey);
              const hasPasskey = localStorage.getItem(`maal-device-passkey-id-v1-${activeAccountId}`);
              const hasLockType = localStorage.getItem(`maal-device-lock-type-v1-${activeAccountId}`);
              
              if (hasLockType === "passkey" && hasPasskey && hasPin) {
                update({ deviceLock: true });
              } else if (hasLockType === "pin" && hasPin) {
                update({ deviceLock: true });
              } else {
                setShowLockChoiceModal(true);
              }
            } else {
              setShowVerifyPin(true);
            }
          }}
          label="Device lock"
          hint="Require biometric or PIN on open"
        />

        <div
          className="mt-3 flex items-center justify-between rounded-[10px] p-3"
          style={{
            background: "var(--bg-surface-sunken)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div className="text-sm font-semibold capitalize">{syncState}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {lastSyncedAt ? `Last sync ${timeAgo(lastSyncedAt)}` : "Never synced"}
              {pending > 0 && ` · ${pending} pending`}
            </div>
          </div>
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSync}
            className="btn-secondary text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </Section>

      {showSetPin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center">
          <PinLockScreen
            isSettingPin={true}
            titleOverride={pinSetupPurpose === "backup_for_passkey" ? "Set Backup PIN" : "Set Security PIN"}
            subtitleOverride={pinSetupPurpose === "backup_for_passkey" ? "Choose a secure backup passcode for your passkey" : "Choose a secure 4-digit passcode"}
            onSetPinSuccess={async () => {
              const activeAccId = activeAccountId;
              const lockTypeKey = `maal-device-lock-type-v1-${activeAccId}`;
              const savedPasskeyIdKey = `maal-device-passkey-id-v1-${activeAccId}`;

              if (pinSetupPurpose === "backup_for_passkey") {
                try {
                  const credentialId = await registerLocalPasskey(activeAccount?.name || "user");
                  localStorage.setItem(lockTypeKey, "passkey");
                  localStorage.setItem(savedPasskeyIdKey, credentialId);
                  update({ deviceLock: true });
                  setShowSetPin(false);
                } catch (err: any) {
                  console.error("Passkey registration failed:", err);
                  // Setup PIN as the active lock first
                  localStorage.setItem(lockTypeKey, "pin");
                  update({ deviceLock: true });
                  
                  setShowSetPin(false);
                  setShowPasskeySetupErrorModal(true);
                }
              } else {
                localStorage.setItem(lockTypeKey, "pin");
                update({ deviceLock: true });
                setShowSetPin(false);
              }
            }}
            onCancelSet={() => {
              setShowSetPin(false);
            }}
            onSuccess={() => {}}
          />
        </div>
      )}

      {showVerifyPin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center">
          <PinLockScreen
            isSettingPin={false}
            onSuccess={() => {
              update({ deviceLock: false });
              setShowVerifyPin(false);
            }}
            onCancelSet={() => {
              setShowVerifyPin(false);
            }}
          />
        </div>
      )}

      {/* Lock Choice Modal */}
      {showLockChoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border-2 border-[var(--border-strong)] rounded-[16px] p-6 shadow-hard-lg flex flex-col gap-5">
            <div className="text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] text-[var(--accent-primary)] mb-3 shadow-hard-sm">
                <Fingerprint className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                Enable Device Lock
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Choose how you want to secure BirrTu when launching.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Device Passkey card */}
              <button
                type="button"
                onClick={() => {
                  setPinSetupPurpose("backup_for_passkey");
                  setShowLockChoiceModal(false);
                  setShowSetPin(true);
                }}
                className="flex flex-col items-start text-left p-3.5 rounded-[12px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shadow-hard-sm w-full"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint className="h-5 w-5 text-[var(--accent-primary)]" />
                  <span className="text-sm font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                    Device Passkey (Recommended)
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Touch ID, Face ID, or system passcode. Modern & secure. (Requires backup PIN setup first).
                </p>
              </button>

              {/* Custom 4-digit PIN card */}
              <button
                type="button"
                onClick={() => {
                  setPinSetupPurpose("only_pin");
                  setShowLockChoiceModal(false);
                  setShowSetPin(true);
                }}
                className="flex flex-col items-start text-left p-3.5 rounded-[12px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shadow-hard-sm w-full"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                    Custom 4-digit PIN
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  A standalone 4-digit PIN custom to BirrTu. Guaranteed to work everywhere, including inside browser previews.
                </p>
              </button>
            </div>

            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-4">
              <button
                type="button"
                onClick={() => setShowLockChoiceModal(false)}
                className="text-xs font-bold py-2 px-4 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passkey Setup Error Modal */}
      {showPasskeySetupErrorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border-2 border-[var(--border-strong)] rounded-[16px] p-6 shadow-hard-lg flex flex-col gap-4">
            <div className="text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border-2 border-yellow-500/20 bg-yellow-500/10 text-yellow-500 mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                Iframe Restriction Active
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 px-1 leading-relaxed">
                Your browser blocked the biometric passkey registration. This is standard security inside sandboxed preview iframes.
              </p>
            </div>

            <div className="bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] rounded-lg p-3 text-[11px] leading-relaxed text-[var(--text-secondary)] flex flex-col gap-1.5">
              <p className="font-bold text-[var(--text-primary)]">What we did for you:</p>
              <p>
                To keep your account secured, we enabled your <strong>Custom 4-digit PIN</strong> as your active lock! You're fully protected.
              </p>
              <p className="font-bold text-[var(--text-primary)] mt-1">To use Touch ID / Face ID:</p>
              <p>
                Open BirrTu in a standalone browser tab and toggle Device Lock off/on to complete the setup.
              </p>
            </div>

            <div className="flex gap-2 w-full mt-2">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs font-bold py-2.5 px-4 text-center justify-center items-center flex gap-1 cursor-pointer flex-1 text-white bg-[var(--accent-primary)] border-2 border-[var(--border-strong)] shadow-hard-xs"
              >
                New Tab <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowPasskeySetupErrorModal(false)}
                className="btn-secondary text-xs font-bold py-2.5 px-4 cursor-pointer flex-1 border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] text-[var(--text-primary)] shadow-hard-xs"
              >
                Keep PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
