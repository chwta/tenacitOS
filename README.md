# TenacitOS v2.0.0

Web control panel for [VertexOS](../vertexos/README.md) — the enterprise multi-agent platform. Built with Next.js 15, React 19, and Tailwind CSS v4.

> **TenacitOS** connects to your VertexOS backend via REST API. All agent data, sessions, collaborators, costs, and organizational structure are stored in PostgreSQL — no filesystem access, no OpenClaw dependency.

---

## Features

- **Dashboard** — activity overview, agent status, today's cost summary
- **Agents** — all agents with live status (online/idle/offline), today's token usage, model, and active tasks
- **Collaborators** — CRUD management with department filter, bridge online status, 30s auto-refresh
- **Office 3D** — interactive 3D office with one desk per agent (React Three Fiber)
- **Sessions** — full session history from PostgreSQL with transcript viewer
- **Costs & Analytics** — real cost data from `usage_log` table (by agent, by model, daily trend)
- **Cron Jobs** — visual cron manager with weekly timeline and run history
- **Activity Feed** — real-time log of agent actions with heatmap
- **Memory Browser** — explore and search agent memory
- **File Browser** — navigate workspace files with preview
- **System Monitor** — real-time VPS metrics (CPU, RAM, Disk, Network)
- **Terminal** — read-only terminal for safe status commands
- **Skills** — installed skills per agent
- **Settings** — instance configuration

---

## Requirements

- **Node.js** 18+ (tested with v22)
- **VertexOS** running and accessible (default: `http://localhost:18800`)

---

## How it works

TenacitOS is a pure API client. It calls the VertexOS web backend for all data:

```
VertexOS Backend (port 18800)
├── GET  /api/v1/agents/status     → Agents page
├── GET  /api/v1/collaborators     → Collaborators page
├── GET  /api/v1/departments       → Department dropdowns
├── GET  /api/v1/tasks             → Task tracking
├── GET  /api/v1/usage             → Costs page
├── GET  /api/sessions             → Sessions page
└── GET  /api/config               → Dashboard config
```

All requests are proxied through Next.js API routes (`/api/*`) — the browser never calls VertexOS directly.

---

## Installation

### 1. Clone

```bash
git clone https://github.com/chwta/tenacitos.git
cd tenacitos
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Auth (required)
ADMIN_PASSWORD=your-secure-password
AUTH_SECRET=generate-a-random-32-char-string

# VertexOS backend URL
VERTEXOS_API_URL=http://localhost:18800

# Branding
NEXT_PUBLIC_AGENT_NAME=VertexOS Control
NEXT_PUBLIC_AGENT_EMOJI=🏢
NEXT_PUBLIC_AGENT_DESCRIPTION=Enterprise virtual workforce dashboard
NEXT_PUBLIC_COMPANY_NAME=YOUR COMPANY, INC.
NEXT_PUBLIC_APP_TITLE=VertexOS Control
NEXT_PUBLIC_OWNER_USERNAME=your-username
NEXT_PUBLIC_OWNER_EMAIL=your-email@example.com
```

Generate secrets:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 18   # ADMIN_PASSWORD
```

### 3. Run

```bash
# Development
npm run dev
# → http://localhost:3000

# Production
npm run build
npm start
```

Login at `http://localhost:3000` with the `ADMIN_PASSWORD` you set.

---

## Production Deployment

### PM2

```bash
npm run build
pm2 start npm --name "tenacitos" -- start
pm2 save
pm2 startup
```

### systemd

```ini
[Unit]
Description=TenacitOS — VertexOS Control Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/tenacitos
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Reverse proxy — Caddy

```caddy
control.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## Project Structure

```
tenacitos/
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Dashboard pages (protected)
│   │   ├── api/              # API routes (proxy to VertexOS)
│   │   ├── login/            # Login page
│   │   └── office/           # 3D office
│   ├── components/
│   │   ├── TenacitOS/        # OS-style UI shell (topbar, dock, status bar)
│   │   └── Office3D/         # React Three Fiber 3D office
│   ├── config/
│   │   └── branding.ts       # Branding constants (reads from env vars)
│   └── lib/
│       ├── vertexos-client.ts  # VertexOS API client
│       └── pricing.ts          # Model pricing table
├── data/                     # Local JSON data (cron jobs, activities, notifications)
├── docs/                     # Extended documentation
├── public/
│   └── models/               # GLB avatar models
└── middleware.ts             # Auth guard for all routes
```

---

## Security

- All routes require authentication — handled by `src/middleware.ts`
- `/api/auth/login` and `/api/health` are the only public endpoints
- Login is rate-limited: 5 failed attempts → 15-minute lockout per IP
- Auth cookie is `httpOnly`, `sameSite: lax`, `secure` in production
- Terminal API uses a strict command allowlist

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| 3D | React Three Fiber + Drei |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | VertexOS REST API (PostgreSQL) |
| Runtime | Node.js 22 |

---

## License

MIT
