"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, DollarSign, Zap, Download, AlertTriangle, RefreshCw } from "lucide-react";

interface UsageByKey {
  key: string;
  total_tokens: number;
  estimated_cost_usd: number;
  calls: number;
}

interface UsageDaily {
  date: string;
  total_tokens: number;
  estimated_cost_usd: number;
}

interface UsageData {
  today: number;
  yesterday: number;
  this_month: number;
  by_agent: UsageByKey[];
  by_model: UsageByKey[];
  daily: UsageDaily[];
}

const USD = (v: number) => `$${v.toFixed(4)}`;
const TOKENS = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
const DEFAULT_BUDGET = 5.0;

export default function AnalyticsPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState<"agent" | "model">("agent");
  const [budget, setBudget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return parseFloat(localStorage.getItem("vx_daily_budget") ?? String(DEFAULT_BUDGET));
    }
    return DEFAULT_BUDGET;
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(budget));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usage");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveBudget = () => {
    const v = parseFloat(budgetInput);
    if (!isNaN(v) && v > 0) {
      setBudget(v);
      localStorage.setItem("vx_daily_budget", String(v));
    }
    setEditingBudget(false);
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Data", "Tokens", "Custo USD"],
      ...data.daily.map(d => [d.date, d.total_tokens, d.estimated_cost_usd.toFixed(6)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vertexos_usage.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple bar chart using divs
  const maxDaily = Math.max(...(data?.daily.map(d => d.estimated_cost_usd) ?? [0.001]), 0.001);

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BarChart3 style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Analytics
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCSV} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <Download style={{ width: "0.875rem", height: "0.875rem" }} /> CSV
          </button>
          <button onClick={load} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Carregando...</div>
      ) : data ? (
        <>
          {/* Budget alert */}
          {data.today >= budget && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
              <AlertTriangle style={{ width: "1.1rem", height: "1.1rem", color: "#f59e0b", flexShrink: 0 }} />
              <span style={{ color: "#f59e0b", fontSize: "0.875rem" }}>
                Limite diário atingido — {USD(data.today)} de {USD(budget)} orçado
              </span>
            </div>
          )}

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Hoje", value: USD(data.today), icon: DollarSign, color: data.today >= budget ? "#f59e0b" : "var(--accent)" },
              { label: "Ontem", value: USD(data.yesterday), icon: TrendingUp, color: "var(--accent)" },
              { label: "Este Mês", value: USD(data.this_month), icon: BarChart3, color: "var(--accent)" },
              { label: "Tokens (30d)", value: TOKENS(data.by_agent.reduce((s, a) => s + a.total_tokens, 0)), icon: Zap, color: "var(--accent)" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Icon style={{ width: "1rem", height: "1rem", color }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                </div>
                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Budget config */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <AlertTriangle style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Alerta de budget diário:</span>
            {editingBudget ? (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input value={budgetInput} onChange={e => setBudgetInput(e.target.value)} className="input" style={{ width: "80px" }} />
                <button onClick={saveBudget} className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}>OK</button>
                <button onClick={() => setEditingBudget(false)} className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}>X</button>
              </div>
            ) : (
              <button onClick={() => { setBudgetInput(String(budget)); setEditingBudget(true); }} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", padding: "0.25rem 0.75rem", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.875rem" }}>
                {USD(budget)} / dia
              </button>
            )}
          </div>

          {/* Daily chart */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem" }}>Custo diário — últimos 30 dias</h2>
            {data.daily.length === 0 ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>Sem dados</div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "120px", overflowX: "auto" }}>
                {data.daily.map(d => {
                  const h = Math.max(4, (d.estimated_cost_usd / maxDaily) * 110);
                  return (
                    <div key={d.date} title={`${d.date}: ${USD(d.estimated_cost_usd)} | ${TOKENS(d.total_tokens)} tokens`} style={{ flex: "1 0 12px", minWidth: "12px", maxWidth: "28px", height: `${h}px`, background: d.estimated_cost_usd >= budget ? "#f59e0b" : "var(--accent)", borderRadius: "2px 2px 0 0", opacity: 0.85, cursor: "pointer", transition: "opacity 150ms" }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "0.85"; }}
                    />
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{data.daily[0]?.date ?? ""}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{data.daily[data.daily.length - 1]?.date ?? ""}</span>
            </div>
          </div>

          {/* By agent / model tables */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {([["agent", "Por Agente"], ["model", "Por Modelo"]] as [string, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTable(k as "agent" | "model")} style={{ padding: "0.75rem 1.25rem", background: "transparent", border: "none", borderBottom: activeTable === k ? "2px solid var(--accent)" : "2px solid transparent", color: activeTable === k ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.875rem", fontWeight: activeTable === k ? 600 : 400 }}>
                  {l}
                </button>
              ))}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--card-elevated)" }}>
                  {["Nome", "Tokens", "Chamadas", "Eficiência", "Custo"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeTable === "agent" ? data.by_agent : data.by_model).map((row) => (
                  <tr key={row.key} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", fontFamily: "monospace", fontSize: "0.85rem" }}>{row.key}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{TOKENS(row.total_tokens)}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{row.calls.toLocaleString()}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {row.calls > 0 ? `${Math.round(row.total_tokens / row.calls).toLocaleString()} tok/call` : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--accent)", fontSize: "0.875rem", fontWeight: 600 }}>{USD(row.estimated_cost_usd)}</td>
                  </tr>
                ))}
                {(activeTable === "agent" ? data.by_agent : data.by_model).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Sem dados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ color: "var(--error)", padding: "1rem" }}>Falha ao carregar dados de uso</div>
      )}
    </div>
  );
}
