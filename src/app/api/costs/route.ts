/**
 * GET  /api/costs          → usage summary from VertexOS PostgreSQL
 * POST /api/costs          → (stub) budget update — not yet persisted
 */
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getUsage } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

const DEFAULT_BUDGET = 100.0;

export async function GET(_request: NextRequest) {
  try {
    const usage = await getUsage();

    // Map VertexOS format → shape expected by the existing cost page components
    const byAgent = usage.by_agent.map((a) => ({
      agent: a.key,
      totalTokens: a.total_tokens,
      cost: a.estimated_cost_usd,
      calls: a.calls,
    }));

    const byModel = usage.by_model.map((m) => ({
      model: m.key,
      totalTokens: m.total_tokens,
      cost: m.estimated_cost_usd,
      calls: m.calls,
    }));

    const daily = usage.daily.map((d) => ({
      date: d.date,
      cost: d.estimated_cost_usd,
      tokens: d.total_tokens,
    }));

    // Projected monthly cost: proportional from days elapsed this month
    const dayOfMonth = new Date().getDate();
    const projected =
      dayOfMonth > 0 ? (usage.this_month / dayOfMonth) * 30 : 0;

    return NextResponse.json({
      today: usage.today,
      yesterday: usage.yesterday,
      thisMonth: usage.this_month,
      lastMonth: 0, // not tracked — would need additional query
      projected: Math.round(projected * 10000) / 10000,
      budget: DEFAULT_BUDGET,
      byAgent,
      byModel,
      daily,
      hourly: [], // not currently tracked at hourly granularity
    });
  } catch (err) {
    console.error("[/api/costs]", err);
    // Return zeros so the UI still renders without crashing
    return NextResponse.json({
      today: 0,
      yesterday: 0,
      thisMonth: 0,
      lastMonth: 0,
      projected: 0,
      budget: DEFAULT_BUDGET,
      byAgent: [],
      byModel: [],
      daily: [],
      hourly: [],
      message: "VertexOS usage data unavailable. Check VERTEXOS_API_URL and VERTEXOS_DB_DSN.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: persist budget/alerts to VertexOS config
    return NextResponse.json({ success: true, budget: body.budget, alerts: body.alerts });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
