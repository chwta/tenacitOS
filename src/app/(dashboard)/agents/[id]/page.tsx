"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, Clock, XCircle, Zap, MessageSquare, Calendar, Brain, ListTodo } from "lucide-react";
import { getAgentDetail, AgentDetail, Task } from "@/lib/vertexos-client";

type LucideIcon = React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

const TASK_ICON: Record<string, LucideIcon> = {
  pending: Clock,
  in_progress: Zap,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: XCircle,
};

const TASK_COLOR: Record<string, string> = {
  pending: "var(--text-muted)",
  in_progress: "#f59e0b",
  completed: "#10b981",
  failed: "var(--error)",
  cancelled: "#6b7280",
};

function statusDot(status: AgentDetail["status"]) {
  const color = status === "online" ? "#10b981" : status === "idle" ? "#f59e0b" : "#6b7280";
  return <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "50%", background: color, display: "inline-block" }} />;
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"tasks" | "memory">("tasks");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgentDetail(id);
      setDetail(data);
    } catch {
      setError("Erro ao carregar dados do agente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <Link href="/agents" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: "1.5rem" }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Voltar para Agents
      </Link>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "0.5rem", color: "var(--error)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading && !detail ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Carregando...</div>
      ) : detail ? (
        <>
          {/* Hero */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  {statusDot(detail.status)}
                  <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{id}</h1>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{detail.status}</span>
                </div>
                {detail.last_seen && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    <Calendar style={{ width: "0.8rem", height: "0.8rem" }} />
                    Visto em {new Date(detail.last_seen).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Tokens Hoje", value: detail.today_tokens.toLocaleString(), icon: Zap },
              { label: "Chamadas Hoje", value: detail.today_calls.toLocaleString(), icon: MessageSquare },
              { label: "Tokens Mês", value: detail.month_tokens.toLocaleString(), icon: Calendar },
              { label: "Tarefas Ativas", value: `${detail.active_tasks}/${detail.total_tasks}`, icon: ListTodo },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Icon style={{ width: "1rem", height: "1rem", color: "var(--accent)" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                </div>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            {([["tasks", "Tarefas", ListTodo], ["memory", "Memoria", Brain]] as [string, string, LucideIcon][]).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key as "tasks" | "memory")}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", background: "transparent", border: "none", borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent", color: tab === key ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.875rem", fontWeight: tab === key ? 600 : 400 }}
              >
                <Icon style={{ width: "1rem", height: "1rem" }} /> {label}
              </button>
            ))}
          </div>

          {tab === "tasks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {detail.recent_tasks.length === 0 ? (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>Sem tarefas recentes</div>
              ) : (
                detail.recent_tasks.map(task => {
                  const Icon = TASK_ICON[task.status] ?? Clock;
                  return (
                    <div key={task.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                      <Icon style={{ width: "1.1rem", height: "1.1rem", color: TASK_COLOR[task.status], flexShrink: 0, marginTop: "0.1rem" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>{task.description}</p>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(task.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "memory" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {detail.memory.length === 0 ? (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>Nenhum fato em memoria</div>
              ) : (
                detail.memory.map(fact => (
                  <div key={fact.key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600 }}>{fact.key}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(fact.updated_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{fact.value}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
