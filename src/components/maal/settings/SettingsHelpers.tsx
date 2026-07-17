import React from "react";
import { type Preset, type Mode, type Font } from "@/lib/settings";

export const PRESETS: { value: Preset; label: string; colors: string[]; modes: Mode[] }[] = [
  { value: "tangelo", label: "Tangelo Neon", colors: ["#ff5a1f", "#2d8cff", "#0a0b0f"], modes: ["dark", "light"] },
  { value: "arctic", label: "Arctic Pulse", colors: ["#2d8cff", "#00f58c", "#0a0d14"], modes: ["dark", "light"] },
  { value: "solar", label: "Amethyst Glow", colors: ["#a855f7", "#ec4899", "#0d0914"], modes: ["dark", "light"] },
  { value: "obsidian", label: "Obsidian Mono", colors: ["#f4f5f7", "#3a3d46", "#050506"], modes: ["dark"] },
];

export const FONTS: { value: Font; label: string; family: string; example: string }[] = [
  { value: "geometric", label: "Geometric (Space Grotesk)", family: '"Space Grotesk", sans-serif', example: "Abc 123" },
  { value: "technical", label: "Technical (JetBrains Mono)", family: '"JetBrains Mono", monospace', example: "Abc 123" },
  { value: "neutral", label: "Neutral (Inter Sans)", family: '"Inter", sans-serif', example: "Abc 123" },
  { value: "classic", label: "Classic (Georgia Serif)", family: '"Playfair Display", Georgia, serif', example: "Abc 123" },
];

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="shadow-hard-sm rounded-[16px] p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <h2
        className="mb-3 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {hint && (
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {hint}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out p-0.5"
        style={{
          background: checked ? "var(--accent-primary)" : "var(--bg-surface-sunken)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <span
          className="pointer-events-none block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out"
          style={{
            transform: checked ? "translateX(20px)" : "translateX(0px)",
            border: "1px solid var(--border-strong)",
          }}
        />
      </button>
    </div>
  );
}
