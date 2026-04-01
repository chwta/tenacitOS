import { NextRequest, NextResponse } from "next/server";
import { getKnowledge, createKnowledgeChunk, deleteKnowledgeChunk } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const result = await getKnowledge({
      q: searchParams.get("q") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/knowledge] GET:", err);
    return NextResponse.json({ error: "Failed to load knowledge", chunks: [], total: 0 }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createKnowledgeChunk(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteKnowledgeChunk(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
