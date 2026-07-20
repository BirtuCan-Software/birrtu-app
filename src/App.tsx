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

function getScrollableParent(el: EventTarget | null): HTMLElement | null {
  let node = el instanceof HTMLElement ? el : null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

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
    let startY = 0;
    let canRefresh = false;
    let pulled = false;

    const onTouchStart = (e: TouchEvent) => {
      const scroller = getScrollableParent(e.target) || mainRef.current;
      startY = e.touches[0]?.clientY || 0;
      canRefresh = startY <= 90 && (!scroller || scroller.scrollTop <= 0);
      pulled = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!canRefresh) return;
      const deltaY = (e.touches[0]?.clientY || 0) - startY;
      if (deltaY > 100) pulled = true;
    };

    const onTouchEnd = () => {
      if (pulled) window.location.reload();
      canRefresh = false;
      pulled = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
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
