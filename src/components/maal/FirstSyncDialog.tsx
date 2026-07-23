import React, { useState } from "react";
import { Cloud, Download, Merge, X } from "lucide-react";
import { useTx, type FirstSyncResolution } from "@/lib/tx-store";
import { Modal } from "./Modal";

export function FirstSyncDialog() {
  const { firstSyncDecision, syncNow, cancelFirstSync } = useTx();
  const [busy, setBusy] = useState<FirstSyncResolution | null>(null);
  const [error, setError] = useState("");

  if (!firstSyncDecision) return null;

  const resolve = async (resolution: FirstSyncResolution) => {
    setBusy(resolution);
    setError("");
    const result = await syncNow(resolution);
    if (result.status === "error") setError(result.error);
    if (result.status === "authorization_required") {
      setError("Reconnect Google Drive, then choose again.");
    }
    setBusy(null);
  };

  const localCount =
    firstSyncDecision.localWallets + firstSyncDecision.localTransactions;
  const cloudCount =
    firstSyncDecision.cloudWallets + firstSyncDecision.cloudTransactions;

  return (
    <Modal ariaLabel="Choose first sync behavior">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-[16px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-hard-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] text-[var(--accent-primary)]">
              <Cloud size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black">Combine this device?</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                BirrTu found {localCount} unsynced local item
                {localCount === 1 ? "" : "s"} and {cloudCount} cloud item
                {cloudCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cancelFirstSync}
            disabled={!!busy}
            aria-label="Cancel sync"
            className="cursor-pointer rounded p-1 text-[var(--text-secondary)]"
          >
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          disabled={!!busy}
          onClick={() => void resolve("merge")}
          className="flex cursor-pointer items-start gap-3 rounded-[12px] border-2 border-[var(--accent-primary)] bg-[var(--bg-surface-sunken)] p-4 text-left disabled:opacity-50"
        >
          <Merge className="mt-0.5 shrink-0 text-[var(--accent-primary)]" size={20} />
          <span>
            <strong className="block text-sm">Merge safely</strong>
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">
              Keep both your local additions and everything already in Google Drive.
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={!!busy}
          onClick={() => void resolve("discard-local")}
          className="flex cursor-pointer items-start gap-3 rounded-[12px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] p-4 text-left disabled:opacity-50"
        >
          <Download className="mt-0.5 shrink-0 text-amber-500" size={20} />
          <span>
            <strong className="block text-sm">Use cloud data</strong>
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">
              Discard only these unsynced local additions and download your cloud ledger.
            </span>
          </span>
        </button>

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        {busy && (
          <p className="text-center text-xs font-semibold text-[var(--text-secondary)]">
            Synchronizing…
          </p>
        )}
      </div>
    </Modal>
  );
}
