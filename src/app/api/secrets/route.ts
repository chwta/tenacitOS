/**
 * Secrets proxy — forwards to VertexOS backend /api/v1/secrets
 * GET    /api/secrets          → list secrets (masked)
 * GET    /api/secrets/status   → which secrets are set
 * PUT    /api/secrets          → upsert a secret
 * DELETE /api/secrets          → delete a secret
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.VERTEXOS_API_URL || 'http://localhost:18800';

async function proxy(req: NextRequest, path: string) {
  const url = `${BACKEND}/api/v1${path}`;
  const init: RequestInit = {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }
  try {
    const res = await fetch(url, init);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  return proxy(req, '/secrets');
}
export async function PUT(req: NextRequest) {
  return proxy(req, '/secrets');
}
export async function DELETE(req: NextRequest) {
  return proxy(req, '/secrets');
}
