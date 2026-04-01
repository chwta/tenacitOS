# TenacitOS Roadmap

> Web control panel for VertexOS. Version 2.0.0 — migrated from OpenClaw to VertexOS API.

---

## Completed — v2.0.0 (Sprint 1)

### VertexOS Migration
- [x] Replaced all OpenClaw filesystem/CLI calls with VertexOS API
- [x] `vertexos-client.ts` — centralized API client with TypeScript interfaces
- [x] `/api/agents` — live status from `GET /api/v1/agents/status` (online/idle/offline, today's tokens)
- [x] `/api/costs` — real cost data from PostgreSQL `usage_log` table (no SQLite)
- [x] `/api/sessions` — sessions from VertexOS PostgreSQL
- [x] `/api/collaborators` — full CRUD proxy to VertexOS enterprise API
- [x] `/api/departments` — CRUD proxy to VertexOS enterprise API
- [x] `.env.example` updated with `VERTEXOS_API_URL`

### New Pages
- [x] `/collaborators` — CRUD page with department filter, bridge online status (Wifi/WifiOff), 30s polling, create/edit modal, delete confirmation

### Navigation
- [x] Collaborators added to Sidebar and Dock
- [x] Footer updated from "OpenClaw Agent" to "VertexOS"

---

## Completed — v2.1.0 (Sprint 2)

### New Pages
- [x] `/departments` — CRUD page for managing organizational structure
- [x] `/tasks` — kanban board (5 cols: pending / in_progress / done / failed / cancelled, 15s auto-refresh)
- [x] Token issuance UI — generate VertexBridge JWT for a collaborator (`/api/collaborators/[id]/tokens`)

### Backend
- [x] Tasks POST/PUT/DELETE handlers in `enterprise.go`
- [x] Collaborator token endpoints (GET/POST/DELETE)

### Navigation
- [x] Departments and Tarefas added to Sidebar and Dock

---

## Completed — v2.2.0 (Sprint 3)

### Agent Detail
- [x] `/agents/[id]` — hero card (status, last seen), stats grid (tokens today/month, calls, tasks), tabbed view (Tarefas / Memória)
- [x] `GET /api/v1/agents/:id` — backend handler with usage stats, task counts, memory facts, recent tasks

### Knowledge Base
- [x] `/knowledge` — search + scope filter, paginated list, split-panel detail view, create modal, delete confirmation
- [x] `GET/POST/DELETE /api/v1/knowledge` — backend with real OFFSET pagination and total count
- [x] Knowledge Base added to Sidebar and Dock

### Branding
- [x] OpenClaw → VertexOS across all 30+ files (PT-BR UI strings, removed lobster emoji)

---

## Planned — v2.3.0

### Analytics
- [ ] Cost forecasting — projected monthly spend
- [ ] Per-agent efficiency score (output value / token cost)
- [ ] Spend alerts — configurable daily budget threshold
- [ ] Export reports (CSV / PDF)

### Knowledge Base
- [ ] Document upload UI → VertexOS RAG ingestion (multipart/form-data → chunking pipeline)
- [ ] Knowledge search playground (semantic similarity, not just ILIKE)

### Office 3D Improvements
- [ ] Agent activity animations (typing, thinking, error states)
- [ ] Sub-agent spawn visualization
- [ ] Multi-floor building (office, server room, archive, control tower)
- [ ] Customizable themes (modern, retro, cyberpunk)

---

## Future — v3.0.0

### Multi-tenant Support
- [ ] Tenant switcher in top bar
- [ ] Per-tenant branding and configuration
- [ ] Team user management (invite collaborators with dashboard access)

### Agent Intelligence
- [ ] Model playground — test prompts across models, compare cost/quality
- [ ] Smart suggestions — "switch to Haiku for heartbeats", "this cron is failing often"
- [ ] Knowledge graph viewer — visual map of agent memory

### Workflow Builder
- [ ] Visual drag-and-drop multi-agent task orchestration
- [ ] Template workflows
- [ ] Dependency tracking between tasks

---

*Version 2.2.0 — 2026-04-01*
