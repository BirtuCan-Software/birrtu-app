import React, { useMemo, useState } from "react";
import { useSettings } from "@/lib/settings";
import { useTx } from "@/lib/tx-store";
import { useAccount } from "@/lib/accounts";
import { clearAndImportTransactions, type Transaction, type Wallet } from "@/lib/db";
import { jsPDF } from "jspdf";
import { formatETB, formatDateTime } from "@/lib/format";
import { Section } from "./SettingsHelpers";
import { Download, Upload } from "lucide-react";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BackupRestoreSection() {
  const today = toDateInputValue(new Date());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const { settings } = useSettings();
  const { netBalance, transactions, wallets, balances } = useTx();
  const { accounts, activeAccountId, user, importAccount, switchAccount } = useAccount();

  const activeWorkspace = accounts.find((account) => account.id === activeAccountId);
  const visibleWallets = wallets.filter((wallet) => !wallet.deleted);

  const filteredTransactions = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : -Infinity;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Infinity;

    return transactions.filter((tx) => {
      const time = new Date(tx.timestamp).getTime();
      return time >= start && time <= end;
    });
  }, [endDate, startDate, transactions]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, tx) => {
        if (tx.type === "income") sum.inflow += tx.amount;
        if (tx.type === "expense") sum.outflow += tx.amount;
        return sum;
      },
      { inflow: 0, outflow: 0 },
    );
  }, [filteredTransactions]);

  const addWrappedText = (
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const lines = doc.splitTextToSize(text || "-", maxWidth);
    doc.text(lines, x, y);
    return y + Math.max(lines.length, 1) * lineHeight;
  };

  const drawTransactionHeader = (doc: jsPDF, y: number) => {
    doc.setFillColor(246, 247, 249);
    doc.roundedRect(14, y - 5, 182, 8, 1.5, 1.5, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(74, 85, 104);
    doc.text("Date", 17, y);
    doc.text("Description", 43, y);
    doc.text("Wallet", 95, y);
    doc.text("Type", 138, y);
    doc.text("Amount", 193, y, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(58, 64, 75);
    return y + 9;
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      const generatedAt = new Date();
      const dateRangeLabel = `${startDate || "All time"} to ${endDate || "All time"}`;
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(20, 24, 31);
      doc.text("BirrTu Workspace Export", 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(101, 111, 125);
      doc.text(activeWorkspace?.name || "Current Workspace", 14, 27);
      doc.text(`Generated ${formatDateTime(generatedAt, settings.timeFormat)}`, 14, 33);

      doc.setFillColor(20, 24, 31);
      doc.roundedRect(14, 42, 182, 28, 3, 3, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(188, 196, 208);
      doc.text("TOTAL BALANCE", 20, 53);
      doc.text("TOTAL INFLOW", 76, 53);
      doc.text("TOTAL OUTFLOW", 132, 53);

      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(`${formatETB(netBalance)} ETB`, 20, 62);
      doc.text(`${formatETB(totals.inflow)} ETB`, 76, 62);
      doc.text(`${formatETB(totals.outflow)} ETB`, 132, 62);

      doc.setFillColor(255, 247, 237);
      doc.roundedRect(14, 76, 182, 18, 3, 3, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(124, 45, 18);
      doc.text("Summary", 20, 85);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(99, 61, 40);
      doc.text(`Date range: ${dateRangeLabel}`, 55, 85);
      doc.text(`Transactions: ${filteredTransactions.length}`, 145, 85);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text("Wallet Overview", 14, 106);

      let walletY = 114;
      doc.setFillColor(246, 247, 249);
      doc.roundedRect(14, walletY - 5, 182, 8, 1.5, 1.5, "F");
      doc.setFontSize(8);
      doc.setTextColor(74, 85, 104);
      doc.text("Wallet", 17, walletY);
      doc.text("Type", 82, walletY);
      doc.text("Account", 118, walletY);
      doc.text("Balance", 193, walletY, { align: "right" });
      walletY += 9;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(58, 64, 75);

      visibleWallets.forEach((w) => {
        const balance = balances[w.id] || 0;
        doc.text(w.name, 17, walletY);
        doc.text(w.type.toUpperCase(), 82, walletY);
        doc.text(w.accountNumber || "-", 118, walletY);
        doc.text(`${formatETB(balance)} ETB`, 193, walletY, { align: "right" });
        doc.setDrawColor(235, 238, 242);
        doc.line(14, walletY + 3, 196, walletY + 3);
        walletY += 8;
      });

      const tableStartY = walletY + 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text("Transactions", 14, tableStartY);

      let y = drawTransactionHeader(doc, tableStartY + 8);

      filteredTransactions.forEach((t) => {
        if (y > 270) {
          doc.addPage();
          y = drawTransactionHeader(doc, 20);
        }

        const dateStr = new Date(t.timestamp).toLocaleDateString();
        const wSrc = wallets.find((w) => w.id === t.account);
        const wSrcName = wSrc ? wSrc.name : t.account;
        let walletStr = wSrcName;
        if (t.type === "transfer" && t.toAccount) {
          const wDst = wallets.find((w) => w.id === t.toAccount);
          const wDstName = wDst ? wDst.name : t.toAccount;
          walletStr = `${wSrcName} -> ${wDstName}`;
        }

        const typeStr = t.type.toUpperCase();
        const amountStr = `${t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(58, 64, 75);
        doc.text(dateStr, 17, y);
        const nextY = addWrappedText(doc, t.description, 43, y, 45, 4);
        doc.text(doc.splitTextToSize(walletStr, 35), 95, y);
        doc.text(typeStr, 138, y);
        doc.text(amountStr, 193, y, { align: "right" });

        y = Math.max(nextY, y + 8);
        doc.setDrawColor(235, 238, 242);
        doc.line(14, y - 2, 196, y - 2);
      });

      if (filteredTransactions.length === 0) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(101, 111, 125);
        doc.text("No transactions found for this date range.", 17, y);
      }
      
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("BirrTu Workspace Export · Developed by BirtuCan Technologies", 14, 288);
        doc.text(`Page ${i} of ${totalPages}`, 196, 288, { align: "right" });
      }
      
      const pdfString = doc.output();
      const workspaceData = {
        version: "2.0",
        app: "birrtu",
        kind: "workspace_export",
        exportedAt: new Date().toISOString(),
        workspace: activeWorkspace,
        user: user ? { id: user.id, username: user.username, email: user.email, isGuest: user.isGuest } : null,
        settings,
        transactions,
        wallets,
      };
      
      const finalPdfContent = pdfString + "\n%BIRRTU_WORKSPACE_DATA:" + JSON.stringify(workspaceData);
      const blob = new Blob([finalPdfContent], { type: "application/pdf" });
      const fileName = `birrtu_workspace_export_${new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "BirrTu Workspace Export",
          text: "BirrTu workspace export PDF",
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating PDF export: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportPDF = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const text = String(readerEvent.target?.result || "");
        const marker = "%BIRRTU_WORKSPACE_DATA:";
        const index = text.indexOf(marker);
        if (index === -1) {
          alert("This PDF does not contain a BirrTu workspace export.");
          return;
        }

        const data = JSON.parse(text.substring(index + marker.length).trim());
        if (
          data.app !== "birrtu" ||
          data.kind !== "workspace_export" ||
          !Array.isArray(data.transactions) ||
          !Array.isArray(data.wallets)
        ) {
          alert("Invalid BirrTu workspace export.");
          return;
        }

        const workspaceName = data.workspace?.name
          ? `${data.workspace.name} (Imported)`
          : "Imported Workspace";
        const result = importAccount(workspaceName);
        if (!result.success || !result.account) {
          alert(result.error || "Could not create imported workspace.");
          return;
        }

        localStorage.setItem(`maal-wallets-v1-${result.account.id}`, JSON.stringify(data.wallets as Wallet[]));
        if (data.settings && typeof data.settings === "object") {
          localStorage.setItem(`maal-settings-v1-${result.account.id}`, JSON.stringify(data.settings));
        }
        await clearAndImportTransactions(result.account.id, data.transactions as Transaction[]);
        switchAccount(result.account.id);
        alert("Workspace imported.");
      } catch (err) {
        console.error(err);
        alert("Failed to import workspace PDF.");
      }
    };
    reader.readAsText(file, "latin1");
  };

  return (
    <Section title="Export & Import Workspace">
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Export or import a shareable workspace PDF with wallet balances, transactions, and a date-range summary.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
            Start date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-[10px] border px-3 py-2 text-sm font-semibold"
              style={{
                background: "var(--bg-surface-sunken)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
            End date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-[10px] border px-3 py-2 text-sm font-semibold"
              style={{
                background: "var(--bg-surface-sunken)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          className="btn-primary flex items-center justify-center gap-2 py-3 px-4 text-sm cursor-pointer w-full text-center font-bold"
        >
          <Download size={16} /> Export to PDF
        </button>

        <label className="btn-secondary flex items-center justify-center gap-2 py-3 px-4 text-sm cursor-pointer border border-dashed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors w-full text-center font-bold">
          <Upload size={16} /> Import Shared PDF
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
