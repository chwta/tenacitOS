/**
 * Bridge token sub-resource proxy.
 *
 * GET    /api/collaborators/[id]/tokens            → list active tokens
 * POST   /api/collaborators/[id]/tokens            → issue new JWT token
 * DELETE /api/collaborators/[id]/tokens?tokenId=xx → revoke token
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getCollaboratorTokens,
  issueCollaboratorToken,
  revokeCollaboratorToken,
} from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const tokens = await getCollaboratorTokens(id);
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("[/api/collaborators/[id]/tokens] GET:", err);
    return NextResponse.json({ error: "Failed to load tokens", tokens: [] }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await issueCollaboratorToken(id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const tokenId = new URL(request.url).searchParams.get("tokenId");
  if (!tokenId) return NextResponse.json({ error: "tokenId required" }, { status: 400 });
  try {
    await revokeCollaboratorToken(id, tokenId);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
