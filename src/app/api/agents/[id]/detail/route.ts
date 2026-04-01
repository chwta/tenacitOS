import { NextRequest, NextResponse } from "next/server";
import { getAgentDetail } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const detail = await getAgentDetail(id);
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[/api/agents/[id]/detail] GET:", err);
    return NextResponse.json({ error: "Failed to load agent detail" }, { status: 502 });
  }
}
