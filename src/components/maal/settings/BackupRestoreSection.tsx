import React from "react";
import { useSettings } from "@/lib/settings";
import { useTx } from "@/lib/tx-store";
import { useAccount } from "@/lib/accounts";
import { jsPDF } from "jspdf";
import { formatETB, formatDateTime } from "@/lib/format";
import { Section } from "./SettingsHelpers";
import { Download, Upload } from "lucide-react";

export function BackupRestoreSection() {
  const { settings } = useSettings();
  const {
    netBalance,
    transactions,
    wallets,
    balances,
    restoreBackup,
  } = useTx();
  
  const {
    accounts,
    activeAccountId,
  } = useAccount();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Page 1 header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text("BirrTu Financial Account", 14, 20);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(`Generated on: ${formatDateTime(new Date(), settings.timeFormat)}`, 14, 26);
      doc.text(`Net Worth: ${formatETB(netBalance)} ETB`, 14, 31);
      
      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 35, 196, 35);
      
      // Wallets summary
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text("Active Wallets", 14, 43);
      
      let walletY = 50;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      wallets.forEach((w) => {
        const balance = balances[w.id] || 0;
        doc.text(`• ${w.name} (${w.type.toUpperCase()}) ${w.accountNumber ? `#${w.accountNumber}` : ""}: ${formatETB(balance)} ETB`, 14, walletY);
        walletY += 6;
      });
      
      // Transactions title
      const tableStartY = walletY + 8;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text("Transaction History", 14, tableStartY);
      
      // Table Header
      let y = tableStartY + 6;
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 4, 182, 6, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("Date", 16, y);
      doc.text("Description", 45, y);
      doc.text("Wallet", 105, y);
      doc.text("Type", 145, y);
      doc.text("Amount (ETB)", 194, y, { align: "right" });
      
      y += 8;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      
      transactions.forEach((t) => {
        // Page break logic
        if (y > 270) {
          doc.addPage();
          y = 20;
          
          // Reprint table header on new page
          doc.setFillColor(240, 240, 240);
          doc.rect(14, y - 4, 182, 6, "F");
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.text("Date", 16, y);
          doc.text("Description", 45, y);
          doc.text("Wallet", 105, y);
          doc.text("Type", 145, y);
          doc.text("Amount (ETB)", 194, y, { align: "right" });
          
          y += 8;
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
        }
        
        const dateStr = new Date(t.timestamp).toLocaleDateString();
        const trimmedDesc = t.description.length > 32 ? t.description.substring(0, 30) + "..." : t.description;
        
        let walletStr = "";
        const wSrc = wallets.find((w) => w.id === t.account);
        const wSrcName = wSrc ? wSrc.name : t.account;
        if (t.type === "transfer" && t.toAccount) {
          const wDst = wallets.find((w) => w.id === t.toAccount);
          const wDstName = wDst ? wDst.name : t.toAccount;
          walletStr = `${wSrcName} -> ${wDstName}`;
        } else {
          walletStr = wSrcName;
        }
        
        const typeStr = t.type.toUpperCase();
        const amountStr = `${t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        doc.text(dateStr, 16, y);
        doc.text(trimmedDesc, 45, y);
        doc.text(walletStr, 105, y);
        doc.text(typeStr, 145, y);
        doc.text(amountStr, 194, y, { align: "right" });
        
        // Separator
        doc.setDrawColor(245, 245, 245);
        doc.line(14, y + 2, 196, y + 2);
        
        y += 7;
      });
      
      // Page numbers & Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("BirrTu Workspace Backup · Developed by BirtuCan Technologies", 14, 288);
        doc.text(`Page ${i} of ${totalPages}`, 196, 288, { align: "right" });
      }
      
      const pdfString = doc.output();
      const backupData = {
        version: "1.0",
        app: "birrtu",
        exportedAt: new Date().toISOString(),
        transactions,
        wallets
      };
      
      const finalPdfContent = pdfString + "\n%BIRRTU_BACKUP_DATA:" + JSON.stringify(backupData);
      const blob = new Blob([finalPdfContent], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `birrtu_workspace_backup_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF backup: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const marker = text.includes("%BIRRTU_BACKUP_DATA:") ? "%BIRRTU_BACKUP_DATA:" : "%MAAL_BACKUP_DATA:";
      const index = text.indexOf(marker);
      if (index === -1) {
        alert("Invalid backup file. This PDF does not contain BirrTu backup data.");
        return;
      }
      const jsonStr = text.substring(index + marker.length).trim();
      try {
        const data = JSON.parse(jsonStr);
        if ((data.app !== "birrtu" && data.app !== "maal") || !Array.isArray(data.transactions)) {
          alert("Invalid backup data format.");
          return;
        }
        if (
          confirm(
            `Found ${data.transactions.length} transactions and ${data.wallets?.length || 0} wallets. This will replace your current device data. Proceed?`
          )
        ) {
          await restoreBackup(data.transactions, data.wallets);
          alert("Backup successfully restored!");
        }
      } catch (err) {
        alert("Failed to parse backup data. The file might be corrupted.");
      }
    };
    reader.readAsText(file, "latin1");
  };

  return (
    <Section title="Local PDF Backup & Restore">
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Export your transactions and wallets as a beautifully formatted PDF backup.<br />
        Import the PDF file at any time to fully restore your financial history.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={handleExportPDF}
          className="btn-primary flex items-center justify-center gap-2 py-3 px-4 text-sm cursor-pointer w-full text-center font-bold"
        >
          <Download size={16} /> Export Backup PDF
        </button>

        <label className="btn-secondary flex items-center justify-center gap-2 py-3 px-4 text-sm cursor-pointer border border-dashed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors w-full text-center justify-center font-bold">
          <Upload size={16} /> Import Backup PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={handleImportPDF}
            className="hidden"
          />
        </label>
      </div>
    </Section>
  );
}
