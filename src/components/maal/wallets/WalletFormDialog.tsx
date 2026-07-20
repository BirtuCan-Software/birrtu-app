import React, { useState, useEffect } from "react";
import type { Wallet, WalletType } from "@/lib/db";
import { Modal } from "@/components/maal/Modal";
import { 
  X, 
  Upload, 
  Smartphone, 
  Landmark, 
  Wallet as WalletIcon, 
  HelpCircle 
} from "lucide-react";

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

interface WalletFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: WalletType;
    accountNumber: string;
    accountHolder: string;
    logoUrl?: string;
    balance?: number;
  }) => void;
  wallet?: Wallet | null;
  currentBalance?: number;
}

export function WalletFormDialog({ isOpen, onClose, onSubmit, wallet, currentBalance }: WalletFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("other");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setAccountNumber(wallet.accountNumber || "");
      setAccountHolder(wallet.accountHolder || "");
      setLogoUrl(wallet.logoUrl || "");
      setBalance(String(currentBalance ?? 0));
    } else {
      setName("");
      setType("other");
      setAccountNumber("");
      setAccountHolder("");
      setLogoUrl("");
      setBalance("");
    }
  }, [wallet, isOpen, currentBalance]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo file is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      type,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      logoUrl: logoUrl || undefined,
      balance: wallet ? Number(balance || 0) : undefined,
    });
  };

  return (
    <Modal ariaLabel={wallet ? "Edit wallet" : "Add wallet"}>
      <div
        className="shadow-hard-lg flex max-h-full w-full max-w-md touch-auto flex-col rounded-[20px] animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: "var(--bg-surface)",
          border: "2px solid var(--border-strong)",
        }}
      >
        <div className="flex shrink-0 items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {wallet ? "Edit Wallet" : "Add Wallet"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] cursor-pointer"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 touch-pan-y space-y-4 overflow-y-auto overscroll-contain px-6 pr-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
                Wallet Name
              </label>
              <input
                type="text"
                placeholder="e.g. Commercial Savings, Pocket Cash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-500 animate-none"
                style={{
                  background: "var(--bg-surface-sunken)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-subtle)",
                }}
                required
              />
            </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
              Wallet Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["bank", "cash", "mobile", "other"] as WalletType[]).map((t) => {
                const active = t === type;
                const Icon = icons[t] || HelpCircle;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all"
                    style={{
                      background: active ? "var(--bg-surface)" : "var(--bg-surface-sunken)",
                      color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                      border: `2px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    }}
                  >
                    <Icon size={18} />
                    <span className="capitalize">{typeLabels[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
              Account Holder Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Abebe Kebede"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg-surface-sunken)",
                color: "var(--text-primary)",
                border: "2px solid var(--border-subtle)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
              Account Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 100012345678"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg-surface-sunken)",
                color: "var(--text-primary)",
                border: "2px solid var(--border-subtle)",
              }}
            />
          </div>

          {wallet && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
                Balance
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg-surface-sunken)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-subtle)",
                }}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
              Custom Logo (Optional)
            </label>
            <div className="flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-[12px] border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-surface-sunken)",
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Upload size={18} style={{ color: "var(--text-secondary)" }} />
                )}
              </div>
              <div className="flex-1">
                <label
                  htmlFor="logo-input"
                  className="btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs cursor-pointer font-bold"
                >
                  <Upload size={14} /> Upload image file
                </label>
                <input
                  id="logo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  Under 2MB file. Uploaded locally (saved in your secure cache).
                </p>
              </div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="p-1 text-red-500 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          </div>

          <div className="flex shrink-0 gap-3 p-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 text-sm py-2.5 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 text-sm py-2.5 font-bold"
            >
              Save Wallet
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
