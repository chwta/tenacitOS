"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutList, RefreshCw, Plus, Trash2, ArrowRight, X, Check } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask, Task } from "@/lib/vertexos-client";

type LucideIcon = React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

const STATUS_COLS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "pending", label: "Pendente", color: "var(--text-muted)" },
  { key: "in_progress", label: "Em Andamento", color: "#f59e0b" },
  { key: "done", label: "Concluido", color: "#10b981" },
  { key: "failed", label: "Falhou", color: "var(--error)" },
  { key: "cancelled", label: "Cancelado", color: "#6b7280" },
];

const NEXT_STATUS: Partial<Record<Task["status"], Task["status"]>> = {
  pending: "in_progress",
  in_progress: "done",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ description: "", collaborator_id: "", agent_id: "", source: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getTasks();
      setTasks(list);
    } catch {
      setError("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleCreate = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      await createTask({ description: form.description, collaborator_id: form.collaborator_id || undefined, agent_id: form.agent_id || "dashboard", source: form.source || undefined });
      setShowCreate(false);
      setForm({ description: "", collaborator_id: "", agent_id: "", source: "" });
      await load();
    } catch {
      setError("Erro ao criar tarefa");
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (task: Task) => {
    const next = NEXT_STATUS[task.status];
    if (!next) return;
    try {
      await updateTask(task.id, { status: next });
      await load();
    } catch {
      setError("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setDeleteId(null);
      await load();
    } catch {
      setError("Erro ao deletar tarefa");
    }
  };

  const byStatus = (status: Task["status"]) => tasks.filter(t => t.status === status);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <LayoutList style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Tarefas
          </h1>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--card-elevated)", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
            auto-refresh 15s
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw style={{ width: "1rem", height: "1rem" }} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus style={{ width: "1rem", height: "1rem" }} /> Nova Tarefa
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "0.5rem", color: "var(--error)", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Carregando...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", alignItems: "start" }}>
          {STATUS_COLS.map(col => (
            <div key={col.key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: col.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{col.label}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--card-elevated)", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                  {byStatus(col.key).length}
                </span>
              </div>
              <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "4rem" }}>
                {byStatus(col.key).map(task => (
                  <div key={task.id} style={{ background: "var(--card-elevated)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.75rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.4 }}>{task.description}</p>
                    {task.agent_id && (
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "0.5rem" }}>
                        {task.agent_id}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                      {NEXT_STATUS[task.status] && (
                        <button onClick={() => handleTransition(task)} title="Avancar status" style={{ padding: "0.2rem 0.4rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--accent)", cursor: "pointer" }}>
                          <ArrowRight style={{ width: "0.75rem", height: "0.75rem" }} />
                        </button>
                      )}
                      {deleteId === task.id ? (
                        <>
                          <button onClick={() => handleDelete(task.id)} style={{ padding: "0.2rem 0.4rem", background: "var(--error)", border: "none", borderRadius: "0.25rem", color: "white", cursor: "pointer" }}>
                            <Check style={{ width: "0.75rem", height: "0.75rem" }} />
                          </button>
                          <button onClick={() => setDeleteId(null)} style={{ padding: "0.2rem 0.4rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--text-muted)", cursor: "pointer" }}>
                            <X style={{ width: "0.75rem", height: "0.75rem" }} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setDeleteId(task.id)} style={{ padding: "0.2rem 0.4rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--error)", cursor: "pointer" }}>
                          <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "480px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.5rem" }}>Nova Tarefa</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Descricao *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" style={{ width: "100%", height: "80px", resize: "vertical" }} placeholder="Descreva a tarefa..." />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Colaborador ID</label>
                <input value={form.collaborator_id} onChange={e => setForm(f => ({ ...f, collaborator_id: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Opcional" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Agent ID</label>
                <input value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Opcional" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Fonte</label>
                <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Ex: dashboard" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !form.description.trim()} className="btn-primary">
                {saving ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
