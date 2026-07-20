import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { PinLockScreen } from "./PinLockScreen";

interface DeviceLockGuardProps {
  children: React.ReactNode;
  key?: React.Key;
}

export function DeviceLockGuard({ children }: DeviceLockGuardProps) {
  const { settings } = useSettings();
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!settings.deviceLock) {
      setIsUnlocked(true);
      return;
    }
    setIsUnlocked(false);
  }, [settings.deviceLock]);

  useEffect(() => {
    if (!settings.deviceLock) return;
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
  }, [settings.deviceLock]);

  if (settings.deviceLock && !isUnlocked) {
    return (
      <PinLockScreen
        onSuccess={() => setIsUnlocked(true)}
      />
    );
  }

  return <>{children}</>;
}
