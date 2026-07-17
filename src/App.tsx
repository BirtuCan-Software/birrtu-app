import React, { useEffect, useRef } from "react";
import { RouterProvider, useNavigate, useRouterState } from "@/lib/router";
import { AccountProvider, useAccount } from "@/lib/accounts";
import { SettingsProvider } from "@/lib/settings";
import { TxProvider } from "@/lib/tx-store";
import { AppHeader } from "@/components/maal/AppHeader";
import { BottomNav } from "@/components/maal/BottomNav";
import { AccountSelectionScreen } from "@/components/maal/AccountSelectionScreen";
import { DeviceLockGuard } from "@/components/maal/DeviceLockGuard";
import { PolicyView } from "@/components/maal/auth/PolicyView";

// Import page components
import Home from "@/routes/index";
import AddTx from "@/routes/add";
import TxList from "@/routes/transactions";
import SettingsPage from "@/routes/settings";
import WalletsPage from "@/routes/wallets";

function AppContent() {
  const { location } = useRouterState();
  const path = location.pathname;
  const hideChrome = path === "/add";
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [path]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-install-available"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const renderPage = () => {
    switch (path) {
      case "/":
        return <Home />;
      case "/add":
        return <AddTx />;
      case "/transactions":
        return <TxList />;
      case "/settings":
        return <SettingsPage />;
      case "/wallets":
        return <WalletsPage />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[720px] flex-col overflow-hidden">
      {!hideChrome && <AppHeader />}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {renderPage()}
      </main>
      {!hideChrome && <BottomNav />}
    </div>
  );
}

function PolicyRoute() {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const view = location.pathname === "/privacy" ? "privacy" : "terms";

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[720px] flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <div className="flex min-h-full items-start justify-center">
          <PolicyView
            view={view}
            onBack={() => navigate({ to: "/" })}
          />
        </div>
      </main>
    </div>
  );
}

function AppWithAccount() {
  const { location } = useRouterState();
  const { activeAccountId } = useAccount();
  const path = location.pathname;

  if (path === "/privacy" || path === "/terms") {
    return <PolicyRoute />;
  }

  if (!activeAccountId) {
    return <AccountSelectionScreen />;
  }

  return (
    <SettingsProvider key={`settings-${activeAccountId}`}>
      <TxProvider key={`tx-${activeAccountId}`}>
        <DeviceLockGuard key={`lock-${activeAccountId}`}>
          <AppContent />
        </DeviceLockGuard>
      </TxProvider>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AccountProvider>
        <AppWithAccount />
      </AccountProvider>
    </RouterProvider>
  );
}
