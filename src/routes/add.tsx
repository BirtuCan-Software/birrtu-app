import React, { useState } from "react";
import { useNavigate } from "@/lib/router";
import { Plus, Trash2, X } from "lucide-react";
import { Modal } from "@/components/maal/Modal";
import { useTx } from "@/lib/tx-store";
import type { Account, Transaction, TxType } from "@/lib/db";

const TYPES: { value: TxType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

function toDateTimeLocal(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface ItemDraft {
  id: string;
  label: string;
  price: string;
  quantity: string;
}

function emptyItem(): ItemDraft {
  return { id: crypto.randomUUID(), label: "", price: "", quantity: "" };
}

export default function AddTx({
  transaction,
  onClose,
}: {
  transaction?: Transaction;
  onClose?: () => void;
}) {
  const nav = useNavigate();
  const { addTx, updateTx, wallets } = useTx();
  const isEditing = !!transaction;
  const walletChoices = wallets.filter(
    (w) => !w.deleted || w.id === transaction?.account || w.id === transaction?.toAccount,
  );
  const [type, setType] = useState<TxType>(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [account, setAccount] = useState<Account>(
    () => transaction?.account || walletChoices[0]?.id || "telebirr",
  );
  const [toAccount, setToAccount] = useState<Account>(
    () => transaction?.toAccount || walletChoices[1]?.id || walletChoices[0]?.id || "cash",
  );
  const [description, setDescription] = useState(transaction?.description || "");
  const [timestamp, setTimestamp] = useState(() =>
    toDateTimeLocal(transaction?.timestamp || new Date().toISOString()),
  );
  const [itemsExpanded, setItemsExpanded] = useState(() => !!transaction?.items?.length);
  const [items, setItems] = useState<ItemDraft[]>(() =>
    transaction?.items?.length
      ? transaction.items.map((item) => ({
          id: item.id,
          label: item.label,
          price: String(item.price),
          quantity: String(item.quantity),
        }))
      : [emptyItem()],
  );
  const [submitting, setSubmitting] = useState(false);

  const typeColor =
    type === "income"
      ? "var(--income-positive)"
      : type === "expense"
        ? "var(--expense-negative)"
        : "var(--accent-secondary)";

  const parsedItems = items
    .filter((item) => item.label.trim() || item.price || item.quantity)
    .map((item) => ({
      id: item.id,
      label: item.label.trim(),
      price: parseFloat(item.price),
      quantity: parseFloat(item.quantity),
    }));
  const itemTotal = parsedItems.reduce(
    (sum, item) =>
      Number.isFinite(item.price) && Number.isFinite(item.quantity)
        ? sum + item.price * item.quantity
        : sum,
    0,
  );
  const amountValue = itemsExpanded ? (itemTotal > 0 ? itemTotal.toFixed(2) : "") : amount;
  const hasInvalidItem =
    itemsExpanded &&
    parsedItems.some(
      (item) =>
        !item.label ||
        !Number.isFinite(item.price) ||
        !Number.isFinite(item.quantity) ||
        item.price <= 0 ||
        item.quantity <= 0,
    );

  const close = () => {
    if (onClose) onClose();
    else nav({ to: "/" });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (walletChoices.length === 0) return;
    const n = itemsExpanded ? itemTotal : parseFloat(amount);
    const selectedTimestamp = new Date(timestamp);
    if (!n || n <= 0) return;
    if (Number.isNaN(selectedTimestamp.getTime())) return;
    if (type === "transfer" && account === toAccount) return;
    if (hasInvalidItem) return;
    setSubmitting(true);
    const payload = {
      amount: n,
      type,
      account,
      toAccount: type === "transfer" ? toAccount : undefined,
      description: description.trim(),
      items: itemsExpanded && parsedItems.length > 0 ? parsedItems : undefined,
      timestamp: selectedTimestamp.toISOString(),
    };
    if (transaction) await updateTx(transaction.id, payload);
    else await addTx(payload);
    close();
  }

  return (
    <Modal ariaLabel={isEditing ? "Edit transaction" : "New transaction"}>
      <div
        className="shadow-hard-lg flex max-h-full w-full max-w-[720px] touch-auto flex-col rounded-[20px]"
        style={{
          background: "var(--bg-base)",
          border: "2px solid var(--border-strong)",
        }}
      >
        <header
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {isEditing ? "Edit transaction" : "New transaction"}
          </h1>
          <button
            type="button"
            onClick={close}
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
          className="flex min-h-0 flex-1 flex-col"
        >
        <div className="min-h-0 flex-1 touch-pan-y space-y-5 overflow-y-auto overscroll-contain p-4">
          {walletChoices.length === 0 && (
            <div className="rounded-[12px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] p-4 text-center">
              <p className="text-sm font-bold">Add a wallet first</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Transactions need a wallet to hold their balance.
              </p>
              <button
                type="button"
                onClick={() => nav({ to: "/wallets" })}
                className="btn-primary mt-3 cursor-pointer px-4 py-2 text-xs font-bold"
              >
                Go to Wallets
              </button>
            </div>
          )}
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
            placeholder={itemsExpanded ? "" : "0.00"}
            value={amountValue}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={itemsExpanded}
            className="tabular w-full rounded-[10px] px-4 py-4 text-3xl font-bold outline-none"
            style={{
              background: "var(--bg-surface-sunken)",
              color: "var(--text-primary)",
              border: "2px solid var(--border-subtle)",
            }}
            required
          />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setItemsExpanded((expanded) => !expanded)}
            className="cursor-pointer p-0 text-sm font-semibold underline underline-offset-4"
            style={{ color: "var(--accent-primary)" }}
          >
            {itemsExpanded ? "Hide item details" : "Add item details"}
          </button>

          {itemsExpanded && (
            <div
              className="space-y-2 rounded-[12px] p-3"
              style={{
                background: "var(--bg-surface-sunken)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="grid grid-cols-[1fr_86px_70px_34px] gap-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>Label</span>
                <span>Price</span>
                <span>Qty</span>
                <span />
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_86px_70px_34px] gap-2">
                  <input
                    value={item.label}
                    onChange={(e) =>
                      setItems((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, label: e.target.value } : row,
                        ),
                      )
                    }
                    className="min-w-0 rounded-[8px] px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) =>
                      setItems((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, price: e.target.value } : row,
                        ),
                      )
                    }
                    className="min-w-0 rounded-[8px] px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, quantity: e.target.value } : row,
                        ),
                      )
                    }
                    className="min-w-0 rounded-[8px] px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) =>
                        current.length === 1
                          ? [emptyItem()]
                          : current.filter((row) => row.id !== item.id),
                      )
                    }
                    aria-label="Remove item"
                    className="flex h-[38px] w-[34px] items-center justify-center rounded-[8px] cursor-pointer"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-disabled)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setItems((current) => [...current, emptyItem()])}
                  aria-label="Add item"
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] cursor-pointer"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--accent-primary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Plus size={16} />
                </button>
                <div className="tabular text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {itemTotal.toFixed(2)} ETB
                </div>
              </div>
            </div>
          )}
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
            {walletChoices.map((w) => {
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
                  {w.name}{w.deleted ? " (deleted)" : ""}
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
              {walletChoices.map((w) => {
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
                    {w.name}{w.deleted ? " (deleted)" : ""}
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

        <div>
          <label
            className="mb-1 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Date and time
          </label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full rounded-[10px] px-4 py-3 outline-none"
            style={{
              background: "var(--bg-surface-sunken)",
              color: "var(--text-primary)",
              border: "2px solid var(--border-subtle)",
            }}
            required
          />
        </div>

        </div>

        <div className="flex shrink-0 gap-3 border-t border-[var(--border-subtle)] p-4">
          <button
            type="button"
            onClick={close}
            className="btn-ghost flex-1 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting ||
              walletChoices.length === 0 ||
              hasInvalidItem ||
              (itemsExpanded ? itemTotal <= 0 : !amount)
            }
            className="btn-primary flex-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
        </form>
      </div>
    </Modal>
  );
}
