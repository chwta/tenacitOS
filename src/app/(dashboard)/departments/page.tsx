"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Landmark,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Bot,
  Check,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  manager_agent_id: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = { id: "", name: "", manager_agent_id: "", description: "" };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data.departments ?? []);
      setError("");
    } catch {
      setError("Erro ao carregar departamentos do VertexOS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = departments.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
  });

  function openCreate() {
    setForm({ ...emptyForm });
    setSaveError("");
    setEditingId(null);
    setModal("create");
  }

  function openEdit(d: Department) {
    setForm({ id: d.id, name: d.name, manager_agent_id: d.manager_agent_id, description: d.description });
    setSaveError("");
    setEditingId(d.id);
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
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Erro ao criar departamento");
        }
      } else {
        const res = await fetch(`/api/departments?id=${encodeURIComponent(editingId!)}`, {
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
      await fetch(`/api/departments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setDeletingId(null);
      await load();
    } catch {
      // ignore
    }
  }

  const activeCount = departments.filter((d) => d.active).length;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-1.5px" }}
          >
            <Landmark className="inline-block w-8 h-8 mr-2 mb-1" />
            Departamentos
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Estrutura organizacional dos agentes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          Novo Departamento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6" style={{ maxWidth: "400px" }}>
        {[
          { label: "Total", value: departments.length, color: "var(--accent)" },
          { label: "Ativos", value: activeCount, color: "#4ade80" },
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

      {/* Search */}
      <div className="mb-5">
        <input
          placeholder="Buscar departamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card)", border: "1px solid var(--border)",
            color: "var(--text-primary)", outline: "none", width: "100%", maxWidth: "320px",
          }}
        />
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
        <div className="flex items-center justify-center min-h-[200px]" style={{ color: "var(--text-muted)" }}>
          Carregando departamentos...
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3"
          style={{ color: "var(--text-muted)" }}>
          <Landmark className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum departamento encontrado.</p>
          <button onClick={openCreate} className="text-sm underline" style={{ color: "var(--accent)" }}>
            Criar o primeiro
          </button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                {["Departamento", "Gerente (agente)", "Descrição", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((d, i) => (
                <tr
                  key={d.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--card)" : "var(--card-elevated)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{d.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    {d.manager_agent_id ? (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Bot className="w-3 h-3" />
                        {d.manager_agent_id}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ maxWidth: "280px" }}>
                    <span className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {d.description || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit"
                      style={{
                        backgroundColor: d.active ? "#4ade8020" : "#6b728020",
                        color: d.active ? "#4ade80" : "#6b7280",
                      }}>
                      {d.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {d.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        title="Editar"
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.backgroundColor = "var(--accent)15"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(d.id)}
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

      {/* Create / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                {modal === "create" ? "Novo Departamento" : "Editar Departamento"}
              </h2>
              <button onClick={closeModal} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {modal === "create" && (
                <Field label="ID (slug, ex: financeiro)" required>
                  <input
                    value={form.id}
                    onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, "-") }))}
                    placeholder="financeiro"
                    style={inputStyle}
                  />
                </Field>
              )}
              <Field label="Nome" required>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Financeiro"
                  style={inputStyle}
                />
              </Field>
              <Field label="Agente gerente (ID em config.json)">
                <input
                  value={form.manager_agent_id}
                  onChange={(e) => setForm((f) => ({ ...f, manager_agent_id: e.target.value }))}
                  placeholder="gerente_financeiro"
                  style={inputStyle}
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Responsável pela gestão financeira..."
                  style={{ ...inputStyle, resize: "vertical" }}
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

      {/* Delete Confirmation */}
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
              Excluir departamento?
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Colaboradores vinculados perderão a referência de departamento.
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
