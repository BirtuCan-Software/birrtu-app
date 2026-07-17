import React from "react";
import { useSettings, type Mode } from "@/lib/settings";
import { PRESETS, FONTS, Section } from "./SettingsHelpers";

export function AppearanceSection() {
  const { settings, update } = useSettings();

  return (
    <>
      {/* Theme presets */}
      <Section title="Appearance · Preset">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const active = p.value === settings.preset;
            return (
              <button
                type="button"
                key={p.value}
                onClick={() => {
                  const nextMode: Mode = p.modes.includes(settings.mode)
                    ? settings.mode
                    : p.modes[0];
                  update({ preset: p.value, mode: nextMode });
                }}
                className="rounded-[10px] p-3 text-left cursor-pointer transition-all flex flex-col gap-3 justify-between"
                style={{
                  background: active ? "var(--bg-surface-sunken)" : "transparent",
                  border: `2px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                }}
              >
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.label}</div>
                <div className="flex gap-1.5 mt-1">
                  {p.colors.map((color, idx) => (
                    <span
                      key={idx}
                      className="h-4.5 w-4.5 rounded-full inline-block shadow-sm"
                      style={{
                        backgroundColor: color,
                        border: "1px solid var(--border-subtle)",
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Font */}
      <Section title="Appearance · Font style">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => {
            const active = f.value === settings.font;
            return (
              <button
                type="button"
                key={f.value}
                onClick={() => update({ font: f.value })}
                className="flex flex-col gap-2 rounded-[12px] p-3 text-left cursor-pointer transition-all"
                style={{
                  background: active ? "var(--bg-surface-sunken)" : "transparent",
                  border: `2px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                }}
              >
                <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                  {f.label}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{
                    fontFamily: f.family,
                    color: "var(--text-primary)",
                  }}
                >
                  {f.example}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Time format */}
      <Section title="Appearance · Time format">
        <div className="grid grid-cols-2 gap-2">
          {(["12hr", "24hr"] as const).map((tf) => {
            const active = settings.timeFormat === tf;
            return (
              <button
                type="button"
                key={tf}
                onClick={() => update({ timeFormat: tf })}
                className="rounded-[10px] py-3 text-sm font-semibold capitalize cursor-pointer transition-all text-center"
                style={{
                  background: active ? "var(--bg-surface-sunken)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  border: `2px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                }}
              >
                {tf === "12hr" ? "12-Hour" : "24-Hour"}
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}
