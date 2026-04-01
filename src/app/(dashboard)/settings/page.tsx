"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, RefreshCw, Save, ChevronDown, ChevronUp, Eye, EyeOff, Bot, Key, Radio, Server } from "lucide-react";
import { SystemInfo } from "@/components/SystemInfo";
import { IntegrationStatus } from "@/components/IntegrationStatus";

type Tab = "agents" | "providers" | "channels" | "system";

interface AgentConfig {
  id: string;
  name?: string;
  role?: string;
  department?: string;
  model?: { primary?: string };
  ui?: { emoji?: string; color?: string };
}

interface VertexConfig {
  agents?: {
    defaults?: { model?: { primary?: string }; max_tool_iterations?: number };
    list?: AgentConfig[];
  };
  channels?: {
    telegram?: { enabled?: boolean; token?: string };
    discord?: { enabled?: boolean; token?: string };
    pico?: { enabled?: boolean; token?: string };
  };
  providers?: Record<string, { api_key?: string; base_url?: string }>;
}

interface SystemData {
  agent: { name: string; creature: string; emoji: string };
  system: { uptime: number; uptimeFormatted: string; nodeVersion: string; model: string; workspacePath: string; platform: string; hostname: string; memory: { total: number; free: number; used: number } };
  integrations: Array<{ id: string; name: string; status: "connected" | "disconnected" | "configured" | "not_configured"; icon: string; lastActivity: string | null }>;
  timestamp: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("agents");
  const [config, setConfig] = useState<VertexConfig | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, sysRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/system"),
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (sysRes.ok) setSystemData(await sysRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg("Salvo com sucesso");
        await load();
      } else {
        setSaveMsg("Erro: " + (data.errors?.join(", ") || data.error || "falha ao salvar"));
      }
    } catch {
      setSaveMsg("Erro de conexão");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { key: "agents", label: "Agentes", icon: Bot },
    { key: "providers", label: "Providers", icon: Key },
    { key: "channels", label: "Canais", icon: Radio },
    { key: "system", label: "Sistema", icon: Server },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Settings style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Settings
          </h1>
        </div>
        <button onClick={load} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <RefreshCw style={{ width: "1rem", height: "1rem" }} />
        </button>
      </div>

      {saveMsg && (
        <div style={{ padding: "0.75rem 1rem", background: saveMsg.startsWith("Erro") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${saveMsg.startsWith("Erro") ? "var(--error)" : "#10b981"}`, borderRadius: "0.5rem", color: saveMsg.startsWith("Erro") ? "var(--error)" : "#10b981", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {saveMsg}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "2rem", gap: 0 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", background: "transparent", border: "none", borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent", color: tab === key ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.875rem", fontWeight: tab === key ? 600 : 400 }}>
            <Icon style={{ width: "1rem", height: "1rem" }} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Carregando...</div>
      ) : (
        <>
          {/* AGENTS TAB */}
          {tab === "agents" && config && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Defaults */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", fontSize: "0.95rem" }}>Defaults</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Modelo padrão</label>
                    <input
                      defaultValue={config.agents?.defaults?.model?.primary ?? ""}
                      className="input"
                      style={{ width: "100%" }}
                      placeholder="ex: openrouter/claude-sonnet-4-5"
                      onBlur={e => patch({ agents: { defaults: { model: { primary: e.target.value } } } })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Max tool iterations</label>
                    <input
                      type="number"
                      defaultValue={config.agents?.defaults?.max_tool_iterations ?? 10}
                      className="input"
                      style={{ width: "100%" }}
                      onBlur={e => patch({ agents: { defaults: { max_tool_iterations: Number(e.target.value) } } })}
                    />
                  </div>
                </div>
              </div>

              {/* Agent list */}
              {(config.agents?.list ?? []).map(agent => (
                <div key={agent.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden" }}>
                  <button
                    onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>{agent.ui?.emoji ?? "🤖"}</span>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{agent.name ?? agent.id}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>{agent.id}</p>
                      </div>
                    </div>
                    {expandedAgent === agent.id
                      ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
                      : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
                    }
                  </button>

                  {expandedAgent === agent.id && (
                    <AgentEditor agent={agent} onSave={updated => {
                      const list = (config.agents?.list ?? []).map(a => a.id === updated.id ? updated : a);
                      patch({ agents: { list } });
                    }} />
                  )}
                </div>
              ))}

              {(!config.agents?.list || config.agents.list.length === 0) && (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>
                  Nenhum agente configurado em config.json
                </div>
              )}
            </div>
          )}

          {/* PROVIDERS TAB */}
          {tab === "providers" && config && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {Object.entries(config.providers ?? {}).map(([provider, cfg]) => (
                <div key={provider} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                  <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", fontSize: "0.95rem", textTransform: "capitalize" }}>{provider}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>API Key</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showKeys[provider] ? "text" : "password"}
                          defaultValue={(cfg as Record<string, string>).api_key ?? ""}
                          className="input"
                          style={{ width: "100%", paddingRight: "3rem" }}
                          placeholder="sk-..."
                          onBlur={e => patch({ providers: { [provider]: { api_key: e.target.value } } })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys(s => ({ ...s, [provider]: !s[provider] }))}
                          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                        >
                          {showKeys[provider] ? <EyeOff style={{ width: "1rem", height: "1rem" }} /> : <Eye style={{ width: "1rem", height: "1rem" }} />}
                        </button>
                      </div>
                    </div>
                    {(cfg as Record<string, string>).base_url !== undefined && (
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Base URL</label>
                        <input
                          defaultValue={(cfg as Record<string, string>).base_url ?? ""}
                          className="input"
                          style={{ width: "100%" }}
                          onBlur={e => patch({ providers: { [provider]: { base_url: e.target.value } } })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {Object.keys(config.providers ?? {}).length === 0 && (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>
                  Nenhum provider configurado
                </div>
              )}
            </div>
          )}

          {/* CHANNELS TAB */}
          {tab === "channels" && config && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {([
                { key: "telegram", label: "Telegram" },
                { key: "discord", label: "Discord" },
                { key: "pico", label: "Pico" },
              ] as { key: keyof NonNullable<VertexConfig["channels"]>; label: string }[]).map(({ key, label }) => {
                const ch = config.channels?.[key] ?? {};
                return (
                  <div key={key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{label}</h3>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!(ch as Record<string, unknown>).enabled}
                          onChange={e => patch({ channels: { [key]: { enabled: e.target.checked } } })}
                        />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {(ch as Record<string, unknown>).enabled ? "Ativo" : "Inativo"}
                        </span>
                      </label>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Token</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showKeys[key] ? "text" : "password"}
                          defaultValue={(ch as Record<string, string>).token ?? ""}
                          className="input"
                          style={{ width: "100%", paddingRight: "3rem" }}
                          placeholder="Token do canal"
                          onBlur={e => patch({ channels: { [key]: { token: e.target.value } } })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys(s => ({ ...s, [key]: !s[key] }))}
                          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                        >
                          {showKeys[key] ? <EyeOff style={{ width: "1rem", height: "1rem" }} /> : <Eye style={{ width: "1rem", height: "1rem" }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SYSTEM TAB */}
          {tab === "system" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <SystemInfo data={systemData} />
              <IntegrationStatus integrations={systemData?.integrations ?? null} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AgentEditor({ agent, onSave }: { agent: AgentConfig; onSave: (a: AgentConfig) => void }) {
  const [form, setForm] = useState({ name: agent.name ?? "", emoji: agent.ui?.emoji ?? "", model: agent.model?.primary ?? "", role: agent.role ?? "" });
  return (
    <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Nome</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Emoji</label>
          <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className="input" style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Modelo</label>
          <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="openrouter/..." />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Role</label>
          <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input" style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => onSave({ ...agent, name: form.name, role: form.role, model: { ...agent.model, primary: form.model }, ui: { ...agent.ui, emoji: form.emoji } })}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}
        >
          <Save style={{ width: "0.875rem", height: "0.875rem" }} /> Salvar
        </button>
      </div>
    </div>
  );
}
