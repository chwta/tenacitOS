/**
 * GET /api/sessions          → list sessions via VertexOS API
 * GET /api/sessions?id=xxx   → get messages for a specific session
 *
 * VertexOS stores sessions as JSONL files managed by web/backend/api/session.go.
 * We proxy those endpoints instead of calling `openclaw sessions list --json`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessions, getSessionMessages } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (sessionId) {
    try {
      const data = await getSessionMessages(sessionId);
      return NextResponse.json(data);
    } catch (err) {
      console.error("[/api/sessions] messages error:", err);
      return NextResponse.json(
        { error: "Failed to load session messages", messages: [] },
        { status: 502 }
      );
    }
  }

  try {
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const data = await getSessions(offset, limit);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/sessions] list error:", err);
    return NextResponse.json(
      { error: "Failed to load sessions", sessions: [], total: 0 },
      { status: 502 }
    );
  }
}
