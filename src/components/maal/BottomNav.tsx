import React from "react";
import { Link, useRouterState, type RoutePath } from "@/lib/router";
import { Home, List, Plus, Settings as SettingsIcon, Wallet as WalletIcon } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/transactions", label: "Activity", icon: List },
] as const;

const rightTabs = [
  { to: "/wallets", label: "Wallets", icon: WalletIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const path = location.pathname;

  const renderTab = (t: { to: RoutePath; label: string; icon: any }) => {
    const active = path === t.to;
    const Icon = t.icon;
    return (
      <Link
        key={t.to}
        to={t.to}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
        style={{
          color: active ? "var(--accent-primary)" : "var(--text-secondary)",
        }}
      >
        <Icon size={22} strokeWidth={2} />
        <span className="text-[11px] font-medium">{t.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="z-40 flex items-end px-2 pb-[env(safe-area-inset-bottom)] py-1 w-full shrink-0"
      style={{
        background: "var(--bg-surface-raised)",
        borderTop: "1px solid var(--border-subtle)",
        boxShadow: "0 -4px 0 0 var(--border-subtle)",
      }}
    >
      <div className="flex flex-1 items-center">{tabs.map(renderTab)}</div>
      <div className="relative -mt-6 flex w-20 items-center justify-center">
        <Link
          to="/add"
          aria-label="Add transaction"
          className="press-3d flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "var(--accent-primary)",
            color: "var(--accent-primary-fg)",
            boxShadow: "4px 4px 0 0 var(--border-strong)",
            filter: "brightness(0.9)",
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </Link>
      </div>
      <div className="flex flex-1 items-center">{rightTabs.map(renderTab)}</div>
    </nav>
  );
}
