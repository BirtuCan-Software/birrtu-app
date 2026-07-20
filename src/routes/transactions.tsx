import React, { useState } from "react";
import { useTx } from "@/lib/tx-store";
import { TxRow } from "@/components/maal/TxRow";
import { TrendChart, type TrendInterval } from "@/components/maal/TrendChart";
import { TrendingUp, X, Receipt } from "lucide-react";
import { Modal } from "@/components/maal/Modal";

export default function TxList() {
  const { transactions } = useTx();
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [interval, setInterval] = useState<TrendInterval>("monthly");

  const intervals: { value: TrendInterval; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  const currentLabel = intervals.find((i) => i.value === interval)?.label || "Monthly";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          All activity
        </h1>
        <button
          onClick={() => {
            setIsChartOpen(true);
            setInterval("monthly"); // Default to monthly on open
          }}
          className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs cursor-pointer"
          style={{ boxShadow: "2px 2px 0 0 var(--border-strong)" }}
        >
          <TrendingUp size={14} /> View Trends
        </button>
      </div>

      {transactions.length === 0 ? (
        <div
          className="rounded-[20px] p-10 text-center text-sm flex flex-col items-center justify-center gap-4 shadow-hard-md"
          style={{
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <div
            className="p-3.5 rounded-full flex items-center justify-center"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Receipt size={32} className="text-[var(--accent-primary)] animate-pulse" />
          </div>
          <div className="space-y-1.5 max-w-[280px]">
            <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              No transactions found
            </p>
            <p className="text-xs leading-relaxed">
              Your transaction history is completely empty. Start managing your expenses and income by adding your first entry.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {transactions.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </div>
      )}

      {/* Pop-able Screen Overlay Dialog */}
      {isChartOpen && (
        <Modal ariaLabel={`${currentLabel} trends`}>
          <div
            className="shadow-hard-lg flex max-h-full w-full max-w-lg touch-auto flex-col rounded-[20px] animate-in fade-in zoom-in-95 duration-150"
            style={{
              background: "var(--bg-surface)",
              border: "2px solid var(--border-strong)",
            }}
          >
            <div className="flex shrink-0 items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <TrendingUp size={18} className="text-[var(--accent-primary)]" />
                {currentLabel} Trends
              </h2>
              <button
                onClick={() => setIsChartOpen(false)}
                className="p-1.5 rounded-[6px] cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 touch-pan-y space-y-4 overflow-y-auto overscroll-contain px-6">
              {/* Segmented control toggle for Intervals */}
              <div
                className="flex gap-1 p-1 rounded-[12px] items-center"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {intervals.map((opt) => {
                  const active = opt.value === interval;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setInterval(opt.value)}
                      className="flex-1 py-1.5 text-xs font-bold rounded-[8px] cursor-pointer transition-all text-center select-none"
                      style={{
                        background: active ? "var(--bg-surface)" : "transparent",
                        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                        border: `1px solid ${active ? "var(--border-subtle)" : "transparent"}`,
                        boxShadow: active ? "1px 1px 0 0 rgba(0, 0, 0, 0.05)" : "none",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-1">
                <TrendChart interval={interval} />
              </div>
            </div>

            <div className="flex shrink-0 justify-end p-6 pt-4">
              <button
                type="button"
                onClick={() => setIsChartOpen(false)}
                className="btn-ghost text-xs py-2 px-4 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
