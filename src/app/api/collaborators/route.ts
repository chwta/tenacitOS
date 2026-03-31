/**
 * Collaborators API proxy → VertexOS enterprise endpoints.
 *
 * GET    /api/collaborators               → list all collaborators
 * POST   /api/collaborators               → create collaborator
 * PUT    /api/collaborators?id=xxx        → update collaborator
 * DELETE /api/collaborators?id=xxx        → delete collaborator
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getCollaborators,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collaborators = await getCollaborators();
    return NextResponse.json({ collaborators });
  } catch (err) {
    console.error("[/api/collaborators] GET:", err);
    return NextResponse.json(
      { error: "Failed to load collaborators", collaborators: [] },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createCollaborator(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }
  try {
    const body = await request.json();
    await updateCollaborator(id, body);
    return NextResponse.json({ id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }
  try {
    await deleteCollaborator(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
