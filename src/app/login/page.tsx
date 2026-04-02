"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, User, Lock, AlertCircle, ChevronRight } from "lucide-react";

function LoginForm() {
  const [step, setStep] = useState<"username" | "password">("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "username", username }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("password");
      } else {
        setError(data.error || "Usuário incorreto");
      }
    } catch {
      setError("Erro de conexão");
    }

    setLoading(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "password", password }),
      });

      const data = await res.json();

      if (data.success) {
        const from = searchParams.get("from") || "/";
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || "Senha incorreta");
      }
    } catch {
      setError("Erro de conexão");
    }

    setLoading(false);
  };

  return (
    <div
      className="rounded-xl p-10"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-7 h-7" style={{ color: "var(--accent)" }} />
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            VertexOS
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {step === "username" ? "Digite seu usuário para continuar" : "Digite sua senha para acessar"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
          style={{
            backgroundColor: "rgba(var(--accent-rgb, 99,102,241), 0.12)",
            color: "var(--accent)",
          }}
        >
          <User className="w-3 h-3" />
          Usuário
        </div>
        <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        <div
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
          style={{
            backgroundColor: step === "password"
              ? "rgba(var(--accent-rgb, 99,102,241), 0.12)"
              : "var(--card-elevated)",
            color: step === "password" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          <Lock className="w-3 h-3" />
          Senha
        </div>
      </div>

      {/* Step 1: Username */}
      {step === "username" && (
        <form onSubmit={handleUsername} className="space-y-5">
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="w-full pl-11 pr-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--card-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="Usuário"
              required
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
              style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </form>
      )}

      {/* Step 2: Password */}
      {step === "password" && (
        <form onSubmit={handlePassword} className="space-y-5">
          {/* Confirmed username (read-only) */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}>
            <User className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-secondary)" }}>{username}</span>
          </div>

          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full pl-11 pr-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--card-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="Senha"
              required
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
              style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep("username"); setError(""); setPassword(""); }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--card-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
        VertexOS Control Panel
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 -ml-64"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div
              className="rounded-xl p-10 animate-pulse"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="h-8 bg-gray-700 rounded mb-4" />
              <div className="h-12 bg-gray-700 rounded mb-4" />
              <div className="h-10 bg-gray-700 rounded" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
