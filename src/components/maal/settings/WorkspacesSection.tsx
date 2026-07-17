import React, { useState } from "react";
import { useAccount } from "@/lib/accounts";
import { Section } from "./SettingsHelpers";
import { Plus, Trash2, Edit2 } from "lucide-react";

export function WorkspacesSection() {
  const {
    accounts,
    activeAccountId,
    addAccount,
    renameAccount,
    deleteAccount,
    switchAccount,
  } = useAccount();

  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingAccName, setEditingAccName] = useState("");
  const [showAddAcc, setShowAddAcc] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [accError, setAccError] = useState("");

  return (
    <Section title="Workspaces">
      <div className="space-y-2 mb-4">
        {accounts.map((acc) => {
          const isActive = acc.id === activeAccountId;
          const isEditing = editingAccId === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => !isEditing && switchAccount(acc.id)}
              className="flex items-center justify-between rounded-[10px] p-3 transition-all cursor-pointer"
              style={{
                background: isActive ? "var(--bg-surface-sunken)" : "transparent",
                border: `2px solid ${isActive ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}
            >
              <div className="flex-1 pr-4">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editingAccName.trim()) {
                        renameAccount(acc.id, editingAccName.trim());
                        setEditingAccId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingAccName}
                      onChange={(e) => setEditingAccName(e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs text-white"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border-subtle)",
                      }}
                    />
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-xs font-bold"
                      style={{
                        background: "var(--accent-primary)",
                        color: "var(--bg-base)",
                      }}
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      {acc.name}
                      {isActive && (
                        <span
                          className="text-[9px] rounded-full px-1.5 py-0.5 font-bold"
                          style={{
                            background: "var(--accent-primary)",
                            color: "var(--bg-base)",
                          }}
                        >
                          Active Workspace
                        </span>
                      )}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      Created {new Date(acc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccId(acc.id);
                      setEditingAccName(acc.name);
                    }}
                    className="p-1 hover:text-white"
                    style={{ color: "var(--text-secondary)" }}
                    title="Rename Workspace"
                  >
                    <Edit2 size={13} />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete workspace "${acc.name}"? All linked wallets, transactions, and settings will be permanently destroyed.`)) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className="p-1 hover:text-red-400"
                      style={{ color: "var(--text-secondary)" }}
                      title="Delete Workspace"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddAcc ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAccError("");
            const res = addAccount(newAccName);
            if (res.success) {
              setNewAccName("");
              setShowAddAcc(false);
            } else if (res.error) {
              setAccError(res.error);
            }
          }}
          className="rounded-[10px] p-3 mb-4"
          style={{
            background: "var(--bg-surface-sunken)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="text-xs font-semibold mb-2">New Workspace Name</div>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. consulting_work"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-1.5 text-xs text-white"
              style={{
                background: "var(--bg-base)",
                borderColor: "var(--border-subtle)",
              }}
            />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-base)",
              }}
            >
              Create
            </button>
          </div>
          {accError && <div className="mt-2 text-xs text-red-400">{accError}</div>}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => {
                setShowAddAcc(false);
                setNewAccName("");
                setAccError("");
              }}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        accounts.length < 3 && (
          <button
            type="button"
            onClick={() => setShowAddAcc(true)}
            className="w-full flex items-center justify-center gap-2 rounded-[10px] border border-dashed py-2.5 text-xs font-bold cursor-pointer transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <Plus size={14} /> Add New Workspace
          </button>
        )
      )}
    </Section>
  );
}
