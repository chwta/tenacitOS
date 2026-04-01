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

## Completed — v2.3.0 (Sprint 4)

### Analytics (rewrite)
- [x] Cost dashboard — hoje / ontem / este mês / tokens 30d
- [x] Alerta de budget diário configurável (salvo em localStorage)
- [x] Bar chart de custo diário (30 dias, div-based, sem deps extras)
- [x] Tabela por Agente / por Modelo com eficiência (tok/call)
- [x] Exportar CSV
- [x] `/api/usage` proxy → `GET /api/v1/usage`

### Settings (rewrite)
- [x] 4 tabs: Agentes, Providers, Canais, Sistema
- [x] Editor de agentes inline (nome, emoji, modelo, role)
- [x] Providers com show/hide API key
- [x] Canais (Telegram, Discord, Pico) enable/disable + token
- [x] PATCH /api/config com feedback de sucesso/erro
- [x] `/api/config` proxy (GET + PATCH)

### Knowledge Base
- [x] Upload de documento (txt/md) → chunking automático por parágrafo (~800 chars)
- [x] `POST /api/v1/knowledge/upload` backend handler
- [x] `/api/knowledge/upload` proxy + modal de upload na página

---

## Planned — v2.4.0

### Knowledge Base
- [ ] Knowledge search playground (semantic similarity via pgvector)
- [ ] Suporte a PDF/DOCX no upload (extração de texto)

### Analytics
- [ ] Projeção de custo mensal baseada em tendência dos últimos 7 dias

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

*Version 2.3.0 — 2026-04-01*
