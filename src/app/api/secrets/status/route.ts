import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.VERTEXOS_API_URL || 'http://localhost:18800';

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND}/api/v1/secrets/status`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ status: {} }, { status: 200 });
  }
}
