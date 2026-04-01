"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Search, Plus, Trash2, X, Check, RefreshCw, FileText } from "lucide-react";
import { getKnowledge, createKnowledgeChunk, deleteKnowledgeChunk, KnowledgeChunk } from "@/lib/vertexos-client";

const PAGE_SIZE = 30;

export default function KnowledgePage() {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<KnowledgeChunk | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ content: "", source_filename: "", scope: "", source_type: "manual" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getKnowledge({ q: q || undefined, scope: scope || undefined, limit: PAGE_SIZE, offset });
      setChunks(result.chunks);
      setTotal(result.total);
    } catch {
      setError("Erro ao carregar base de conhecimento");
    } finally {
      setLoading(false);
    }
  }, [q, scope, offset]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await createKnowledgeChunk({
        content: form.content,
        source_filename: form.source_filename || undefined,
        scope: form.scope ? form.scope.split(",").map(s => s.trim()).filter(Boolean) : [],
        source_type: form.source_type,
      });
      setShowCreate(false);
      setForm({ content: "", source_filename: "", scope: "", source_type: "manual" });
      await load();
    } catch {
      setError("Erro ao criar chunk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteKnowledgeChunk(id);
      setDeleteId(null);
      if (selected?.id === id) setSelected(null);
      await load();
    } catch {
      setError("Erro ao deletar chunk");
    }
  };

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", height: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BookOpen style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>Knowledge Base</h1>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--card-elevated)", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>{total} chunks</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw style={{ width: "1rem", height: "1rem" }} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus style={{ width: "1rem", height: "1rem" }} /> Adicionar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexShrink: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "0.9rem", height: "0.9rem", color: "var(--text-muted)" }} />
          <input value={q} onChange={e => { setQ(e.target.value); setOffset(0); }} className="input" style={{ width: "100%", paddingLeft: "2.25rem" }} placeholder="Buscar por conteudo..." />
        </div>
        <input value={scope} onChange={e => { setScope(e.target.value); setOffset(0); }} className="input" style={{ width: "180px" }} placeholder="Filtrar por scope" />
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "0.5rem", color: "var(--error)", marginBottom: "1rem", fontSize: "0.875rem", flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: "flex", gap: "1rem", flex: 1, overflow: "hidden" }}>
        {/* List */}
        <div style={{ flex: selected ? "0 0 50%" : "1", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {loading && chunks.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Carregando...</div>
          ) : chunks.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>
              Nenhum chunk encontrado.
            </div>
          ) : (
            chunks.map(chunk => (
              <div
                key={chunk.id}
                onClick={() => setSelected(selected?.id === chunk.id ? null : chunk)}
                style={{ background: selected?.id === chunk.id ? "var(--accent-soft)" : "var(--card)", border: `1px solid ${selected?.id === chunk.id ? "var(--accent)" : "var(--border)"}`, borderRadius: "0.75rem", padding: "1rem", cursor: "pointer", transition: "all 150ms ease" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      <FileText style={{ width: "0.875rem", height: "0.875rem", color: "var(--accent)", flexShrink: 0 }} />
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>{chunk.source_filename || "manual"}</span>
                      {chunk.scope.map(s => (
                        <span key={s} style={{ fontSize: "0.65rem", background: "var(--accent-soft)", color: "var(--accent)", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>{s}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chunk.content}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", gap: "0.25rem" }} onClick={e => e.stopPropagation()}>
                    {deleteId === chunk.id ? (
                      <>
                        <button onClick={() => handleDelete(chunk.id)} style={{ padding: "0.2rem 0.4rem", background: "var(--error)", border: "none", borderRadius: "0.25rem", color: "white", cursor: "pointer" }}>
                          <Check style={{ width: "0.75rem", height: "0.75rem" }} />
                        </button>
                        <button onClick={() => setDeleteId(null)} style={{ padding: "0.2rem 0.4rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--text-muted)", cursor: "pointer" }}>
                          <X style={{ width: "0.75rem", height: "0.75rem" }} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteId(chunk.id)} style={{ padding: "0.2rem 0.4rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--error)", cursor: "pointer" }}>
                        <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", padding: "1rem 0", flexShrink: 0 }}>
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} className="btn-secondary" style={{ fontSize: "0.8rem" }}>Anterior</button>
              <span style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)} className="btn-secondary" style={{ fontSize: "0.8rem" }}>Proximo</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ flex: "0 0 50%", overflow: "auto", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem", position: "sticky", top: 0, alignSelf: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Chunk #{selected.id}</h3>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "1.1rem", height: "1.1rem" }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8rem" }}>
              {[
                ["doc_id", selected.doc_id],
                ["chunk_index", String(selected.chunk_index)],
                ["source_type", selected.source_type],
                ["source_filename", selected.source_filename || "—"],
                ["scope", selected.scope.join(", ") || "—"],
                ["created_at", new Date(selected.created_at).toLocaleString("pt-BR")],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "0.75rem" }}>
                  <span style={{ color: "var(--text-muted)", fontFamily: "monospace", minWidth: "110px" }}>{k}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                <p style={{ color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "0.5rem", fontSize: "0.75rem" }}>content</p>
                <pre style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", lineHeight: 1.5 }}>{selected.content}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "540px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.5rem" }}>Adicionar Chunk</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Conteudo *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input" style={{ width: "100%", height: "120px", resize: "vertical" }} placeholder="Texto do chunk..." />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Arquivo fonte</label>
                <input value={form.source_filename} onChange={e => setForm(f => ({ ...f, source_filename: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Ex: manual.pdf" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Scopes (separados por virgula)</label>
                <input value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className="input" style={{ width: "100%" }} placeholder="Ex: engineering, hr" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>Tipo de fonte</label>
                <select value={form.source_type} onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))} className="input" style={{ width: "100%" }}>
                  <option value="manual">manual</option>
                  <option value="document">document</option>
                  <option value="web">web</option>
                  <option value="code">code</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !form.content.trim()} className="btn-primary">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
