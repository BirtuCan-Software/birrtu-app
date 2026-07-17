import React, { useState, useEffect } from "react";
import { Section } from "./SettingsHelpers";
import { Laptop, Smartphone, Check, Sparkles } from "lucide-react";

export function AppStatusSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showManualInstallGuide, setShowManualInstallGuide] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handleInstallAvailable = () => {
      setDeferredPrompt((window as any).deferredPrompt);
    };

    window.addEventListener("pwa-install-available", handleInstallAvailable);
    
    const handleBeforePrompt = (e: Event) => {
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforePrompt);

    return () => {
      window.removeEventListener("pwa-install-available", handleInstallAvailable);
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install outcome: ${outcome}`);
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      }
    } else {
      setShowManualInstallGuide((prev) => !prev);
    }
  };

  return (
    <>
      {/* Native App & Offline Status */}
      <Section title="Native App & Offline Status">
        <div className="flex flex-col gap-4">
          <div
            className="p-3.5 rounded-xl space-y-3 text-xs"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>App Environment:</span>
              <span className="font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                {isStandalone ? (
                  <>
                    <Laptop size={14} className="text-[var(--income-positive)]" />
                    Standalone Native PWA
                  </>
                ) : (
                  <>
                    <Smartphone size={14} className="text-[var(--accent-primary)]" />
                    Standard Web Browser
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Offline Engine:</span>
              <span className="font-mono font-bold flex items-center gap-1 text-[var(--income-positive)]">
                <Check size={12} /> Active (IndexedDB)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>PWA Capabilities:</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Full offline-first, cached
              </span>
            </div>
          </div>

          {/* Installation trigger */}
          {!isStandalone && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full text-xs py-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl font-bold transition-all text-white hover:scale-[1.01]"
                style={{
                  background: "var(--accent-primary)",
                  boxShadow: "var(--shadow-hard-sm)",
                }}
              >
                <Sparkles size={14} className={deferredPrompt ? "animate-pulse" : ""} />
                Install BirrTu PWA Application
              </button>

              {/* iOS / General Browser Help if not installable and not standalone */}
              {(!deferredPrompt || showManualInstallGuide) && (
                <div
                  className="p-3.5 rounded-xl text-xs leading-relaxed space-y-3 border transition-all duration-300"
                  style={{
                    background: "rgba(45, 140, 255, 0.05)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <p className="font-semibold flex items-center gap-1.5 text-[var(--accent-primary)]">
                    <Smartphone size={14} /> How to Install BirrTu:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/40 space-y-1">
                      <div className="font-bold text-zinc-200">Apple iOS (Safari)</div>
                      <p style={{ color: "var(--text-secondary)" }} className="text-[11px] leading-normal">
                        Tap the <strong className="text-[var(--accent-primary)] font-bold">Share button</strong> at the bottom/top of Safari, scroll down, and select <strong className="text-zinc-200 font-bold">"Add to Home Screen"</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/40 space-y-1">
                      <div className="font-bold text-zinc-200">Google Chrome / Microsoft Edge</div>
                      <p style={{ color: "var(--text-secondary)" }} className="text-[11px] leading-normal">
                        Look for the <strong className="text-[var(--accent-primary)] font-bold">Install icon</strong> in the right side of your URL search bar, or open the browser menu (three dots) and choose <strong className="text-zinc-200 font-bold">"Install App"</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/40 space-y-1">
                      <div className="font-bold text-zinc-200">Mozilla Firefox / Other Browsers</div>
                      <p style={{ color: "var(--text-secondary)" }} className="text-[11px] leading-normal">
                        Tap the menu button (three dots) and select <strong className="text-zinc-200 font-bold">"Add to Home screen"</strong> or <strong className="text-zinc-200 font-bold">"Install"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isStandalone && (
            <div
              className="p-3 rounded-lg text-xs leading-relaxed flex items-center gap-2"
              style={{
                background: "rgba(47, 226, 138, 0.05)",
                border: "1px solid rgba(47, 226, 138, 0.15)",
                color: "var(--income-positive)",
              }}
            >
              <Check size={14} className="shrink-0" />
              <span className="font-medium">You are running the official standalone PWA application! Enjoy offline security and direct sandbox speed.</span>
            </div>
          )}
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="h-10 w-10 rounded-lg border-2 border-zinc-800 shadow-hard-sm" alt="BirrTu" />
          <div>
            <div className="text-sm font-semibold">BirrTu · v1.0</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Local-first ETB finance tracker
            </div>
          </div>
        </div>
        <p
          className="mt-3 text-xs leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Developed by{" "}
          <a
            href="https://birtucansoftware.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            BirtuCan Technologies
          </a>
          .
        </p>
      </Section>
    </>
  );
}
