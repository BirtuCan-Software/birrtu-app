import React from "react";
import type { Wallet } from "@/lib/db";
import { AlertTriangle } from "lucide-react";

interface WalletDeleteConfirmDialogProps {
  wallet: Wallet | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function WalletDeleteConfirmDialog({ wallet, onClose, onConfirm }: WalletDeleteConfirmDialogProps) {
  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="shadow-hard-lg w-full max-w-sm rounded-[20px] p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: "var(--bg-surface)",
          border: "2px solid var(--border-strong)",
        }}
      >
        <div className="flex items-center gap-3 text-red-500">
          <span
            className="p-2 rounded-full"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <AlertTriangle size={24} />
          </span>
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Delete Wallet?
          </h2>
        </div>

        <div className="text-xs space-y-2" style={{ color: "var(--text-secondary)" }}>
          <p>
            Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{wallet.name}</strong>?
          </p>
          <p className="leading-relaxed">
            This wallet will be removed from your active list and balance calculations. However, all historical transactions linked to this wallet will remain safely preserved in your account history.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 text-xs py-2.5 cursor-pointer font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all rounded-[12px] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0_0_rgba(255,255,255,1)] cursor-pointer text-center"
          >
            Delete Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
