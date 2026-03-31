/**
 * Departments API proxy → VertexOS enterprise endpoints.
 *
 * GET    /api/departments          → list departments
 * POST   /api/departments          → create department
 * PUT    /api/departments?id=xxx   → update department
 * DELETE /api/departments?id=xxx   → delete department
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const departments = await getDepartments();
    return NextResponse.json({ departments });
  } catch (err) {
    console.error("[/api/departments] GET:", err);
    return NextResponse.json({ error: "Failed to load departments", departments: [] }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createDepartment(body);
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
    await updateDepartment(id, body);
    return NextResponse.json({ id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteDepartment(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
