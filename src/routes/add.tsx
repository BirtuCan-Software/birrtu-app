import React, { useState } from "react";
import { useNavigate } from "@/lib/router";
import { X } from "lucide-react";
import { useTx } from "@/lib/tx-store";
import type { Account, TxType } from "@/lib/db";

const TYPES: { value: TxType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export default function AddTx() {
  const nav = useNavigate();
  const { addTx, wallets } = useTx();
  const activeWallets = wallets.filter((w) => !w.deleted);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState<Account>(() => activeWallets[0]?.id || "telebirr");
  const [toAccount, setToAccount] = useState<Account>(() => activeWallets[1]?.id || activeWallets[0]?.id || "cash");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const typeColor =
    type === "income"
      ? "var(--income-positive)"
      : type === "expense"
        ? "var(--expense-negative)"
        : "var(--accent-secondary)";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    if (type === "transfer" && account === toAccount) return;
    setSubmitting(true);
    await addTx({
      amount: n,
      type,
      account,
      toAccount: type === "transfer" ? toAccount : undefined,
      description: description.trim(),
      timestamp: new Date().toISOString(),
    });
    nav({ to: "/" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          New transaction
        </h1>
        <button
          type="button"
          onClick={() => nav({ to: "/" })}
          aria-label="Close"
          className="rounded-[6px] p-2 cursor-pointer transition-transform active:scale-95"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <X size={18} />
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-5 overflow-auto p-4"
      >
        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => {
            const active = t.value === type;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => setType(t.value)}
                className="rounded-[10px] py-3 text-sm font-semibold cursor-pointer transition-all"
                style={{
                  background: active ? "var(--bg-surface)" : "var(--bg-surface-sunken)",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  border: `2px solid ${active ? typeColor : "var(--border-subtle)"}`,
                  boxShadow: active ? `2px 2px 0 0 ${typeColor}` : "none",
                  fontFamily: "var(--font-display)",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <div>
          <label
            className="mb-1 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Amount (ETB)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular w-full rounded-[10px] px-4 py-4 text-3xl font-bold outline-none"
            style={{
              background: "var(--bg-surface-sunken)",
              color: "var(--text-primary)",
              border: "2px solid var(--border-subtle)",
            }}
            required
          />
        </div>

        {/* From account */}
        <div>
          <label
            className="mb-1 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            {type === "transfer" ? "From wallet" : "Wallet"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {activeWallets.map((w) => {
              const active = w.id === account;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setAccount(w.id)}
                  className="rounded-[10px] py-3 px-2 text-sm font-semibold truncate cursor-pointer transition-all"
                  style={{
                    background: active ? "var(--bg-surface)" : "var(--bg-surface-sunken)",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    border: `2px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  }}
                >
                  {w.name}
                </button>
              );
            })}
          </div>
        </div>

        {type === "transfer" && (
          <div>
            <label
              className="mb-1 block text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              To wallet
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activeWallets.map((w) => {
                const active = w.id === toAccount;
                const disabled = w.id === account;
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setToAccount(w.id)}
                    className="rounded-[10px] py-3 px-2 text-sm font-semibold truncate disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                    style={{
                      background: active
                        ? "var(--bg-surface)"
                        : "var(--bg-surface-sunken)",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      border: `2px solid ${active ? "var(--accent-secondary)" : "var(--border-subtle)"}`,
                    }}
                  >
                    {w.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label
            className="mb-1 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Description
          </label>
          <textarea
            placeholder="e.g. Lunch, Customer payment"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-[10px] px-4 py-3 outline-none resize-none"
            style={{
              background: "var(--bg-surface-sunken)",
              color: "var(--text-primary)",
              border: "2px solid var(--border-subtle)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>

        <div className="mt-auto flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => nav({ to: "/" })}
            className="btn-ghost flex-1 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !amount}
            className="btn-primary flex-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
