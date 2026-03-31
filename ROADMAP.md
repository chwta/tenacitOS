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

## In Progress — v2.1.0 (Sprint 2)

### New Pages
- [ ] `/departments` — CRUD page for managing organizational structure
- [ ] `/tasks` — task board (kanban: pending / in-progress / done / blocked)
- [ ] `/agents/:id` — agent detail (memory, sessions, cron jobs, skills, token history)

### Improvements
- [ ] Settings page wired to VertexOS config API (edit agents, models, channels)
- [ ] Token issuance UI — generate VertexBridge JWT for a collaborator
- [ ] Token revocation from Collaborators page
- [ ] Real-time agent status via SSE (replace polling)

---

## Planned — v2.2.0

### Analytics
- [ ] Cost forecasting — projected monthly spend
- [ ] Per-agent efficiency score (output value / token cost)
- [ ] Spend alerts — configurable daily budget threshold
- [ ] Export reports (CSV / PDF)

### Knowledge Base
- [ ] Document upload UI → VertexOS RAG ingestion
- [ ] Knowledge search playground
- [ ] Scope assignment per document (global / department / agent)

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

*Version 2.0.0 — 2026-03-31*
