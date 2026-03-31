/**
 * VertexOS API client.
 *
 * All server-side Next.js API routes should import from here instead of
 * reading OpenClaw filesystem paths directly.  The base URL is configured
 * via VERTEXOS_API_URL (defaults to http://localhost:18800).
 */

export const VERTEXOS_API = process.env.VERTEXOS_API_URL || "http://localhost:18800";

// ─────────────────────────────────────────────────────────────
// Generic fetch helper
// ─────────────────────────────────────────────────────────────

async function vxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${VERTEXOS_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`VertexOS API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────
// Config (agents come from config.json)
// ─────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name?: string;
  role?: string;
  department?: string;
  skills?: string[];
  model?: { primary?: string };
  subagents?: { allow_agents?: string[] };
  ui?: { emoji?: string; color?: string };
}

export interface VertexConfig {
  agents?: {
    defaults?: { model?: { primary?: string }; max_tool_iterations?: number };
    list?: AgentConfig[];
  };
  channels?: Record<string, unknown>;
  providers?: Record<string, unknown>;
}

export async function getConfig(): Promise<VertexConfig> {
  return vxFetch<VertexConfig>("/api/config");
}

export async function patchConfig(patch: Record<string, unknown>): Promise<void> {
  await vxFetch<void>("/api/config", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ─────────────────────────────────────────────────────────────
// Sessions (stored as JSONL — picoclaw sessions list)
// ─────────────────────────────────────────────────────────────

export interface VxSession {
  id: string;
  updatedAt: number;
  messageCount?: number;
  summary?: string;
  model?: string;
}

export interface VxSessionsResponse {
  sessions: VxSession[];
  total: number;
  offset: number;
  limit: number;
}

export async function getSessions(offset = 0, limit = 50): Promise<VxSessionsResponse> {
  return vxFetch<VxSessionsResponse>(`/api/sessions?offset=${offset}&limit=${limit}`);
}

export async function getSessionMessages(id: string) {
  return vxFetch<{ messages: unknown[]; total: number }>(`/api/sessions/${encodeURIComponent(id)}`);
}

export async function deleteSession(id: string): Promise<void> {
  await vxFetch<void>(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// Enterprise — Departments
// ─────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  manager_agent_id: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getDepartments(): Promise<Department[]> {
  const data = await vxFetch<{ departments: Department[] }>("/api/v1/departments");
  return data.departments;
}

export async function createDepartment(body: {
  id: string;
  name: string;
  manager_agent_id: string;
  description?: string;
}): Promise<{ id: string }> {
  return vxFetch<{ id: string }>("/api/v1/departments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateDepartment(
  id: string,
  body: Partial<Omit<Department, "id" | "created_at" | "updated_at">>
): Promise<void> {
  await vxFetch<void>(`/api/v1/departments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  await vxFetch<void>(`/api/v1/departments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────
// Enterprise — Collaborators
// ─────────────────────────────────────────────────────────────

export interface Collaborator {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  personal_agent_id: string;
  telegram_id: string;
  telegram_username: string;
  timezone: string;
  language: string;
  has_bridge: boolean;
  bridge_online: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCollaborators(): Promise<Collaborator[]> {
  const data = await vxFetch<{ collaborators: Collaborator[] }>("/api/v1/collaborators");
  return data.collaborators;
}

export async function createCollaborator(body: {
  id: string;
  name: string;
  department_id?: string;
  personal_agent_id: string;
  telegram_id?: string;
  telegram_username?: string;
  timezone?: string;
  language?: string;
}): Promise<{ id: string }> {
  return vxFetch<{ id: string }>("/api/v1/collaborators", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCollaborator(
  id: string,
  body: Partial<Omit<Collaborator, "id" | "department_name" | "bridge_online" | "created_at" | "updated_at">>
): Promise<void> {
  await vxFetch<void>(`/api/v1/collaborators/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteCollaborator(id: string): Promise<void> {
  await vxFetch<void>(`/api/v1/collaborators/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────
// Enterprise — Tasks
// ─────────────────────────────────────────────────────────────

export interface Task {
  id: number;
  collaborator_id: string;
  agent_id: string;
  description: string;
  source: string;
  status: "pending" | "in_progress" | "done" | "failed" | "cancelled";
  result: string;
  error_message: string;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export async function getTasks(filters?: {
  collaborator_id?: string;
  agent_id?: string;
  status?: string;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.collaborator_id) params.set("collaborator_id", filters.collaborator_id);
  if (filters?.agent_id) params.set("agent_id", filters.agent_id);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  const data = await vxFetch<{ tasks: Task[] }>(`/api/v1/tasks${qs ? `?${qs}` : ""}`);
  return data.tasks;
}

// ─────────────────────────────────────────────────────────────
// Enterprise — Usage
// ─────────────────────────────────────────────────────────────

export interface UsageByKey {
  key: string;
  total_tokens: number;
  estimated_cost_usd: number;
  calls: number;
}

export interface UsageDaily {
  date: string;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface UsageSummary {
  today: number;
  yesterday: number;
  this_month: number;
  by_agent: UsageByKey[];
  by_model: UsageByKey[];
  daily: UsageDaily[];
}

export async function getUsage(): Promise<UsageSummary> {
  return vxFetch<UsageSummary>("/api/v1/usage");
}

// ─────────────────────────────────────────────────────────────
// Enterprise — Agent Status
// ─────────────────────────────────────────────────────────────

export interface AgentStatus {
  agent_id: string;
  last_seen: string;
  status: "online" | "idle" | "offline";
  today_tokens: number;
  today_calls: number;
  active_tasks: number;
}

export async function getAgentsStatus(): Promise<AgentStatus[]> {
  const data = await vxFetch<{ agents: AgentStatus[] }>("/api/v1/agents/status");
  return data.agents;
}
