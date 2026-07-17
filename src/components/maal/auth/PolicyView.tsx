import React from "react";
import { motion } from "motion/react";

interface PolicyViewProps {
  view: "privacy" | "terms";
  onBack: () => void;
  landingTheme?: "dark" | "light";
}

export function PolicyView({ view, onBack, landingTheme = "dark" }: PolicyViewProps) {
  const isPrivacy = view === "privacy";
  const isLight = landingTheme === "light";

  const headingClass = `text-sm font-bold mb-1 transition-colors duration-300 ${isLight ? "text-zinc-800" : "text-white"}`;

  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-2xl px-4 py-8 text-left"
    >
      <div className={`border-2 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 transition-colors duration-300 ${
        isLight ? "bg-white border-zinc-200/80 shadow-md text-zinc-800" : "bg-zinc-950 border-zinc-800 text-zinc-100"
      }`}>
        <div className={`flex justify-between items-center border-b pb-4 transition-colors duration-300 ${isLight ? "border-zinc-100" : "border-zinc-800"}`}>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight transition-colors duration-300 ${isLight ? "text-zinc-800" : "text-white"}`} style={{ fontFamily: "var(--font-display)" }}>
              {isPrivacy ? "Privacy Policy" : "Terms of Use"}
            </h2>
            <p className={`text-[10px] font-mono mt-1 uppercase tracking-wider transition-colors duration-300 ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>
              {isPrivacy ? "Effective Date: July 13, 2026 · Version 1.0" : "Last Updated: July 13, 2026 · Version 1.0"}
            </p>
          </div>
          <button 
            onClick={onBack}
            className={`text-xs px-3 py-1.5 border rounded-lg transition-all cursor-pointer font-bold ${
              isLight 
                ? "border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/85 hover:border-zinc-300" 
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700"
            }`}
          >
            Back
          </button>
        </div>

        <div className={`text-xs space-y-4 leading-relaxed font-sans max-h-[450px] overflow-y-auto pr-2 custom-scrollbar transition-colors duration-300 ${isLight ? "text-zinc-600" : "text-zinc-300"}`}>
          {isPrivacy ? (
            <>
              <div>
                <h4 className={headingClass}>1. Local-First Architectural Mandate</h4>
                <p>
                  At BirtuCan Technologies, we hold a fundamental belief that your financial life belongs to you alone. BirrTu is designed with a strict local-first paradigm. Unlike traditional cloud-hosted database systems, BirrTu does not utilize centralized cloud databases to transmit, capture, catalog, or index your transaction logs, wallet balances, or account metadata.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>2. Local Storage and Data Persistence</h4>
                <p>
                  All database state—including custom workspace definitions, transaction categories, logged records, active wallets, and credential settings—is strictly persisted directly on your physical client device. This data is handled through standard Web Storage interfaces, specifically IndexedDB and localStorage:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1">
                  <li><strong>IndexedDB:</strong> Standard sandboxed database API in your browser, keeping your local workspaces isolated from unauthorized cross-origin requests.</li>
                  <li><strong>Local Security Storage:</strong> Cryptographic PIN identifiers are stored locally and are completely inaccessible to BirtuCan Technologies.</li>
                </ul>
              </div>

              <div>
                <h4 className={headingClass}>3. Optional Google Drive Cloud Synchronization</h4>
                <p>
                  If you explicitly connect your Google Account and enable "Auto-Sync" or trigger "Sync Now", the application will synchronize your encrypted transactional data and active wallets to a private, isolated storage space inside your own personal Google Drive account.
                </p>
                <p className="mt-1">
                  We request narrow, user-approved access restricted exclusively to files created by the BirrTu app (`drive.file` scope). BirtuCan Technologies does not run or host a server-side storage database; your cloud backup belongs fully to you and is transmitted directly from your client browser to your private Google Drive space.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>4. Non-Collection of Personal Financial Records</h4>
                <p>
                  We do not collect, intercept, inspect, profile, or sell your financial data. Outside of user-initiated Google Drive synchronization, no records you log within the application (including bank ledgers, mobile wallets, or custom categories) ever leave your device. All manual data parsing, transaction matching, and chart rendering are performed client-side on your device's processor.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>5. Zero-Telemetry & Analytics Exclusions</h4>
                <p>
                  BirrTu contains zero tracking SDKs, telemetry monitors, or web beacons. We do not register screen transitions, interaction frequency, dashboard parameters, or layout configurations. The interface does not require active connection to the internet to function once loaded, and operates fully offline.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>6. Passkey & Biometric Credentials Security</h4>
                <p>
                  If you configure a Passkey (biometric lock or system-level passcode authentication via Face ID or Touch ID) to secure your BirrTu workspaces:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1">
                  <li>The authentication relies entirely on standard WebAuthn APIs.</li>
                  <li>Our client script never receives or captures your raw biometric data.</li>
                  <li>The biometric verification occurs securely inside your operating system's hardware sandbox. Only a success signature is shared back to verify the session.</li>
                </ul>
              </div>

              <div>
                <h4 className={headingClass}>7. User-Initiated Data Portability</h4>
                <p>
                  You are in absolute control of your data porting. When you trigger a PDF ledger export, the application compiles the text and inserts an encrypted metadata marker at the footer of the physical file. Any future import of this file is decoded entirely in memory inside your browser. No files are uploaded to our development servers during import/export.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>8. Contact & Support</h4>
                <p>
                  If you have questions about the sandbox boundaries or standard device compliance, contact our privacy compliance team directly at support@birtucansoftware.com.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className={headingClass}>1. Acceptance of Terms</h4>
                <p>
                  By accessing or utilizing the BirrTu local-first web application (the "Service") operated by BirtuCan Technologies ("us", "we", or "our"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any portion of these Terms, you must immediately cease accessing the service and delete your local database instances via browser settings.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>2. Local Service Boundaries & Device Responsibility</h4>
                <p>
                  BirrTu is an offline-first financial calculator and transactional cataloging tool. You acknowledge and accept that:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1">
                  <li>Unless you explicitly connect a personal Google Account and enable Google Drive "Auto-Sync", we do not back up your data on any cloud servers. Your primary records reside solely in your browser's IndexedDB partition.</li>
                  <li>Clearing browser cache, executing hard resets, or using automatic disk space sweepers may delete your local data permanently if not synchronized.</li>
                  <li>You are solely responsible for executing periodic exports to PDF or enabling the Google Drive sync to prevent accidental data loss.</li>
                </ul>
              </div>

              <div>
                <h4 className={headingClass}>3. Credential Recovery & Non-Access</h4>
                <p>
                  Because we have no backend database storing your credentials, PIN codes, or custom cryptographic keys:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1">
                  <li>BirtuCan Technologies cannot reset, recover, or unlock your account if you forget your workspace password or 4-digit PIN lock.</li>
                  <li>Any locked device represents an irreversibly encrypted local database that can only be resolved by clearing application data and importing a previously exported PDF backup.</li>
                </ul>
              </div>

              <div>
                <h4 className={headingClass}>4. Prohibited Uses</h4>
                <p>
                  You agree not to exploit or tamper with the Service's client execution environment, reverse-engineer the underlying database key-derivation schema, or execute any automated script to inject high-velocity corrupt values into standard browser memory.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>5. Financial Disclaimer</h4>
                <p>
                  BirrTu is designed strictly for organizational and cataloging purposes. BirtuCan Technologies does not offer corporate tax counseling, official investment advisories, audit preparations, or regulated banking interfaces.
                </p>
                <p className="mt-1">
                  All calculations, rates, summaries, and interval logs are rendered "as-is" without warranty. Users should independently verify the calculations before taking business or investment steps based on the output.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>6. Limitation of Liability</h4>
                <p>
                  In no event shall BirtuCan Technologies, its directors, employees, or developers, be liable for any special, incidental, indirect, consequential, or punitive damages whatsoever—including but not limited to loss of capital, balance errors, data deletions, system corruptions, or device bricking arising from or connected with the use of the Service.
                </p>
              </div>

              <div>
                <h4 className={headingClass}>7. Modifications to Terms</h4>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time by updating this layout block inside the app. Your continued interaction with the application represents a complete, binding acceptance of the modified terms.
                </p>
              </div>
            </>
          )}
        </div>

        <div className={`border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isLight ? "border-zinc-100 text-zinc-400" : "border-zinc-800 text-zinc-500"}`}>
          <button 
            onClick={onBack}
            className="text-[#ff5a1f] hover:underline cursor-pointer order-first sm:order-last font-bold"
          >
            Back to Homepage
          </button>
          <span className="order-last sm:order-first">
            © 2026{" "}
            <a
              href="https://birtucansoftware.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${isLight ? "hover:text-zinc-600" : "hover:text-zinc-400"}`}
            >
              BirtuCan Technologies
            </a>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
