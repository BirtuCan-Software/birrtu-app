import React, { Suspense, lazy, useState, useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { useAccount } from "@/lib/accounts";
import { hasLocalDeviceLock } from "@/lib/device-lock";

const PinLockScreen = lazy(() =>
  import("./PinLockScreen").then((module) => ({ default: module.PinLockScreen })),
);

interface DeviceLockGuardProps {
  children: React.ReactNode;
  key?: React.Key;
}

export function DeviceLockGuard({ children }: DeviceLockGuardProps) {
  const { settings, update } = useSettings();
  const { activeAccountId } = useAccount();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const shouldLock = settings.deviceLock && hasLocalDeviceLock(activeAccountId);

  useEffect(() => {
    if (!shouldLock) {
      setIsUnlocked(true);
      if (settings.deviceLock) {
        update({ deviceLock: false, updatedAt: settings.updatedAt });
      }
      return;
    }
    setIsUnlocked(false);
  }, [settings.deviceLock, shouldLock]);

  useEffect(() => {
    if (!shouldLock) return;
    const lock = () => setIsUnlocked(false);
    const onVisibility = () => {
      if (document.hidden) lock();
    };
    window.addEventListener("blur", lock);
    window.addEventListener("pagehide", lock);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", lock);
      window.removeEventListener("pagehide", lock);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shouldLock]);

  if (shouldLock && !isUnlocked) {
    return (
      <Suspense fallback={<div className="h-dvh bg-[var(--bg-base)]" />}>
        <PinLockScreen
          onSuccess={() => setIsUnlocked(true)}
        />
      </Suspense>
    );
  }

  return <>{children}</>;
}
