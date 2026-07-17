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

  // If device lock is disabled, keep unlocked state
  useEffect(() => {
    if (!settings.deviceLock) {
      setIsUnlocked(true);
    } else {
      // If lock was enabled and we didn't unlock yet, ensure we show lock screen
      // (This applies when settings are loaded/restored and device lock becomes enabled)
    }
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
