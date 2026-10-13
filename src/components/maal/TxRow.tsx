import React, { Suspense, lazy, useRef, useState } from "react";
import type { Transaction } from "@/lib/db";
import { accountLabel, formatETB, timeAgo, formatDateTime } from "@/lib/format";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { useTx } from "@/lib/tx-store";
import { useSettings } from "@/lib/settings";
import { Modal } from "@/components/maal/Modal";

const AddTx = lazy(() => import("@/routes/add"));

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
  const [showEdit, setShowEdit] = useState(false);
  const [x, setX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerId: number; x: number } | null>(null);

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

  const dragProgress = Math.min(Math.abs(x) / 80, 1);
  const backgroundOpacity = 0.3 + dragProgress * 0.7;
  const trashScale = 0.8 + dragProgress * 0.3;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disableSwipe) return;
    dragStartRef.current = { pointerId: event.pointerId, x: event.clientX };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disableSwipe) return;
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    const nextX = Math.max(-120, Math.min(0, event.clientX - dragStart.x));
    setX(nextX);
    setWillDelete(nextX < -80);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disableSwipe) return;
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    setIsDragging(false);
    if (x < -80) {
      setShowConfirm(true);
    } else {
      setX(0);
    }
    setWillDelete(false);
  };

  const triggerDelete = () => {
    setShowConfirm(true);
  };

  return (
    <div className="relative overflow-hidden w-full select-none" style={{ touchAction: "pan-y" }}>
      {/* Background deletion action area */}
      {!disableSwipe && (
        <div
          className="absolute inset-0 flex items-center justify-end px-4"
          style={{
            background: "rgb(239, 68, 68)", // Red background
            opacity: backgroundOpacity,
            zIndex: 0,
          }}
        >
          <div
            className="flex items-center gap-1.5 text-white font-semibold text-xs pr-2"
            style={{
              opacity: dragProgress,
              transform: `scale(${trashScale})`,
            }}
          >
            <Trash2 size={16} className={willDelete ? "animate-bounce" : ""} />
            <span>{willDelete ? "Release to Delete" : "Swipe to Delete"}</span>
          </div>
        </div>
      )}

      {/* Foreground list item content */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          transform: `translateX(${x}px)`,
          zIndex: 1,
          position: "relative",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          transition: isDragging ? "none" : "transform 150ms ease",
        }}
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
          onClick={() => setShowEdit(true)}
          aria-label="Edit"
          className="ml-1 rounded-[6px] p-2 cursor-pointer transition-colors hover:text-[var(--accent-primary)] shrink-0"
          style={{ color: "var(--text-disabled)" }}
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={triggerDelete}
          aria-label="Delete"
          className="rounded-[6px] p-2 cursor-pointer transition-colors hover:text-red-500 shrink-0"
          style={{ color: "var(--text-disabled)" }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {showEdit && (
        <Suspense fallback={null}>
          <AddTx transaction={tx} onClose={() => setShowEdit(false)} />
        </Suspense>
      )}

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
                  setX(0);
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
                  setX(-120);
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
