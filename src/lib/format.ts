import type { Wallet } from "./db";

export function formatETB(n: number): string {
  const abs = Math.abs(n);
  return abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTime(
  dateInput: Date | string | number,
  timeFormat: "12hr" | "24hr",
  includeSeconds = false
): string {
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], {
    hour12: timeFormat === "12hr",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
  });
}

export function formatDateTime(
  dateInput: Date | string | number,
  timeFormat: "12hr" | "24hr"
): string {
  const date = new Date(dateInput);
  const dateStr = date.toLocaleDateString();
  const timeStr = formatTime(date, timeFormat, false);
  return `${dateStr}, ${timeStr}`;
}

export function accountLabel(a: string, wallets?: Wallet[]): string {
  if (wallets) {
    const found = wallets.find((w) => w.id === a);
    if (found) return found.name;
  }
  switch (a) {
    case "telebirr":
      return "Telebirr";
    case "cbe_birr":
      return "CBE Birr";
    case "bank":
      return "Bank";
    case "cash":
      return "Cash";
    default:
      return a;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
