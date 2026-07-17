import React from "react";
import { Link } from "@/lib/router";
import { useTx } from "@/lib/tx-store";
import { WalletCard } from "@/components/maal/WalletCard";
import { TxRow } from "@/components/maal/TxRow";
import { formatETB } from "@/lib/format";
import { TrendChart } from "@/components/maal/TrendChart";
import { Inbox } from "lucide-react";

export default function Home() {
  const { balances, netBalance, transactions, wallets } = useTx();
  const activeWallets = wallets.filter((w) => !w.deleted);
  const recent = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      <section
        className="shadow-hard-md rounded-[16px] p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          Net Balance
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className="tabular text-4xl font-bold leading-none"
            style={{
              color: netBalance < 0 ? "var(--expense-negative)" : "var(--text-primary)",
            }}
          >
            {netBalance < 0 ? "−" : ""}
            {formatETB(netBalance)}
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            ETB
          </span>
        </div>
      </section>

      {activeWallets.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Wallets
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeWallets.map((w) => (
              <WalletCard key={w.id} account={w.id} balance={balances[w.id] || 0} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Recent activity
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div
            className="rounded-[20px] p-8 text-center text-sm flex flex-col items-center justify-center gap-3 shadow-hard-md"
            style={{
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <div
              className="p-3 rounded-full flex items-center justify-center"
              style={{
                background: "var(--bg-surface-sunken)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Inbox size={28} className="text-[var(--accent-primary)] animate-pulse" />
            </div>
            <div className="space-y-1 max-w-[240px]">
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                No recent activity
              </p>
              <p className="text-xs leading-relaxed">
                Tap the <span style={{ color: "var(--accent-primary)" }} className="font-bold">+</span> button in the footer navigation to record a new transaction.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} disableSwipe={true} />
            ))}
          </div>
        )}
      </section>

      <section
        className="shadow-hard-md rounded-[16px] p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Weekly Trends
        </h2>
        <TrendChart interval="weekly" />
      </section>
    </div>
  );
}
