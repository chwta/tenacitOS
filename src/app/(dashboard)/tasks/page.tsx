"use client";

import { useEffect, useState, useCallback } from "react";
import React from "react";
import {
  LayoutList,
  Plus,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Loader2,
} from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "done" | "failed" | "cancelled";

interface Task {
  id: number;
  collaborator_id: string;
  agent_id: string;
  description: string;
  source: string;
  status: TaskStatus;
  result: string;
  error_message: string;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

type LucideIcon = React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

const COLUMNS: { status: TaskStatus; label: string; color: string; bg: string; icon: LucideIcon }[] = [
  { status: "pending",     label: "Pendente",     color: "#94a3b8", bg: "#94a3b810", icon: Clock },
  { status: "in_progress", label: "Em Andamento", color: "#60a5fa", bg: "#60a5fa10", icon: Loader2 },
  { status: "done",        label: "Concluído",    color: "#4ade80", bg: "#4ade8010", icon: CheckCircle2 },
  { status: "failed",      label: "Falhou",       color: "#f87171", bg: "#f8717110", icon: AlertTriangle },
  { status: "cancelled",   label: "Cancelado",    color: "#a78bfa", bg: "#a78bfa10", icon: Ban },
];

const emptyForm = { agent_id: "", description: "", collaborator_id: "", source: "admin" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setError("");
    } catch {
      setError("Erro ao carregar tarefas do VertexOS.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCreate() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao criar tarefa");
      }
      setShowCreate(false);
      setForm({ ...emptyForm });
      await load(true);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(task: Task, newStatus: TaskStatus) {
    setMovingId(task.id);
    try {
      await fetch(`/api/tasks?id=${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await load(true);
    } finally {
      setMovingId(null);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      setDeletingId(null);
      await load(true);
    } catch {
      // ignore
    }
  }

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const nextStatuses: Record<TaskStatus, TaskStatus[]> = {
    pending:     ["in_progress", "cancelled"],
    in_progress: ["done", "failed", "cancelled"],
    done:        [],
    failed:      ["pending"],
    cancelled:   ["pending"],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "4px" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, letterSpacing: "-1px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <LayoutList style={{ width: "28px", height: "28px" }} />
            Tarefas
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{
                padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)",
                backgroundColor: "var(--card)", color: "var(--text-muted)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px", fontSize: "13px",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Atualizar
            </button>
            <button
              onClick={() => { setShowCreate(true); setSaveError(""); setForm({ ...emptyForm }); }}
              style={{
                padding: "8px 16px", borderRadius: "8px", backgroundColor: "var(--accent)",
                color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
                fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Nova Tarefa
            </button>
          </div>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""} · {tasksByStatus("in_progress").length} em andamento
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: "0 24px 12px", padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--error)20", border: "1px solid var(--error)40", color: "var(--error)", fontSize: "13px" }}>
          <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          Carregando tarefas...
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: "16px",
            padding: "0 24px 24px",
            overflowX: "auto",
            overflowY: "hidden",
            alignItems: "flex-start",
          }}
        >
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.status);
            const Icon = col.icon;
            return (
              <div
                key={col.status}
                style={{
                  minWidth: "260px",
                  maxWidth: "300px",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: col.bg,
                  borderRadius: "12px",
                  border: `1px solid ${col.color}30`,
                  overflow: "hidden",
                  maxHeight: "calc(100vh - 220px)",
                }}
              >
                {/* Column header */}
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${col.color}30`, display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <Icon style={{ width: "16px", height: "16px", color: col.color }} />
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: col.color }}>
                    {col.label}
                  </span>
                  <span style={{
                    marginLeft: "auto",
                    backgroundColor: `${col.color}25`,
                    color: col.color,
                    borderRadius: "20px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {colTasks.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      Nenhuma tarefa
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        colColor={col.color}
                        nextStatuses={nextStatuses[task.status]}
                        columns={COLUMNS}
                        onMove={handleMove}
                        onDelete={() => setDeletingId(task.id)}
                        moving={movingId === task.id}
                        formatDate={formatDate}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                Nova Tarefa
              </h2>
              <button onClick={() => setShowCreate(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Agente responsável (ID)" required>
                <input
                  value={form.agent_id}
                  onChange={(e) => setForm((f) => ({ ...f, agent_id: e.target.value }))}
                  placeholder="assistente_financeiro"
                  style={inputStyle}
                />
              </Field>
              <Field label="Descrição da tarefa" required>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Descreva o que o agente deve fazer..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Colaborador (ID, opcional)">
                <input
                  value={form.collaborator_id}
                  onChange={(e) => setForm((f) => ({ ...f, collaborator_id: e.target.value }))}
                  placeholder="joao.silva"
                  style={inputStyle}
                />
              </Field>
            </div>

            {saveError && (
              <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: "var(--error)20", color: "var(--error)" }}>
                {saveError}
              </div>
            )}

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: "var(--card-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ backgroundColor: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Criando..." : "Criar Tarefa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Trash2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--error)" }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Excluir tarefa #{deletingId}?
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Esta ação é permanente.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: "var(--card-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "var(--error)", color: "#fff" }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task, colColor, nextStatuses, columns, onMove, onDelete, moving, formatDate,
}: {
  task: Task;
  colColor: string;
  nextStatuses: TaskStatus[];
  columns: { status: TaskStatus; label: string; color: string; bg: string; icon: LucideIcon }[];
  onMove: (task: Task, s: TaskStatus) => void;
  onDelete: () => void;
  moving: boolean;
  formatDate: (s: string) => string;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: "8px",
        padding: "12px",
        border: "1px solid var(--border)",
        opacity: moving ? 0.6 : 1,
        transition: "opacity 150ms",
      }}
    >
      {/* Task ID + agent */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
          #{task.id}
        </span>
        <span style={{
          fontSize: "10px", fontWeight: 600, color: colColor,
          backgroundColor: `${colColor}20`, borderRadius: "4px", padding: "1px 6px",
        }}>
          {task.agent_id}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.5",
        marginBottom: "8px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {task.description}
      </p>

      {/* Error message */}
      {task.error_message && (
        <p style={{ fontSize: "11px", color: "#f87171", marginBottom: "8px", fontStyle: "italic" }}>
          {task.error_message}
        </p>
      )}

      {/* Date */}
      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>
        {formatDate(task.created_at)}
        {task.attempt_count > 1 && (
          <span style={{ marginLeft: "6px", color: "#fb923c" }}>
            · {task.attempt_count} tentativas
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
        {nextStatuses.map((ns) => {
          const col = columns.find((c) => c.status === ns)!;
          return (
            <button
              key={ns}
              onClick={() => onMove(task, ns)}
              disabled={moving}
              style={{
                fontSize: "10px", fontWeight: 600, padding: "3px 8px",
                borderRadius: "4px", border: `1px solid ${col.color}50`,
                backgroundColor: `${col.color}15`, color: col.color,
                cursor: "pointer", transition: "all 100ms",
              }}
            >
              → {col.label}
            </button>
          );
        })}
        <button
          onClick={onDelete}
          style={{
            marginLeft: "auto", padding: "3px 6px", borderRadius: "4px",
            border: "none", backgroundColor: "transparent", cursor: "pointer",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--error)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <Trash2 style={{ width: "12px", height: "12px" }} />
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  backgroundColor: "var(--card-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  outline: "none",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
        {required && <span style={{ color: "var(--error)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
