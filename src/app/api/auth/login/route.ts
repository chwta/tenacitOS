import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Rate limiter config ──────────────────────────────────────────────────────
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000;  // 15 minute lockout after max attempts

interface AttemptRecord {
  count: number;
  windowStart: number;
  lockedUntil?: number;
}

// Separate counters per step per IP
const usernameAttempts = new Map<string, AttemptRecord>();
const passwordAttempts = new Map<string, AttemptRecord>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(
  map: Map<string, AttemptRecord>,
  ip: string
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = map.get(ip);

  if (!record) return { allowed: true };

  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, retryAfterMs: record.lockedUntil - now };
  }

  if (now - record.windowStart > WINDOW_MS) {
    map.delete(ip);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    map.set(ip, record);
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  return { allowed: true };
}

function recordFailure(map: Map<string, AttemptRecord>, ip: string): number {
  const now = Date.now();
  const record = map.get(ip);
  let count = 1;

  if (!record || now - record.windowStart > WINDOW_MS) {
    map.set(ip, { count: 1, windowStart: now });
  } else {
    record.count += 1;
    count = record.count;
    map.set(ip, record);
  }

  return count;
}

function clearAttempts(map: Map<string, AttemptRecord>, ip: string): void {
  map.delete(ip);
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const body = await request.json();
  const { step } = body;

  // ── Step 1: validate username ──────────────────────────────────────────────
  if (step === "username") {
    const { allowed, retryAfterMs } = checkRateLimit(usernameAttempts, ip);
    if (!allowed) {
      const secs = Math.ceil((retryAfterMs ?? LOCKOUT_MS) / 1000);
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429, headers: { "Retry-After": String(secs) } }
      );
    }

    const { username } = body;
    if (username === process.env.ADMIN_USERNAME) {
      clearAttempts(usernameAttempts, ip);
      // Set a short-lived cookie signaling username was verified
      const res = NextResponse.json({ success: true });
      res.cookies.set("auth_step", "username_ok", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60, // 5 minutes to complete password step
        path: "/",
      });
      return res;
    }

    const count = recordFailure(usernameAttempts, ip);
    const remaining = MAX_ATTEMPTS - count;
    return NextResponse.json(
      {
        success: false,
        error: remaining > 0
          ? `Usuário incorreto. ${remaining} tentativa${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
          : "Usuário incorreto. Conta bloqueada temporariamente.",
      },
      { status: 401 }
    );
  }

  // ── Step 2: validate password ──────────────────────────────────────────────
  if (step === "password") {
    // Must have completed step 1
    const stepCookie = request.cookies.get("auth_step");
    if (!stepCookie || stepCookie.value !== "username_ok") {
      return NextResponse.json(
        { success: false, error: "Sessão inválida. Reinicie o login." },
        { status: 400 }
      );
    }

    const { allowed, retryAfterMs } = checkRateLimit(passwordAttempts, ip);
    if (!allowed) {
      const secs = Math.ceil((retryAfterMs ?? LOCKOUT_MS) / 1000);
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429, headers: { "Retry-After": String(secs) } }
      );
    }

    const { password } = body;
    if (password === process.env.ADMIN_PASSWORD) {
      clearAttempts(passwordAttempts, ip);

      const res = NextResponse.json({ success: true });
      // Clear step cookie
      res.cookies.set("auth_step", "", { maxAge: 0, path: "/" });
      // Set auth cookie
      res.cookies.set("mc_auth", process.env.AUTH_SECRET!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      return res;
    }

    const count = recordFailure(passwordAttempts, ip);
    const remaining = MAX_ATTEMPTS - count;
    return NextResponse.json(
      {
        success: false,
        error: remaining > 0
          ? `Senha incorreta. ${remaining} tentativa${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
          : "Senha incorreta. Conta bloqueada temporariamente.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: false, error: "Requisição inválida." }, { status: 400 });
}
