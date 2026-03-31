"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Wifi,
  WifiOff,
  X,
  Check,
  AlertCircle,
  Building2,
  MessageSquare,
  Bot,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Collaborator {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  personal_agent_id: string;
  telegram_id: string;
  telegram_username: string;
  timezone: string;
  language: string;
  has_bridge: boolean;
  bridge_online: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
  manager_agent_id: string;
}

const emptyForm = {
  id: "",
  name: "",
  department_id: "",
  personal_agent_id: "",
  telegram_id: "",
  telegram_username: "",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
};

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter
  const [filterDept, setFilterDept] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        fetch("/api/collaborators"),
        fetch("/api/departments"),
      ]);
      const cData = await cRes.json();
      const dData = await dRes.json();
      setCollaborators(cData.collaborators ?? []);
      setDepartments(dData.departments ?? []);
      setError("");
    } catch {
      setError("Erro ao carregar dados do VertexOS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Filtered list ──────────────────────────────────────────

  const visible = collaborators.filter((c) => {
    if (filterDept && c.department_id !== filterDept) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.telegram_id.includes(q) ||
        c.personal_agent_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────

  const totalOnline = collaborators.filter((c) => c.bridge_online).length;
  const totalBridge = collaborators.filter((c) => c.has_bridge).length;
  const totalActive = collaborators.filter((c) => c.active).length;

  // ── Modal helpers ─────────────────────────────────────────

  function openCreate() {
    setForm({ ...emptyForm });
    setSaveError("");
    setEditingId(null);
    setModal("create");
  }

  function openEdit(c: Collaborator) {
    setForm({
      id: c.id,
      name: c.name,
      department_id: c.department_id,
      personal_agent_id: c.personal_agent_id,
      telegram_id: c.telegram_id,
      telegram_username: c.telegram_username,
      timezone: c.timezone,
      language: c.language,
    });
    setSaveError("");
    setEditingId(c.id);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      if (modal === "create") {
        const res = await fetch("/api/collaborators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Erro ao criar colaborador");
        }
      } else {
        const res = await fetch(`/api/collaborators?id=${encodeURIComponent(editingId!)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Erro ao salvar");
        }
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/collaborators?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setDeletingId(null);
      await load();
    } catch {
      // ignore — user can retry
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-1.5px" }}
          >
            <Users className="inline-block w-8 h-8 mr-2 mb-1" />
            Colaboradores
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Gestão de colaboradores e bridge status
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: collaborators.length, color: "var(--accent)" },
          { label: "Ativos", value: totalActive, color: "#4ade80" },
          { label: "Com Bridge", value: totalBridge, color: "#60a5fa" },
          { label: "Bridge Online", value: totalOnline, color: "#34d399" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "var(--font-heading)" }}>
              {s.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          placeholder="Buscar por nome, Telegram ID ou agente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card)", border: "1px solid var(--border)",
            color: "var(--text-primary)", outline: "none",
          }}
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card)", border: "1px solid var(--border)",
            color: "var(--text-primary)", cursor: "pointer",
          }}
        >
          <option value="">Todos os departamentos</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
          style={{ backgroundColor: "var(--error)20", border: "1px solid var(--error)40", color: "var(--error)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"
          style={{ color: "var(--text-muted)" }}>
          Carregando colaboradores...
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3"
          style={{ color: "var(--text-muted)" }}>
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum colaborador encontrado.</p>
          <button onClick={openCreate} className="text-sm underline" style={{ color: "var(--accent)" }}>
            Criar o primeiro
          </button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                {["Colaborador", "Departamento", "Agente", "Telegram", "Bridge", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--card)" : "var(--card-elevated)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{c.id}</div>
                  </td>
                  {/* Department */}
                  <td className="px-4 py-3">
                    {c.department_name ? (
                      <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md w-fit"
                        style={{ backgroundColor: "var(--accent)20", color: "var(--accent)" }}>
                        <Building2 className="w-3 h-3" />
                        {c.department_name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  {/* Agent */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <Bot className="w-3 h-3" />
                      {c.personal_agent_id}
                    </span>
                  </td>
                  {/* Telegram */}
                  <td className="px-4 py-3">
                    {c.telegram_id ? (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "#0088cc" }}>
                        <MessageSquare className="w-3 h-3" />
                        {c.telegram_username ? `@${c.telegram_username}` : c.telegram_id}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  {/* Bridge */}
                  <td className="px-4 py-3">
                    {c.has_bridge ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: c.bridge_online ? "#34d399" : "#6b7280" }}>
                        {c.bridge_online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        {c.bridge_online ? "Online" : "Offline"}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sem bridge</span>
                    )}
                  </td>
                  {/* Active */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit"
                      style={{
                        backgroundColor: c.active ? "#4ade8020" : "#6b728020",
                        color: c.active ? "#4ade80" : "#6b7280",
                      }}>
                      {c.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        title="Editar"
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.backgroundColor = "var(--accent)15"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(c.id)}
                        title="Excluir"
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--error)"; e.currentTarget.style.backgroundColor = "var(--error)15"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                {modal === "create" ? "Novo Colaborador" : "Editar Colaborador"}
              </h2>
              <button onClick={closeModal} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ID — only on create */}
              {modal === "create" && (
                <Field label="ID (slug, ex: joao.silva)" required>
                  <input
                    value={form.id}
                    onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, ".") }))}
                    placeholder="joao.silva"
                    style={inputStyle}
                  />
                </Field>
              )}
              <Field label="Nome completo" required>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="João Silva"
                  style={inputStyle}
                />
              </Field>
              <Field label="Departamento">
                <select
                  value={form.department_id}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">— Sem departamento —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Agente pessoal (ID do agente em config.json)" required>
                <input
                  value={form.personal_agent_id}
                  onChange={(e) => setForm((f) => ({ ...f, personal_agent_id: e.target.value }))}
                  placeholder="assistente_financeiro"
                  style={inputStyle}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telegram ID (numérico)">
                  <input
                    value={form.telegram_id}
                    onChange={(e) => setForm((f) => ({ ...f, telegram_id: e.target.value }))}
                    placeholder="123456789"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Username (@handle)">
                  <input
                    value={form.telegram_username}
                    onChange={(e) => setForm((f) => ({ ...f, telegram_username: e.target.value.replace("@", "") }))}
                    placeholder="joaosilva"
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fuso horário">
                  <input
                    value={form.timezone}
                    onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Idioma">
                  <select
                    value={form.language}
                    onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="pt-BR">pt-BR</option>
                    <option value="en-US">en-US</option>
                    <option value="es">es</option>
                  </select>
                </Field>
              </div>
            </div>

            {saveError && (
              <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: "var(--error)20", color: "var(--error)" }}>
                {saveError}
              </div>
            )}

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: "var(--card-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ backgroundColor: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────── */}
      {deletingId && (
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
              Excluir colaborador?
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Esta ação é irreversível. O histórico de conversas e tarefas será mantido.
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

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
