import React, { useState } from "react";
import { useTx } from "@/lib/tx-store";
import { timeAgo, formatTime } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import { useAccount } from "@/lib/accounts";
import { RefreshCw, X, CheckCircle2, AlertCircle, Calendar, WifiOff } from "lucide-react";

export function SyncBadge() {
  const { settings } = useSettings();
  const { syncState, pending, lastSyncedAt, syncNow, online } = useTx();
  const { user, googleSignIn } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isGuest = user?.isGuest;

  const dotColor = isGuest
    ? "var(--expense-negative)"
    : syncState === "synced"
      ? "var(--sync-synced)"
      : syncState === "pending"
        ? "var(--sync-pending)"
        : "var(--sync-offline)";

  const label = isGuest
    ? "Not Synced (Guest)"
    : syncState === "synced"
      ? lastSyncedAt
        ? `Synced · ${timeAgo(lastSyncedAt)}`
        : "Synced"
      : syncState === "pending"
        ? `${pending} change${pending === 1 ? "" : "s"} pending`
        : "Offline mode";

  const handleSyncClick = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      if (isGuest) {
        const res = await googleSignIn();
        if (res.success) {
          setIsOpen(false);
        } else {
          setSyncFeedback({
            type: "error",
            message: res.error || "Google connection failed. Please try again.",
          });
        }
        return;
      }

      await syncNow();
      setSyncFeedback({
        type: "success",
        message: "Financial records successfully backed up and synchronized with your secure Google Drive!",
      });
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Sync failed. Please check network connection.",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSyncFeedback(null);
        }}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 shrink-0 select-none"
        style={{
          background: "var(--bg-surface-raised)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: dotColor,
            boxShadow: `0 0 0 1px color-mix(in oklab, ${dotColor} 60%, black)`,
          }}
        />
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      </button>

      {isOpen && (
        <>
          {/* Transparent Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />

          {/* Absolute Tooltip Card with Upward Pointing Caret */}
          <div
            className="absolute right-0 top-full mt-2.5 z-50 w-72 shadow-hard-lg rounded-[16px] p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
              background: "var(--bg-surface)",
              border: "2px solid var(--border-strong)",
            }}
          >
            {/* The upwards pointing triangle caret */}
            <div
              className="absolute -top-[7px] right-6 h-3 w-3 rotate-45"
              style={{
                background: "var(--bg-surface)",
                borderTop: "2px solid var(--border-strong)",
                borderLeft: "2px solid var(--border-strong)",
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ fontFamily: "var(--font-display)" }}>
                  <RefreshCw size={14} className={syncing ? "animate-spin text-[var(--accent-primary)]" : "text-[var(--accent-primary)]"} />
                  Google Drive Sync
                </h2>
                <span className="text-[9px] text-zinc-500 font-medium block pl-5 -mt-0.5">Backed up to private appDataFolder</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[4px] cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <X size={12} />
              </button>
            </div>
             {/* Content Details */}
            <div className="space-y-3">
              <div
                className="p-3 rounded-[10px] space-y-2 text-xs"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {isGuest ? (
                  <div className="space-y-2 text-zinc-400 leading-relaxed text-[11px]">
                    <p className="font-semibold text-zinc-200">Local-Only Active Mode</p>
                    <p>
                      Your ledger entries, active wallets, and transaction histories reside completely offline in this browser's local sandbox storage.
                    </p>
                    <p className="text-amber-500/90 font-medium">
                      ⚠️ Deleting browser cookies or clearing cache can wipe local data if no manual backups are saved.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>Connection:</span>
                      <span className="font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                        {online ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sync-synced)]" />
                            Online
                          </>
                        ) : (
                          <>
                            <WifiOff size={12} className="text-[var(--sync-offline)]" />
                            Offline Mode
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>Pending changes:</span>
                      <span className="font-mono font-bold" style={{ color: pending > 0 ? "var(--sync-pending)" : "var(--text-primary)" }}>
                        {pending} item{pending === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 pt-1.5 border-t border-[var(--border-subtle)]">
                      <span style={{ color: "var(--text-secondary)" }} className="flex items-center gap-1">
                        <Calendar size={11} /> Last Synced:
                      </span>
                      <span className="font-semibold text-[11px] pl-4" style={{ color: "var(--text-primary)" }}>
                        {lastSyncedAt ? (
                          <>
                            {formatTime(lastSyncedAt, settings.timeFormat, true)}
                            <span className="block text-[10px] font-normal" style={{ color: "var(--text-secondary)" }}>
                              ({timeAgo(lastSyncedAt)})
                            </span>
                          </>
                        ) : (
                          "Never"
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Success / Error Feedback */}
              {syncFeedback && (
                <div
                  className="p-2.5 rounded-[8px] text-[11px] flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
                  style={{
                    background: syncFeedback.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${syncFeedback.type === "success" ? "var(--income-positive)" : "var(--expense-negative)"}`,
                    color: syncFeedback.type === "success" ? "var(--income-positive)" : "var(--expense-negative)",
                  }}
                >
                  {syncFeedback.type === "success" ? (
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  )}
                  <span className="font-medium leading-relaxed">{syncFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={syncing}
                className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Connecting..." : isGuest ? "Connect Google Account" : "Sync Now"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
