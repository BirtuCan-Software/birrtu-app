import React, { useState } from "react";
import { useTx } from "@/lib/tx-store";
import { formatETB } from "@/lib/format";
import type { Wallet, WalletType } from "@/lib/db";
import { WalletFormDialog } from "@/components/maal/wallets/WalletFormDialog";
import { WalletDeleteConfirmDialog } from "@/components/maal/wallets/WalletDeleteConfirmDialog";
import {
  Smartphone,
  Landmark,
  Wallet as WalletIcon,
  Trash2,
  Edit,
  Plus,
  HelpCircle,
  TrendingUp,
  PieChart as LucidePieChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const icons: Record<string, typeof WalletIcon> = {
  bank: Landmark,
  cash: WalletIcon,
  mobile: Smartphone,
  other: HelpCircle,
};

const typeLabels: Record<WalletType, string> = {
  bank: "Bank",
  cash: "Cash",
  mobile: "Mobile",
  other: "Other",
};

export default function WalletsPage() {
  const { wallets, balances, addWallet, updateWallet, deleteWallet } = useTx();

  const [isOpen, setIsOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);

  // Asset Weight Distribution State
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"wallet" | "type">("wallet");

  const activeWallets = wallets.filter((w) => !w.deleted);

  const COLORS = [
    "var(--accent-primary)",
    "var(--accent-secondary)",
    "var(--income-positive)",
    "var(--warning)",
    "#ec4899",
    "#3b82f6",
    "#8b5cf6",
    "#eab308",
    "#06b6d4",
  ];

  // Grouping 1: Individual Wallets
  const walletDistribution = React.useMemo(() => {
    const walletBalances = activeWallets.map(w => {
      const balance = balances[w.id] || 0;
      return {
        id: w.id,
        name: w.name,
        balance: Math.max(0, balance),
        type: w.type,
        logoUrl: w.logoUrl,
      };
    });

    const total = walletBalances.reduce((sum, w) => sum + w.balance, 0);

    return walletBalances.map(w => {
      const percentage = total > 0 ? (w.balance / total) * 100 : 0;
      return {
        id: w.id,
        name: w.name,
        balance: w.balance,
        percentage: parseFloat(percentage.toFixed(1)),
        type: w.type,
        logoUrl: w.logoUrl,
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [activeWallets, balances]);

  // Grouping 2: Wallet Types
  const typeDistribution = React.useMemo(() => {
    const typeBalances: Record<WalletType, number> = {
      bank: 0,
      cash: 0,
      mobile: 0,
      other: 0,
    };

    activeWallets.forEach(w => {
      const balance = balances[w.id] || 0;
      typeBalances[w.type] = (typeBalances[w.type] || 0) + Math.max(0, balance);
    });

    const total = Object.values(typeBalances).reduce((sum, val) => sum + val, 0);

    return (Object.keys(typeBalances) as WalletType[]).map(type => {
      const balance = typeBalances[type] || 0;
      const percentage = total > 0 ? (balance / total) * 100 : 0;
      return {
        id: type,
        name: typeLabels[type] || type,
        balance,
        percentage: parseFloat(percentage.toFixed(1)),
        type,
      };
    }).filter(t => t.balance > 0 || total === 0)
      .sort((a, b) => b.balance - a.balance);
  }, [activeWallets, balances]);

  const totalLiquidAssets = React.useMemo(() => {
    return activeWallets.reduce((sum, w) => sum + Math.max(0, balances[w.id] || 0), 0);
  }, [activeWallets, balances]);

  const activeDistribution = viewMode === "wallet" ? walletDistribution : typeDistribution;

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="rounded-[10px] p-3 shadow-hard-sm text-xs"
          style={{
            background: "var(--bg-surface-raised)",
            border: "2px solid var(--border-strong)",
            color: "var(--text-primary)",
          }}
        >
          <p className="font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {data.name}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] mt-1">
            <span className="font-semibold text-[var(--accent-primary)]">
              {formatETB(data.balance)} ETB
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              ({data.percentage}%)
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const openAdd = () => {
    setEditingWallet(null);
    setIsOpen(true);
  };

  const openEdit = (w: Wallet) => {
    setEditingWallet(w);
    setIsOpen(true);
  };

  const handleFormSubmit = (data: {
    name: string;
    type: WalletType;
    accountNumber: string;
    accountHolder: string;
    logoUrl?: string;
  }) => {
    if (editingWallet) {
      updateWallet(editingWallet.id, data);
    } else {
      addWallet(data);
    }
    setIsOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingWallet) {
      deleteWallet(deletingWallet.id);
      setDeletingWallet(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Wallets
          </h1>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-sm cursor-pointer font-bold">
          <Plus size={16} /> Add Wallet
        </button>
      </div>

      {/* Grid of active wallets */}
      {activeWallets.length === 0 ? (
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
            <WalletIcon size={32} className="text-[var(--accent-primary)] animate-pulse" />
          </div>
          <div className="space-y-1.5 max-w-[280px]">
            <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              No wallets available
            </p>
            <p className="text-xs leading-relaxed">
              Create a wallet/account first to start tracking your balances, bank statements, and transactions.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeWallets.map((w) => {
            const Icon = icons[w.type] || HelpCircle;
            const balance = balances[w.id] || 0;

            return (
              <div
                key={w.id}
                className="shadow-hard-md flex items-start justify-between rounded-[16px] p-4 gap-3 transition-all"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] overflow-hidden shrink-0"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      color: "var(--accent-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {w.logoUrl ? (
                      <img src={w.logoUrl} alt={w.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Icon size={22} strokeWidth={2} />
                    )}
                  </span>
                  
                  <div className="min-w-0 flex-1 whitespace-normal">
                    <h3 className="font-bold text-base leading-snug break-words" style={{ color: "var(--text-primary)" }}>
                      {w.name}
                    </h3>
                    
                    {/* Separate line: Wallet Type Badge */}
                    <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                      <span
                        className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--bg-surface-sunken)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {typeLabels[w.type] || w.type}
                      </span>
                    </div>

                    {/* Separate line: Account Number */}
                    {w.accountNumber && (
                      <div className="mt-1.5 text-xs text-left leading-relaxed break-all" style={{ color: "var(--text-secondary)" }}>
                        <span className="font-semibold select-all">
                          Acc: <span className="font-mono text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>{w.accountNumber}</span>
                        </span>
                      </div>
                    )}

                    {/* Separate line: Account Holder Name */}
                    {w.accountHolder && (
                      <div className="mt-1 text-xs text-left leading-relaxed break-words" style={{ color: "var(--text-secondary)" }}>
                        <span className="font-semibold">
                          Holder: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{w.accountHolder}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 justify-between self-stretch shrink-0">
                  <div className="text-right">
                    <div className="tabular text-base font-bold" style={{ color: "var(--text-primary)" }}>
                      {formatETB(balance)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-secondary)" }}>
                      Balance ETB
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(w)}
                      aria-label="Edit wallet"
                      className="p-1.5 rounded-[6px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingWallet(w)}
                      aria-label="Delete wallet"
                      className="p-1.5 rounded-[6px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Weight Distribution Section */}
      {activeWallets.length > 0 && (
        <div
          id="asset-weight-distribution-section"
          className="shadow-hard-md rounded-[20px] p-6 space-y-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-2.5">
              <span
                className="h-9 w-9 rounded-[8px] flex items-center justify-center shrink-0"
                style={{
                  background: "var(--bg-surface-sunken)",
                  color: "var(--accent-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <TrendingUp size={18} />
              </span>
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Asset Weight Distribution
                </h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Visualize the asset proportion and balance weighting
                </p>
              </div>
            </div>

            {/* Tab selector */}
            <div
              className="inline-flex rounded-[8px] p-1 self-start"
              style={{
                background: "var(--bg-surface-sunken)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setViewMode("wallet");
                  setActiveIndex(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  viewMode === "wallet"
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)] shadow-hard-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                By Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("type");
                  setActiveIndex(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  viewMode === "type"
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)] shadow-hard-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                By Category
              </button>
            </div>
          </div>

          {/* Asset Distribution Content */}
          {totalLiquidAssets === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-secondary)] flex flex-col items-center gap-2">
              <LucidePieChart size={32} className="opacity-40 animate-pulse text-[var(--accent-primary)]" />
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                No active balances to distribute
              </p>
              <p className="text-xs max-w-[320px] leading-relaxed">
                Add standard transaction entries or customize wallet starting balances to visualize real asset weights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Pie Chart Column */}
              <div className="md:col-span-5 flex justify-center relative">
                <div className="w-60 h-60 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={activeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={92}
                        paddingAngle={activeDistribution.length > 1 ? 3 : 0}
                        dataKey="balance"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        {activeDistribution.map((entry, idx) => {
                          const isHovered = activeIndex === idx;
                          return (
                            <Cell
                              key={`cell-${entry.id}`}
                              fill={COLORS[idx % COLORS.length]}
                              stroke="var(--bg-surface)"
                              strokeWidth={isHovered ? 4 : 2}
                              style={{
                                filter: isHovered ? "brightness(1.15)" : "brightness(0.95)",
                                cursor: "pointer",
                                transition: "all 0.15s ease-in-out",
                              }}
                            />
                          );
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Dynamic center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      {activeIndex !== null && activeIndex < activeDistribution.length ? activeDistribution[activeIndex].name : "Total Assets"}
                    </span>
                    <span className="text-base font-bold tabular mt-0.5 tracking-tight break-all leading-tight" style={{ color: "var(--text-primary)" }}>
                      {activeIndex !== null && activeIndex < activeDistribution.length
                        ? formatETB(activeDistribution[activeIndex].balance)
                        : formatETB(totalLiquidAssets)}
                    </span>
                    <span className="text-[9px] font-mono font-bold mt-0.5" style={{ color: "var(--accent-primary)" }}>
                      {activeIndex !== null && activeIndex < activeDistribution.length ? `${activeDistribution[activeIndex].percentage}%` : "100.0% Weight"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend/Breakdown Column */}
              <div className="md:col-span-7 space-y-3">
                <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                  {activeDistribution.map((item, idx) => {
                    const isHovered = activeIndex === idx;
                    const color = COLORS[idx % COLORS.length];
                    const Icon = icons[item.type] || HelpCircle;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(null)}
                        className={`p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 cursor-pointer ${
                          isHovered
                            ? "bg-[var(--bg-surface-sunken)] border-[var(--accent-primary)] shadow-hard-sm scale-[1.01]"
                            : "bg-[var(--bg-surface-sunken)] border-[var(--border-subtle)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Color Dot with dynamic background */}
                            <span
                              className="h-3 w-3 rounded-full shrink-0 border border-zinc-950/20"
                              style={{ background: color }}
                            />
                            {/* Icon or custom image */}
                            <span
                              className="h-6 w-6 rounded-[5px] flex items-center justify-center shrink-0"
                              style={{
                                background: "var(--bg-surface-raised)",
                                border: "1.5px solid var(--border-subtle)",
                                color: color,
                              }}
                            >
                              {item.logoUrl ? (
                                <img src={item.logoUrl} alt={item.name} className="h-full w-full object-cover rounded-[3px]" referrerPolicy="no-referrer" />
                              ) : (
                                <Icon size={12} strokeWidth={2.5} />
                              )}
                            </span>
                            <span className="font-bold truncate text-xs" style={{ color: "var(--text-primary)" }}>
                              {item.name}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold tabular text-xs" style={{ color: "var(--text-primary)" }}>
                              {formatETB(item.balance)} ETB
                            </span>
                            <span className="text-[9px] font-semibold block text-right mt-0.5" style={{ color: "var(--text-secondary)" }}>
                              {item.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Weight progress bar matching the slice color */}
                        <div className="w-full bg-[var(--bg-surface-raised)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${item.percentage}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Micro-insight note */}
                <div
                  className="rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2 border border-dashed"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--bg-surface-sunken)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="text-base leading-none">💡</span>
                  <p>
                    {walletDistribution.length > 0 && (
                      <>
                        Your largest holding is in{" "}
                        <span className="font-bold text-[var(--text-primary)]">
                          {walletDistribution[0].name}
                        </span>{" "}
                        comprising{" "}
                        <span className="font-mono font-bold text-[var(--accent-primary)]">
                          {walletDistribution[0].percentage}%
                        </span>{" "}
                        of your total assets. Maintain optimal diversification between cash, banks, and mobile wallets to minimize payment bottlenecks.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide up / dialog overlay for form */}
      <WalletFormDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSubmit={handleFormSubmit} 
        wallet={editingWallet} 
      />

      {/* Custom Confirmation Dialog for Deleting Wallets */}
      <WalletDeleteConfirmDialog 
        wallet={deletingWallet} 
        onClose={() => setDeletingWallet(null)} 
        onConfirm={handleDeleteConfirm} 
      />
    </div>
  );
}
