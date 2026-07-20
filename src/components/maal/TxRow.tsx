import React, { useState } from "react";
import type { Transaction } from "@/lib/db";
import { accountLabel, formatETB, timeAgo, formatDateTime } from "@/lib/format";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { useTx } from "@/lib/tx-store";
import { useSettings } from "@/lib/settings";
import { Modal } from "@/components/maal/Modal";
import { motion, useAnimation, useMotionValue, useTransform } from "motion/react";

export interface TxRowProps {
  tx: Transaction;
  disableSwipe?: boolean;
  key?: React.Key;
}

export function TxRow({ tx, disableSwipe = false }: TxRowProps) {
  const { settings } = useSettings();
  const { removeTx, wallets } = useTx();
  const [willDelete, setWillDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const controls = useAnimation();
  const x = useMotionValue(0);

  const isIncome = tx.type === "income";
  const isExpense = tx.type === "expense";
  const isTransfer = tx.type === "transfer";

  const color = isIncome
    ? "var(--income-positive)"
    : isExpense
      ? "var(--expense-negative)"
      : "var(--accent-secondary)";
  const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowDownLeft : ArrowUpRight;
  const sign = isIncome ? "+" : isExpense ? "−" : "⇄";

  // Framer Motion spring values mapped to drag distance
  const trashOpacity = useTransform(x, [0, -80], [0, 1]);
  const trashScale = useTransform(x, [0, -80], [0.8, 1.1]);
  const backgroundOpacity = useTransform(x, [0, -80], [0.3, 1]);

  const handleDrag = (_event: any, info: any) => {
    if (disableSwipe) return;
    if (info.offset.x < -80) {
      if (!willDelete) setWillDelete(true);
    } else {
      if (willDelete) setWillDelete(false);
    }
  };

  const handleDragEnd = async (_event: any, info: any) => {
    if (disableSwipe) return;
    if (info.offset.x < -80) {
      // Show confirmation before deleting
      setShowConfirm(true);
    } else {
      // Snap back to normal
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
      setWillDelete(false);
    }
  };

  const triggerDelete = () => {
    setShowConfirm(true);
  };

  return (
    <div className="relative overflow-hidden w-full select-none" style={{ touchAction: "pan-y" }}>
      {/* Background deletion action area */}
      {!disableSwipe && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end px-4"
          style={{
            background: "rgb(239, 68, 68)", // Red background
            opacity: backgroundOpacity,
            zIndex: 0,
          }}
        >
          <motion.div
            className="flex items-center gap-1.5 text-white font-semibold text-xs pr-2"
            style={{
              opacity: trashOpacity,
              scale: trashScale,
            }}
          >
            <Trash2 size={16} className={willDelete ? "animate-bounce" : ""} />
            <span>{willDelete ? "Release to Delete" : "Swipe to Delete"}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Foreground list item content */}
      <motion.div
        drag={disableSwipe ? false : "x"}
        dragDirectionLock={!disableSwipe}
        dragConstraints={disableSwipe ? undefined : { left: -120, right: 0 }}
        dragElastic={disableSwipe ? undefined : { left: 0.4, right: 0.1 }}
        onDrag={disableSwipe ? undefined : handleDrag}
        onDragEnd={disableSwipe ? undefined : handleDragEnd}
        animate={controls}
        style={{ x, zIndex: 1, position: "relative", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}
        className={`flex items-center gap-3 py-3 w-full ${disableSwipe ? "" : "cursor-grab active:cursor-grabbing"}`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
          style={{
            background: "var(--bg-surface-sunken)",
            color,
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {tx.description || (isTransfer ? "Transfer" : isIncome ? "Income" : "Expense")}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {isTransfer && tx.toAccount
              ? `${accountLabel(tx.account, wallets)} → ${accountLabel(tx.toAccount, wallets)}`
              : accountLabel(tx.account, wallets)}{" "}
            · <span title={formatDateTime(tx.timestamp, settings.timeFormat)} className="hover:underline cursor-help">
                {timeAgo(tx.timestamp)}
              </span>
            {tx.sync_status !== "synced" && (
              <span className="ml-1" style={{ color: "var(--sync-pending)" }}>
                · pending
              </span>
            )}
          </div>
        </div>
        <div className="tabular text-right text-base font-semibold" style={{ color }}>
          {sign} {formatETB(tx.amount)}
          <div
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            ETB
          </div>
        </div>
        <button
          onClick={triggerDelete}
          aria-label="Delete"
          className="ml-1 rounded-[6px] p-2 cursor-pointer transition-colors hover:text-red-500 shrink-0"
          style={{ color: "var(--text-disabled)" }}
        >
          <Trash2 size={16} />
        </button>
      </motion.div>

      {/* Confirmation Dialog Overlay */}
      {showConfirm && (
        <Modal ariaLabel="Delete transaction">
          <div
            className="shadow-hard-lg flex max-h-full w-full max-w-sm touch-auto flex-col gap-4 overflow-y-auto rounded-[20px] p-6 animate-in fade-in zoom-in-95 duration-150 text-left"
            style={{
              background: "var(--bg-surface)",
              border: "2px solid var(--border-strong)",
            }}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                Delete Transaction?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              
              <div
                className="mt-3 p-3.5 rounded-[12px] flex items-center gap-3"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    background: "var(--bg-surface)",
                    color,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {tx.description || (isTransfer ? "Transfer" : isIncome ? "Income" : "Expense")}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {formatDateTime(tx.timestamp, settings.timeFormat)} ({timeAgo(tx.timestamp)})
                  </div>
                </div>
                <div className="tabular text-right text-sm font-bold" style={{ color }}>
                  {sign} {formatETB(tx.amount)} ETB
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
                  setWillDelete(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-[8px] cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await controls.start({ x: "-100%", opacity: 0, transition: { duration: 0.2 } });
                  removeTx(tx.id);
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-[8px] cursor-pointer transition-colors text-white bg-red-500 hover:bg-red-600 shadow-sm"
                style={{
                  boxShadow: "2px 2px 0 0 var(--border-strong)"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
