/**
 * Tasks API proxy → VertexOS enterprise endpoints.
 *
 * GET    /api/tasks                 → list tasks (supports ?collaborator_id, ?agent_id, ?status)
 * POST   /api/tasks                 → create task
 * PUT    /api/tasks?id=xxx          → update task status/description
 * DELETE /api/tasks?id=xxx          → delete task
 */
import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tasks = await getTasks({
      collaborator_id: searchParams.get("collaborator_id") ?? undefined,
      agent_id: searchParams.get("agent_id") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[/api/tasks] GET:", err);
    return NextResponse.json({ error: "Failed to load tasks", tasks: [] }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createTask(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const body = await request.json();
    await updateTask(Number(id), body);
    return NextResponse.json({ id: Number(id) });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteTask(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
