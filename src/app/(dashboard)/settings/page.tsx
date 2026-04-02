"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, RefreshCw, Save, ChevronDown, ChevronUp,
  Eye, EyeOff, Bot, Key, Radio, Server,
  ShieldCheck, ShieldOff, Trash2
} from "lucide-react";
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
    telegram?: { enabled?: boolean };
    discord?: { enabled?: boolean };
    slack?: { enabled?: boolean };
  };
}

interface SystemData {
  agent: { name: string; creature: string; emoji: string };
  system: { uptime: number; uptimeFormatted: string; nodeVersion: string; model: string; workspacePath: string; platform: string; hostname: string; memory: { total: number; free: number; used: number } };
  integrations: Array<{ id: string; name: string; status: "connected" | "disconnected" | "configured" | "not_configured"; icon: string; lastActivity: string | null }>;
  timestamp: string;
}

// ─── Secret helpers ───────────────────────────────────────────────────────────

async function upsertSecret(scope: string, key: string, field: string, value: string) {
  await fetch("/api/secrets", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, key, field, value }),
  });
}

async function deleteSecret(scope: string, key: string, field: string) {
  await fetch("/api/secrets", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, key, field }),
  });
}

async function fetchSecretsStatus(): Promise<Record<string, boolean>> {
  try {
    const res = await fetch("/api/secrets/status");
    const data = await res.json();
    return data.status ?? {};
  } catch {
    return {};
  }
}

// ─── Provider definitions ─────────────────────────────────────────────────────

const PROVIDERS = [
  { key: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/keys", field: "api_key" },
  { key: "openai",     label: "OpenAI",     url: "https://platform.openai.com/api-keys", field: "api_key" },
  { key: "anthropic",  label: "Anthropic",  url: "https://console.anthropic.com/keys", field: "api_key" },
  { key: "groq",       label: "Groq",       url: "https://console.groq.com/keys", field: "api_key" },
];

const CHANNELS = [
  { key: "telegram", label: "Telegram", field: "token",     placeholder: "Bot token do @BotFather" },
  { key: "discord",  label: "Discord",  field: "token",     placeholder: "Bot token do Discord Developer Portal" },
  { key: "slack",    label: "Slack",    field: "bot_token", placeholder: "Bot token (xoxb-...)" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("agents");
  const [config, setConfig] = useState<VertexConfig | null>(null);
  const [secretsStatus, setSecretsStatus] = useState<Record<string, boolean>>({});
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, sysRes, secretsStatus] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/system"),
        fetchSecretsStatus(),
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (sysRes.ok) setSystemData(await sysRes.json());
      setSecretsStatus(secretsStatus);
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

  const handleSaveSecret = async (scope: string, key: string, field: string) => {
    const inputKey = `${scope}.${key}.${field}`;
    const value = keyInputs[inputKey];
    if (!value?.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/secrets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, key, field, value: value.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveMsg("Erro ao salvar: " + (data.error || `HTTP ${res.status}`));
        return;
      }
      setKeyInputs(prev => ({ ...prev, [inputKey]: "" }));
      setSaveMsg("Chave salva com segurança no banco");
      const status = await fetchSecretsStatus();
      setSecretsStatus(status);
    } catch {
      setSaveMsg("Erro de conexão com o backend");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const handleDeleteSecret = async (scope: string, key: string, field: string) => {
    setSaving(true);
    try {
      await deleteSecret(scope, key, field);
      const status = await fetchSecretsStatus();
      setSecretsStatus(status);
      setSaveMsg("Chave removida");
    } catch {
      setSaveMsg("Erro ao remover chave");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const isSecretSet = (scope: string, key: string, field: string) =>
    secretsStatus[`${scope}.${key}.${field}`] === true;

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { key: "agents",    label: "Agentes",   icon: Bot    },
    { key: "providers", label: "Providers", icon: Key    },
    { key: "channels",  label: "Canais",    icon: Radio  },
    { key: "system",    label: "Sistema",   icon: Server },
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
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--card-elevated)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", color: "var(--text-secondary)", cursor: "pointer" }}>
          <RefreshCw style={{ width: "1rem", height: "1rem" }} />
        </button>
      </div>

      {saveMsg && (
        <div style={{ padding: "0.75rem 1rem", background: saveMsg.startsWith("Erro") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${saveMsg.startsWith("Erro") ? "var(--error)" : "#10b981"}`, borderRadius: "0.5rem", color: saveMsg.startsWith("Erro") ? "var(--error)" : "#10b981", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {saveMsg}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
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
          {/* ── AGENTS TAB ───────────────────────────────────────────────── */}
          {tab === "agents" && (
            !config ? (
              <div style={{ padding: "2rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.75rem", textAlign: "center" }}>
                <p style={{ color: "var(--error)", fontWeight: 600, marginBottom: "0.5rem" }}>Não foi possível carregar a configuração</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  O backend pode estar iniciando ou enfrentando um erro. Verifique os logs do serviço.
                </p>
                <button onClick={load} style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                  <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", fontSize: "0.95rem" }}>Defaults</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Modelo padrão</label>
                      <input
                        defaultValue={config.agents?.defaults?.model?.primary ?? ""}
                        className="input" style={{ width: "100%" }}
                        placeholder="openai/gpt-4o-mini"
                        onBlur={e => patch({ agents: { defaults: { model: { primary: e.target.value } } } })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Max tool iterations</label>
                      <input
                        type="number" defaultValue={config.agents?.defaults?.max_tool_iterations ?? 10}
                        className="input" style={{ width: "100%" }}
                        onBlur={e => patch({ agents: { defaults: { max_tool_iterations: Number(e.target.value) } } })}
                      />
                    </div>
                  </div>
                </div>

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
                        : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />}
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
                    Nenhum agente configurado
                  </div>
                )}
              </div>
            )
          )}

          {/* ── PROVIDERS TAB ────────────────────────────────────────────── */}
          {tab === "providers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.75rem 1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                🔐 As chaves são criptografadas com AES-256-GCM e salvas no banco de dados. Nunca ficam expostas em arquivos.
              </div>

              {PROVIDERS.map(({ key, label, url, field }) => {
                const secretSet = isSecretSet("provider", key, field);
                const inputKey = `provider.${key}.${field}`;
                return (
                  <div key={key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{label}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {secretSet ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "0.25rem 0.6rem", borderRadius: "1rem", border: "1px solid rgba(16,185,129,0.3)" }}>
                            <ShieldCheck style={{ width: "0.75rem", height: "0.75rem" }} /> Configurado
                          </span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--card-elevated)", padding: "0.25rem 0.6rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
                            <ShieldOff style={{ width: "0.75rem", height: "0.75rem" }} /> Não configurado
                          </span>
                        )}
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}>Obter chave →</a>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {secretSet ? "Substituir chave atual" : "API Key"}
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            type={showKeys[key] ? "text" : "password"}
                            value={keyInputs[inputKey] ?? ""}
                            onChange={e => setKeyInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                            className="input"
                            style={{ width: "100%", paddingRight: "3rem" }}
                            placeholder={secretSet ? "••••••••••••••••••••" : "sk-..."}
                          />
                          <button type="button"
                            onClick={() => setShowKeys(s => ({ ...s, [key]: !s[key] }))}
                            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                            {showKeys[key] ? <EyeOff style={{ width: "1rem", height: "1rem" }} /> : <Eye style={{ width: "1rem", height: "1rem" }} />}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveSecret("provider", key, field)}
                          disabled={saving || !keyInputs[inputKey]?.trim()}
                          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, opacity: saving || !keyInputs[inputKey]?.trim() ? 0.5 : 1 }}>
                          Salvar
                        </button>
                        {secretSet && (
                          <button
                            onClick={() => handleDeleteSecret("provider", key, field)}
                            style={{ padding: "0.5rem", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", cursor: "pointer" }}
                            title="Remover chave">
                            <Trash2 style={{ width: "1rem", height: "1rem" }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── CHANNELS TAB ─────────────────────────────────────────────── */}
          {tab === "channels" && config && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.75rem 1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                🔐 Os tokens dos canais são criptografados e salvos no banco. Ativar/desativar um canal requer reiniciar o gateway.
              </div>

              {CHANNELS.map(({ key, label, field, placeholder }) => {
                const ch = (config.channels as Record<string, { enabled?: boolean }>)?.[key] ?? {};
                const secretSet = isSecretSet("channel", key, field);
                const inputKey = `channel.${key}.${field}`;
                return (
                  <div key={key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{label}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {secretSet ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "0.25rem 0.6rem", borderRadius: "1rem", border: "1px solid rgba(16,185,129,0.3)" }}>
                            <ShieldCheck style={{ width: "0.75rem", height: "0.75rem" }} /> Token configurado
                          </span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--card-elevated)", padding: "0.25rem 0.6rem", borderRadius: "1rem", border: "1px solid var(--border)" }}>
                            <ShieldOff style={{ width: "0.75rem", height: "0.75rem" }} /> Sem token
                          </span>
                        )}
                        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!!ch.enabled}
                            onChange={e => patch({ channels: { [key]: { enabled: e.target.checked } } })}
                          />
                          <span style={{ fontSize: "0.8rem", color: ch.enabled ? "#10b981" : "var(--text-muted)" }}>
                            {ch.enabled ? "Ativo" : "Inativo"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {secretSet ? "Substituir token atual" : "Token"}
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            type={showKeys[key] ? "text" : "password"}
                            value={keyInputs[inputKey] ?? ""}
                            onChange={e => setKeyInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                            className="input"
                            style={{ width: "100%", paddingRight: "3rem" }}
                            placeholder={secretSet ? "••••••••••••••••••••" : placeholder}
                          />
                          <button type="button"
                            onClick={() => setShowKeys(s => ({ ...s, [key]: !s[key] }))}
                            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                            {showKeys[key] ? <EyeOff style={{ width: "1rem", height: "1rem" }} /> : <Eye style={{ width: "1rem", height: "1rem" }} />}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveSecret("channel", key, field)}
                          disabled={saving || !keyInputs[inputKey]?.trim()}
                          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, opacity: saving || !keyInputs[inputKey]?.trim() ? 0.5 : 1 }}>
                          Salvar
                        </button>
                        {secretSet && (
                          <button
                            onClick={() => handleDeleteSecret("channel", key, field)}
                            style={{ padding: "0.5rem", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", cursor: "pointer" }}
                            title="Remover token">
                            <Trash2 style={{ width: "1rem", height: "1rem" }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SYSTEM TAB ───────────────────────────────────────────────── */}
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

// ─── Agent Editor ─────────────────────────────────────────────────────────────

function AgentEditor({ agent, onSave }: { agent: AgentConfig; onSave: (a: AgentConfig) => void }) {
  const [form, setForm] = useState({
    name: agent.name ?? "",
    emoji: agent.ui?.emoji ?? "",
    model: agent.model?.primary ?? "",
    role: agent.role ?? "",
  });
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
          <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="openai/gpt-4o-mini" />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Role</label>
          <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input" style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => onSave({ ...agent, name: form.name, role: form.role, model: { ...agent.model, primary: form.model }, ui: { ...agent.ui, emoji: form.emoji } })}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
          <Save style={{ width: "0.875rem", height: "0.875rem" }} /> Salvar
        </button>
      </div>
    </div>
  );
}
