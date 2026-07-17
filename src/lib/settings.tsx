import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAccount } from "./accounts";

export type Preset = "tangelo" | "arctic" | "solar" | "obsidian";
export type Mode = "dark" | "light";
export type Font = "geometric" | "technical" | "neutral" | "classic";

export interface Settings {
  preset: Preset;
  mode: Mode;
  font: Font;
  autoSync: boolean;
  deviceLock: boolean;
  timeFormat: "12hr" | "24hr";
}

const DEFAULTS: Settings = {
  preset: "tangelo",
  mode: "dark",
  font: "geometric",
  autoSync: false,
  deviceLock: false,
  timeFormat: "12hr",
};

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsCtx = createContext<Ctx | null>(null);

function resolveMode(preset: Preset, mode: Mode): Mode {
  if (preset === "obsidian") return "dark";
  return mode;
}

export function SettingsProvider({ children }: { children: ReactNode; key?: React.Key }) {
  const { activeAccountId } = useAccount();
  const accountKey = `maal-settings-v1-${activeAccountId}`;

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(accountKey);
      if (raw) {
        setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } else {
        setSettings(DEFAULTS);
      }
    } catch {
      setSettings(DEFAULTS);
    }
    setReady(true);
  }, [accountKey]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.preset = settings.preset;
    root.dataset.mode = resolveMode(settings.preset, settings.mode);
    root.dataset.font = settings.font;
    localStorage.setItem(accountKey, JSON.stringify(settings));
  }, [settings, ready, accountKey]);

  const update = (patch: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  return (
    <SettingsCtx.Provider value={{ settings, update }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("SettingsProvider missing");
  return c;
}
