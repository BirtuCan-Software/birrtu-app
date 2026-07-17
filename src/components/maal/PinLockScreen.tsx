import React, { useState, useEffect } from "react";
import { useAccount } from "@/lib/accounts";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Delete, LogOut, ShieldAlert, Fingerprint, Key, ExternalLink, ShieldCheck } from "lucide-react";
import { authenticateLocalPasskey } from "@/lib/passkey";

interface PinLockScreenProps {
  onSuccess: () => void;
  isSettingPin?: boolean;
  onSetPinSuccess?: (pin: string) => void;
  onCancelSet?: () => void;
  titleOverride?: string;
  subtitleOverride?: string;
}

export function PinLockScreen({
  onSuccess,
  isSettingPin = false,
  onSetPinSuccess,
  onCancelSet,
  titleOverride,
  subtitleOverride,
}: PinLockScreenProps) {
  const { activeAccountId, logout, accounts } = useAccount();
  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">(isSettingPin ? "enter" : "enter");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  // Passkey integration states
  const savedPinKey = `maal-device-pin-v1-${activeAccountId}`;
  const savedPasskeyIdKey = `maal-device-passkey-id-v1-${activeAccountId}`;
  const lockTypeKey = `maal-device-lock-type-v1-${activeAccountId}`;

  const [lockType, setLockType] = useState<"pin" | "passkey">("pin");
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [isIframeRestricted, setIsIframeRestricted] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load lock type on mount
  useEffect(() => {
    if (!isSettingPin) {
      const storedType = localStorage.getItem(lockTypeKey) as "pin" | "passkey";
      if (storedType === "passkey") {
        setLockType("passkey");
        setShowPinFallback(false);
      } else {
        setLockType("pin");
        setShowPinFallback(true);
      }
    } else {
      setLockType("pin");
      setShowPinFallback(true);
    }
    setPin("");
    setConfirmPin("");
    setStep("enter");
    setError("");
    setPasskeyError("");
  }, [isSettingPin, activeAccountId]);

  // Passkey verification logic
  const triggerPasskeyUnlock = async () => {
    setPasskeyError("");
    setIsIframeRestricted(false);
    setIsAuthenticating(true);
    try {
      const credentialId = localStorage.getItem(savedPasskeyIdKey);
      if (!credentialId) {
        throw new Error("No passkey is registered for this account.");
      }
      
      const success = await authenticateLocalPasskey(credentialId);
      if (success) {
        onSuccess();
      } else {
        throw new Error("Passkey validation failed.");
      }
    } catch (err: any) {
      console.error("Passkey error:", err);
      const msg = err?.message || String(err);
      
      // Check for security/iframe restrictions
      if (
        err?.name === "SecurityError" || 
        msg.includes("SecurityError") || 
        msg.includes("not allowed in this document context") ||
        msg.includes("iframe") ||
        msg.includes("sandbox")
      ) {
        setIsIframeRestricted(true);
        setShowPinFallback(true);
      } else if (err?.name === "NotAllowedError") {
        setPasskeyError("Passkey verification was cancelled.");
      } else {
        setPasskeyError(msg || "Failed to authenticate with device Passkey.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auto-trigger passkey lock prompt on mount if applicable
  useEffect(() => {
    if (!isSettingPin && lockType === "passkey" && !showPinFallback) {
      const t = setTimeout(() => {
        triggerPasskeyUnlock();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isSettingPin, lockType, showPinFallback]);

  const handleKeyPress = (num: string) => {
    setError("");
    if (step === "enter") {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          if (isSettingPin) {
            setTimeout(() => {
              setStep("confirm");
            }, 200);
          } else {
            // Verify pin (could be active lock pin or fallback pin)
            const storedPin = localStorage.getItem(savedPinKey);
            if (nextPin === storedPin) {
              onSuccess();
            } else {
              setTimeout(() => {
                setError("Incorrect PIN. Please try again.");
                setShake(true);
                setPin("");
                setTimeout(() => setShake(false), 500);
              }, 200);
            }
          }
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + num;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (pin === nextConfirm) {
            localStorage.setItem(savedPinKey, pin);
            if (onSetPinSuccess) {
              onSetPinSuccess(pin);
            }
          } else {
            setTimeout(() => {
              setError("PINs do not match. Restarting...");
              setShake(true);
              setPin("");
              setConfirmPin("");
              setStep("enter");
              setTimeout(() => setShake(false), 500);
            }, 200);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setError("");
    if (step === "enter") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const activeInputLength = step === "enter" ? pin.length : confirmPin.length;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-[var(--bg-surface)] border-2 border-[var(--border-strong)] rounded-[16px] p-6 shadow-hard-lg flex flex-col gap-6 items-center"
      >
        {/* Passkey UI Mode */}
        {lockType === "passkey" && !showPinFallback ? (
          <div className="flex flex-col items-center gap-6 text-center w-full">
            {/* Header Icon */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`relative flex h-16 w-16 items-center justify-center rounded-[12px] border-2 border-[var(--border-strong)] shadow-hard-sm bg-[var(--bg-surface-sunken)] text-[var(--accent-primary)]`}
              >
                <Fingerprint className="h-8 w-8 animate-pulse text-[var(--accent-primary)]" />
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border border-white dark:border-zinc-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <h1
                className="text-xl font-black tracking-tight text-[var(--text-primary)] mt-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {titleOverride || "Device Passkey"}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] px-2">
                {subtitleOverride || `BirrTu is secured. Use your biometric lock or system passcode to access your account (${activeAccount?.name || "Active Account"}).`}
              </p>
            </div>

            {/* Main Passkey action */}
            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={triggerPasskeyUnlock}
                disabled={isAuthenticating}
                className="w-full py-3.5 px-4 rounded-[10px] border-2 border-[var(--border-strong)] bg-[var(--accent-primary)] text-[var(--accent-primary-fg)] font-black shadow-hard-md hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="h-5 w-5" />
                {isAuthenticating ? "Verifying..." : "Unlock with Passkey"}
              </button>

              <button
                type="button"
                onClick={() => setShowPinFallback(true)}
                className="text-xs font-semibold underline underline-offset-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer py-1"
              >
                Use 4-digit Backup PIN
              </button>
            </div>

            {/* Error handling */}
            {passkeyError && (
              <p className="text-xs text-red-500 font-semibold px-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20 w-full">
                {passkeyError}
              </p>
            )}

            {/* Footer Sign-out */}
            <div className="w-full border-t border-[var(--border-subtle)] pt-4 mt-2">
              <button
                type="button"
                onClick={logout}
                className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign out of account
              </button>
            </div>
          </div>
        ) : (
          /* Custom 4-digit PIN UI Mode (Includes backup/fallback PIN mode) */
          <>
            {/* Header Icon */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-[10px] border-2 border-[var(--border-strong)] shadow-hard-sm transition-all duration-300 ${
                  error
                    ? "bg-red-500 text-white"
                    : isSettingPin
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]"
                    : "bg-[var(--bg-surface-sunken)] text-[var(--text-primary)]"
                }`}
              >
                {isSettingPin ? <ShieldAlert className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </div>
              <h1
                className="text-xl font-black tracking-tight text-[var(--text-primary)] mt-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isSettingPin
                  ? step === "enter"
                    ? "Set Security PIN"
                    : "Confirm Security PIN"
                  : lockType === "passkey"
                  ? "Enter Backup PIN"
                  : "Device Locked"}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] px-2">
                {isSettingPin
                  ? step === "enter"
                    ? "Choose a secure 4-digit passcode"
                    : "Re-enter passcode to confirm"
                  : lockType === "passkey"
                  ? "Enter the 4-digit backup PIN you created"
                  : "Please enter your 4-digit security PIN to proceed"}
              </p>
            </div>

            {/* Iframe Restriction Alert inside PIN fallback */}
            {isIframeRestricted && (
              <div className="text-[11px] leading-relaxed text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg flex flex-col gap-1 w-full text-center">
                <p className="font-semibold">Iframe Security Active</p>
                <p>
                  Browser sandbox restricts biometric/passkey requests inside this frame.
                </p>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-1 font-bold underline hover:opacity-80"
                >
                  Open standalone tab <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* PIN Indicators */}
            <motion.div
              animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="flex gap-4 justify-center py-2"
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < activeInputLength;
                return (
                  <div
                    key={index}
                    className={`h-4.5 w-4.5 rounded-full border-2 border-[var(--border-strong)] transition-all duration-200 ${
                      isFilled
                        ? "bg-[var(--accent-primary)] scale-110 shadow-hard-xs"
                        : "bg-[var(--bg-surface-sunken)]"
                    }`}
                  />
                );
              })}
            </motion.div>

            {/* Error Feedback */}
            <div className="h-4 text-center">
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs font-bold text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Keypad Layout */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="flex h-14 items-center justify-center rounded-[10px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] text-lg font-black shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:brightness-105 transition-all cursor-pointer"
                  style={{ fontFamily: "var(--font-numeric)" }}
                >
                  {num}
                </button>
              ))}

              {/* Action Left (Cancel/Exit or back to Passkey) */}
              <button
                type="button"
                onClick={() => {
                  if (onCancelSet) {
                    onCancelSet();
                  } else if (lockType === "passkey" && !isIframeRestricted) {
                    setShowPinFallback(false);
                  } else {
                    logout();
                  }
                }}
                className="flex h-14 items-center justify-center rounded-[10px] border-2 border-transparent text-xs font-bold text-[var(--text-secondary)] hover:text-red-400 active:scale-95 transition-all cursor-pointer text-center"
              >
                {onCancelSet ? (
                  "Cancel"
                ) : lockType === "passkey" && !isIframeRestricted ? (
                  "Back"
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </button>

              {/* Zero Button */}
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="flex h-14 items-center justify-center rounded-[10px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] text-lg font-black shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:brightness-105 transition-all cursor-pointer"
                style={{ fontFamily: "var(--font-numeric)" }}
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={activeInputLength === 0}
                className="flex h-14 items-center justify-center rounded-[10px] border-2 border-[var(--border-strong)] bg-[var(--bg-surface-sunken)] text-lg font-black shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all cursor-pointer text-[var(--text-secondary)]"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
