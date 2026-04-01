import { NextRequest, NextResponse } from "next/server";
import { VERTEXOS_API } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${VERTEXOS_API}/api/config`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/config] GET:", err);
    return NextResponse.json({ error: "Failed to load config" }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${VERTEXOS_API}/api/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
