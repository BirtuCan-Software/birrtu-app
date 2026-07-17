import React from "react";
import { accountLabel, formatETB } from "@/lib/format";
import type { Account } from "@/lib/db";
import { Smartphone, Landmark, Wallet, Signal, HelpCircle } from "lucide-react";
import { useTx } from "@/lib/tx-store";

const icons: Record<string, typeof Wallet> = {
  telebirr: Signal,
  cbe_birr: Smartphone,
  bank: Landmark,
  cash: Wallet,
  mobile: Smartphone,
  custom: Wallet,
};

export interface WalletCardProps {
  account: Account;
  balance: number;
  key?: React.Key;
}

export function WalletCard({ account, balance }: WalletCardProps) {
  const { wallets } = useTx();
  const wallet = wallets.find((w) => w.id === account);

  const type = wallet ? wallet.type : account;
  const Icon = icons[type] || HelpCircle;
  const name = wallet ? wallet.name : accountLabel(account);
  const accNum = wallet?.accountNumber;

  return (
    <div
      className="shadow-hard-md flex flex-col justify-between rounded-[16px] p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        minHeight: 140,
      }}
    >
      <div className="flex items-start justify-between">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] overflow-hidden"
          style={{
            background: "var(--bg-surface-sunken)",
            color: "var(--accent-primary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {wallet?.logoUrl ? (
            <img src={wallet.logoUrl} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Icon size={18} strokeWidth={2} />
          )}
        </span>
        <div className="flex flex-col items-end">
          <span
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            ETB
          </span>
          {accNum && (
            <span
              className="mt-1 font-mono text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {accNum}
            </span>
          )}
        </div>
      </div>
      <div>
        <div
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}
        >
          {name}
        </div>
        <div
          className="tabular mt-1 text-xl font-bold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {formatETB(balance)}
        </div>
      </div>
    </div>
  );
}
