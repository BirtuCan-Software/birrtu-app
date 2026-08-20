import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Wallet, WalletType } from "@/lib/db";
import { Modal } from "@/components/maal/Modal";
import { 
  Check,
  ChevronDown,
  X, 
  Upload, 
  Search,
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

const bankLogoModules = import.meta.glob("../../../assets/banks/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const bankLogos = Object.entries(bankLogoModules)
  .map(([path, url]) => {
    const fileName = path.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    const name = fileName
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return { name, url };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

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
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [logoSearch, setLogoSearch] = useState("");
  const logoPickerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoSearchRef = useRef<HTMLInputElement>(null);

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
    setLogoPickerOpen(false);
    setLogoSearch("");
  }, [wallet, isOpen, currentBalance]);

  const selectedBankLogo = useMemo(
    () => bankLogos.find((logo) => logo.url === logoUrl),
    [logoUrl],
  );

  const filteredBankLogos = useMemo(() => {
    const query = logoSearch.trim().toLowerCase();
    if (!query) return bankLogos;
    return bankLogos.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [logoSearch]);

  useEffect(() => {
    if (!logoPickerOpen) return;
    logoSearchRef.current?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (!logoPickerRef.current?.contains(event.target as Node)) {
        setLogoPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [logoPickerOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo file is too large. Please select an image under 2MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        e.target.value = "";
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
              Logo (Optional)
            </label>
            <div ref={logoPickerRef} className="relative flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-[12px] border-2 flex items-center justify-center overflow-hidden shrink-0 p-1.5"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-surface-sunken)",
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Selected logo" className="h-full w-full object-contain" />
                ) : (
                  <Landmark size={18} style={{ color: "var(--text-secondary)" }} />
                )}
              </div>
              <button
                type="button"
                onClick={() => setLogoPickerOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={logoPickerOpen}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold cursor-pointer"
                style={{
                  background: "var(--bg-surface-sunken)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-subtle)",
                }}
              >
                <span className="min-w-0 truncate">
                  {selectedBankLogo?.name || (logoUrl ? "Custom logo" : "Choose a bank logo")}
                </span>
                <ChevronDown size={16} className="shrink-0" />
              </button>
              <input
                ref={logoInputRef}
                id="logo-input"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  aria-label="Remove logo"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] cursor-pointer"
                  style={{
                    background: "var(--bg-surface-sunken)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <X size={16} />
                </button>
              )}

              {logoPickerOpen && (
                <div
                  role="listbox"
                  className="shadow-hard-md absolute bottom-full left-0 right-0 z-30 mb-2 rounded-[10px] p-2"
                  style={{
                    background: "var(--bg-surface-raised)",
                    border: "2px solid var(--border-strong)",
                  }}
                >
                  <div
                    className="mb-2 flex items-center gap-2 rounded-[8px] px-3 py-2"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Search size={14} style={{ color: "var(--text-secondary)" }} />
                    <input
                      ref={logoSearchRef}
                      type="search"
                      value={logoSearch}
                      onChange={(e) => setLogoSearch(e.target.value)}
                      placeholder="Search banks..."
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {filteredBankLogos.map((logo) => {
                      const active = logo.url === logoUrl;
                      return (
                        <button
                          key={logo.url}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setLogoUrl(logo.url);
                            setLogoPickerOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left text-sm font-semibold cursor-pointer"
                          style={{
                            background: active ? "var(--bg-surface-sunken)" : "transparent",
                            color: active ? "var(--accent-primary)" : "var(--text-primary)",
                          }}
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] p-1"
                            style={{ background: "var(--bg-surface-sunken)" }}
                          >
                            <img src={logo.url} alt="" className="h-full w-full object-contain" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{logo.name}</span>
                          {active && <Check size={15} className="shrink-0" />}
                        </button>
                      );
                    })}
                    {filteredBankLogos.length === 0 && (
                      <p className="px-3 py-3 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        No bank logos found
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPickerOpen(false);
                        logoInputRef.current?.click();
                      }}
                      className="mt-1 flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left text-sm font-bold cursor-pointer"
                      style={{
                        background: "var(--bg-surface-sunken)",
                        color: "var(--accent-primary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]"
                        style={{ background: "var(--bg-surface)" }}
                      >
                        <Upload size={15} />
                      </span>
                      <span className="min-w-0 flex-1">Use custom logo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Pick a built-in Ethiopian bank logo, or use a custom image under 2MB.
            </p>
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
