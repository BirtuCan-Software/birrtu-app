import React from "react";
import { Link } from "@/lib/router";
import { SyncBadge } from "./SyncBadge";
import { useSettings } from "@/lib/settings";
import { useAccount } from "@/lib/accounts";
import { Sun, Moon } from "lucide-react";

export function AppHeader() {
  const { settings, update } = useSettings();
  const { accounts, activeAccountId } = useAccount();
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const resolvedMode = settings.preset === "obsidian" ? "dark" : settings.mode;
  const isDark = resolvedMode === "dark";

  const toggleTheme = () => {
    if (isDark) {
      if (settings.preset === "obsidian") {
        update({ preset: "tangelo", mode: "light" });
      } else {
        update({ mode: "light" });
      }
    } else {
      update({ mode: "dark" });
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
      style={{
        background: "var(--bg-base)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <Link to="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="BirrTu" className="h-8 w-8" />
        <div className="flex flex-col">
          <span
            className="text-sm font-bold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BirrTu
          </span>
          <span className="text-[10px] font-semibold leading-tight" style={{ color: "var(--accent-primary)" }}>
            {activeAccount?.name || "Personal"}
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <SyncBadge />
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          style={{
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
