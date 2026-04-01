import { NextRequest, NextResponse } from "next/server";
import { VERTEXOS_API } from "@/lib/vertexos-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${VERTEXOS_API}/api/v1/usage`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/usage] GET:", err);
    return NextResponse.json(
      { today: 0, yesterday: 0, this_month: 0, by_agent: [], by_model: [], daily: [] },
      { status: 502 }
    );
  }
}
