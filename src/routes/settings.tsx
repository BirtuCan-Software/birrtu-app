import React from "react";
import { WorkspacesSection } from "@/components/maal/settings/WorkspacesSection";
import { AccountSection } from "@/components/maal/settings/AccountSection";
import { AppearanceSection } from "@/components/maal/settings/AppearanceSection";
import { SyncSecuritySection } from "@/components/maal/settings/SyncSecuritySection";
import { BackupRestoreSection } from "@/components/maal/settings/BackupRestoreSection";
import { AppStatusSection } from "@/components/maal/settings/AppStatusSection";

export default function SettingsPage() {
  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Settings
      </h1>

      {/* Workspace Switching & Management */}
      <WorkspacesSection />

      {/* Account Credentials Settings */}
      <AccountSection />
      
      {/* Visual Presets & Aesthetics */}
      <AppearanceSection />

      {/* Sync & security */}
      <SyncSecuritySection />

      {/* PDF Backup & Restore */}
      <BackupRestoreSection />

      {/* Native App Status & About */}
      <AppStatusSection />
    </div>
  );
}
