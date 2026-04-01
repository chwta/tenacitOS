"use client";

import { BRANDING } from "@/config/branding";

interface Workflow {
  id: string;
  emoji: string;
  name: string;
  description: string;
  schedule: string;
  steps: string[];
  status: "active" | "inactive";
  trigger: "cron" | "demand";
}

const WORKFLOWS: Workflow[] = [
  {
    id: "social-radar",
    emoji: "🔭",
    name: "Social Radar",
    description: "Monitora menções, oportunidades de colaboração e conversas relevantes em redes sociais e fóruns.",
    schedule: "9h30 e 17h30 (todos os dias)",
    trigger: "cron",
    status: "active",
    steps: [
      `Busca menções de ${BRANDING.twitterHandle} no Twitter/X, LinkedIn e Instagram`,
      "Monitora fóruns relevantes do setor",
      "Detecta oportunidades de parceria e colaboração",
      "Envia resumo por Telegram se houver algo relevante",
    ],
  },
  {
    id: "noticias-ia",
    emoji: "📰",
    name: "Notícias IA e Tech",
    description: "Resume as notícias mais relevantes de IA e tecnologia para começar o dia bem informado.",
    schedule: "7h45 (todos os dias)",
    trigger: "cron",
    status: "active",
    steps: [
      "Lê feeds de IA, desenvolvimento web e ferramentas",
      "Filtra e seleciona 5-7 notícias mais relevantes",
      "Gera resumo estruturado com link e contexto",
      "Envia digest por Telegram",
    ],
  },
  {
    id: "trend-monitor",
    emoji: "🔥",
    name: "Monitor de Tendências",
    description: "Radar de tendências no nicho tech. Detecta temas virais antes de explodirem para aproveitar a onda de conteúdo.",
    schedule: "7h, 10h, 15h e 20h (todos os dias)",
    trigger: "cron",
    status: "active",
    steps: [
      "Monitora trending topics no Twitter/X relacionados a tech",
      "Busca no Hacker News, dev.to e GitHub Trending",
      "Avalia relevância para o setor de atuação",
      "Notifica imediatamente se detectar algo urgente",
      "Sugere ângulo de conteúdo se o tema tiver potencial",
    ],
  },
  {
    id: "newsletter-digest",
    emoji: "📬",
    name: "Digest de Newsletters",
    description: "Digest curado das newsletters do dia. Consolida o melhor das assinaturas em um resumo acionável.",
    schedule: "20h (todos os dias)",
    trigger: "cron",
    status: "active",
    steps: [
      "Acessa e-mail e busca newsletters recebidas no dia",
      "Filtra por remetentes relevantes (tech, IA, produtividade)",
      "Extrai os pontos principais de cada newsletter",
      "Gera digest estruturado por categorias",
      "Envia resumo por Telegram",
    ],
  },
  {
    id: "email-categorization",
    emoji: "📧",
    name: "Categorização de E-mails",
    description: "Categoriza e resume os e-mails do dia para começar a jornada sem anxiety de inbox.",
    schedule: "7h45 (todos os dias)",
    trigger: "cron",
    status: "active",
    steps: [
      "Lê e-mails não lidos do dia",
      "Categoriza: urgente / parcerias / faturas / newsletters / outros",
      "Resume cada categoria com ação recomendada",
      "Detecta e-mails com pendências financeiras em atraso",
      "Envia resumo estruturado por Telegram",
    ],
  },
  {
    id: "git-backup",
    emoji: "🔄",
    name: "Backup Automático",
    description: "Auto-commit e push do workspace a cada 4 horas para garantir que nada seja perdido.",
    schedule: "A cada 4h",
    trigger: "cron",
    status: "active",
    steps: [
      "Verifica se há alterações no workspace",
      "Se houver: git add -A",
      "Gera mensagem de commit automática com timestamp e resumo das mudanças",
      "git push para o repositório remoto",
      "Silencioso se não houver alterações — notifica apenas em caso de erro",
    ],
  },
  {
    id: "advisory-board",
    emoji: "🏛️",
    name: "Conselho Consultivo",
    description: "Agentes consultores com personalidades e memórias próprias. Consulte qualquer advisor ou convoque o board completo.",
    schedule: "Sob demanda",
    trigger: "demand",
    status: "active",
    steps: [
      "Usuário envia /cfo, /cmo, /cto, /juridico, /growth ou /produto",
      "Agente carrega o skill correspondente",
      "Lê o arquivo de memória do advisor (memory/advisors/)",
      "Responde na voz e personalidade do advisor com contexto da empresa",
      "Atualiza o arquivo de memória com o aprendido na consulta",
      "/board convoca todos os advisors em sequência e compila um board meeting completo",
    ],
  },
  {
    id: "nightly-evolution",
    emoji: "🌙",
    name: "Evolução Noturna",
    description: "Sessão autônoma noturna que implementa melhorias no painel conforme o ROADMAP ou cria features novas úteis.",
    schedule: "3h (toda noite)",
    trigger: "cron",
    status: "inactive",
    steps: [
      "Lê ROADMAP.md para selecionar a próxima feature",
      "Se não houver features claras, analisa o estado atual e propõe algo útil",
      "Implementa a feature completa (código, testes se aplicável, UI)",
      "Verifica que o build do Next.js não falha",
      "Notifica por Telegram com o resumo do que foi implementado",
    ],
  },
];

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: status === "active" ? "var(--positive)" : "var(--text-muted)",
      }} />
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: "10px",
        fontWeight: 600,
        color: status === "active" ? "var(--positive)" : "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {status === "active" ? "Ativo" : "Inativo"}
      </span>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: "cron" | "demand" }) {
  return (
    <div style={{
      padding: "2px 7px",
      backgroundColor: trigger === "cron"
        ? "rgba(59, 130, 246, 0.12)"
        : "rgba(168, 85, 247, 0.12)",
      border: `1px solid ${trigger === "cron" ? "rgba(59, 130, 246, 0.25)" : "rgba(168, 85, 247, 0.25)"}`,
      borderRadius: "5px",
      fontFamily: "var(--font-body)",
      fontSize: "10px",
      fontWeight: 600,
      color: trigger === "cron" ? "#60a5fa" : "var(--accent)",
      letterSpacing: "0.4px",
      textTransform: "uppercase" as const,
    }}>
      {trigger === "cron" ? "⏱ Cron" : "⚡ Demanda"}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "-1px",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}>
          Workflows
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          {WORKFLOWS.filter(w => w.status === "active").length} fluxos ativos · {WORKFLOWS.filter(w => w.trigger === "cron").length} crons automáticos · {WORKFLOWS.filter(w => w.trigger === "demand").length} sob demanda
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total de workflows", value: WORKFLOWS.length, color: "var(--text-primary)" },
          { label: "Crons ativos", value: WORKFLOWS.filter(w => w.trigger === "cron" && w.status === "active").length, color: "#60a5fa" },
          { label: "Sob demanda", value: WORKFLOWS.filter(w => w.trigger === "demand").length, color: "var(--accent)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "16px 20px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            minWidth: "140px",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "28px",
              fontWeight: 700,
              color: stat.color,
              letterSpacing: "-1px",
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {WORKFLOWS.map((workflow) => (
          <div key={workflow.id} style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  border: "1px solid var(--border-strong)",
                  flexShrink: 0,
                }}>
                  {workflow.emoji}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.3px",
                    marginBottom: "2px",
                  }}>
                    {workflow.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TriggerBadge trigger={workflow.trigger} />
                    <StatusBadge status={workflow.status} />
                  </div>
                </div>
              </div>
              {/* Schedule */}
              <div style={{
                padding: "6px 12px",
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}>
                🕐 {workflow.schedule}
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}>
              {workflow.description}
            </p>

            {/* Steps */}
            <div style={{
              backgroundColor: "var(--surface-elevated)",
              borderRadius: "10px",
              padding: "12px 16px",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.7px",
                marginBottom: "8px",
              }}>
                Etapas
              </div>
              <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {workflow.steps.map((step, i) => (
                  <li key={i} style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
