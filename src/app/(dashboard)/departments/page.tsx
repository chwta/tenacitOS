"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Pencil, Trash2, RefreshCw, X, Check } from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  Department,
} from "@/lib/vertexos-client";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", manager_agent_id: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getDepartments();
      setDepartments(list);
    } catch {
      setError("Erro ao carregar departamentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", description: "", manager_agent_id: "" });
    setShowModal(true);
  };

  const openEdit = (d: Department) => {
    setEditTarget(d);
    setForm({ name: d.name, description: d.description ?? "", manager_agent_id: d.manager_agent_id ?? "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateDepartment(editTarget.id, form);
      } else {
        await createDepartment({ ...form, id: crypto.randomUUID() });
      }
      setShowModal(false);
      await load();
    } catch {
      setError("Erro ao salvar departamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment(id);
      setDeleteId(null);
      await load();
    } catch {
      setError("Erro ao deletar departamento");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Building2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Departamentos
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw style={{ width: "1rem", height: "1rem" }} />
          </button>
          <button onClick={openCreate} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus style={{ width: "1rem", height: "1rem" }} /> Novo
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "0.5rem", color: "var(--error)", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Carregando...</div>
      ) : departments.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>
          Nenhum departamento cadastrado.
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--card-elevated)", borderBottom: "1px solid var(--border)" }}>
                {["Nome", "Descricao", "Manager Agent", "Criado em", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: i < departments.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{d.description ?? "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "monospace" }}>{d.manager_agent_id ?? "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(d)} style={{ padding: "0.25rem 0.5rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", color: "var(--text-muted)", cursor: "pointer" }}>
                        <Pencil style={{ width: "0.875rem", height: "0.875rem" }} />
                      </button>
                      {deleteId === d.id ? (
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <button onClick={() => handleDelete(d.id)} style={{ padding: "0.25rem 0.5rem", background: "var(--error)", border: "none", borderRadius: "0.375rem", color: "white", cursor: "pointer" }}>
                            <Check style={{ width: "0.875rem", height: "0.875rem" }} />
                          </button>
                          <button onClick={() => setDeleteId(null)} style={{ padding: "0.25rem 0.5rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", color: "var(--text-muted)", cursor: "pointer" }}>
                            <X style={{ width: "0.875rem", height: "0.875rem" }} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(d.id)} style={{ padding: "0.25rem 0.5rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", color: "var(--error)", cursor: "pointer" }}>
                          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "480px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              {editTarget ? "Editar Departamento" : "Novo Departamento"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Ex: Engenharia" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Descricao</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Opcional" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Manager Agent ID</label>
                <input value={form.manager_agent_id} onChange={e => setForm(f => ({ ...f, manager_agent_id: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
