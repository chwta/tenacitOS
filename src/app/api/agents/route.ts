/**
 * GET /api/agents
 *
 * Reads agents from VertexOS config.json via the VertexOS API, then enriches
 * each agent with live status data from the enterprise usage endpoint.
 */
import { NextResponse } from "next/server";
import {
  getConfig,
  getAgentsStatus,
  type AgentConfig,
  type AgentStatus,
} from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

// Stable default colours for agents without explicit ui.color
const PALETTE = [
  "#ff6b35", "#4ecdc4", "#45b7d1", "#96ceb4",
  "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd",
];

interface AgentOut {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  department: string;
  model: string;
  skills: string[];
  allowAgents: string[];
  status: "online" | "idle" | "offline";
  lastSeen: string | null;
  todayTokens: number;
  todayCalls: number;
  activeTasks: number;
}

export async function GET() {
  try {
    const [config, statusList] = await Promise.all([
      getConfig(),
      getAgentsStatus().catch(() => [] as AgentStatus[]),
    ]);

    const statusMap = new Map<string, AgentStatus>(
      statusList.map((s) => [s.agent_id, s])
    );

    const defaultModel =
      config.agents?.defaults?.model?.primary ?? "unknown";

    const agentList: AgentConfig[] = config.agents?.list ?? [];

    const agents: AgentOut[] = agentList.map((a, idx) => {
      const live = statusMap.get(a.id);
      return {
        id: a.id,
        name: a.name ?? a.id,
        emoji: a.ui?.emoji ?? "🤖",
        color: a.ui?.color ?? PALETTE[idx % PALETTE.length],
        role: a.role ?? "general",
        department: a.department ?? "",
        model: a.model?.primary ?? defaultModel,
        skills: a.skills ?? [],
        allowAgents: a.subagents?.allow_agents ?? [],
        status: live?.status ?? "offline",
        lastSeen: live?.last_seen ?? null,
        todayTokens: live?.today_tokens ?? 0,
        todayCalls: live?.today_calls ?? 0,
        activeTasks: live?.active_tasks ?? 0,
      };
    });

    return NextResponse.json({ agents });
  } catch (err) {
    console.error("[/api/agents]", err);
    return NextResponse.json(
      { error: "Failed to load agents from VertexOS" },
      { status: 502 }
    );
  }
}
