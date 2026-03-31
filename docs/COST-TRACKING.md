# Cost Tracking

TenacitOS displays real cost analytics sourced directly from the VertexOS `usage_log` PostgreSQL table. No scripts, no SQLite, no manual data collection — costs are recorded by VertexOS automatically on every conversation turn.

---

## How It Works

1. **Recording**: VertexOS writes a row to `usage_log` for every session turn — agent ID, model, input tokens, output tokens, and calculated cost.
2. **API**: The VertexOS web backend exposes `GET /api/v1/usage` with aggregations pre-computed in SQL.
3. **Dashboard**: TenacitOS's `/api/costs` route calls `getUsage()` from `vertexos-client.ts` and maps the response to the shape expected by the Costs page components.

---

## Data Available

The `GET /api/v1/usage` endpoint returns:

```json
{
  "today":     0.80,
  "yesterday": 1.25,
  "month":     12.50,
  "byAgent": [
    { "agent_id": "main", "total_cost": 5.50, "total_tokens": 450000 }
  ],
  "byModel": [
    { "model": "anthropic/claude-sonnet-4-6", "total_cost": 8.30, "total_tokens": 890000 }
  ],
  "daily": [
    { "date": "2026-03-31", "total_cost": 0.80, "input_tokens": 12000, "output_tokens": 8000 }
  ]
}
```

The `/api/costs` route adds:
- `projected` — estimated monthly cost based on days elapsed
- `budget` — configurable budget cap (default: $100)
- Percentage breakdowns per agent and model

---

## Model Pricing

Pricing is defined in `src/lib/pricing.ts`:

| Model | Input ($/M tokens) | Output ($/M tokens) |
|---|---|---|
| claude-opus-4-6 | $15.00 | $75.00 |
| claude-sonnet-4-6 | $3.00 | $15.00 |
| claude-haiku-4-5 | $0.80 | $4.00 |
| gemini-flash | $0.15 | $0.60 |
| gemini-pro | $1.25 | $5.00 |

VertexOS computes costs at write time using the same pricing table in `pkg/usage/model.go`. The dashboard uses `pricing.ts` only for display formatting.

---

## Database Schema

The `usage_log` table (created by migration `007`):

```sql
CREATE TABLE usage_log (
  id           BIGSERIAL PRIMARY KEY,
  session_id   TEXT NOT NULL,
  agent_id     TEXT NOT NULL,
  model        TEXT NOT NULL,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(10,6) NOT NULL DEFAULT 0,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Querying Directly (PostgreSQL)

**Total cost today:**
```sql
SELECT SUM(cost_usd)
FROM usage_log
WHERE recorded_at >= CURRENT_DATE;
```

**Cost by agent (last 30 days):**
```sql
SELECT agent_id, ROUND(SUM(cost_usd)::numeric, 4) AS cost
FROM usage_log
WHERE recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_id
ORDER BY cost DESC;
```

**Daily trend:**
```sql
SELECT DATE(recorded_at) AS day, ROUND(SUM(cost_usd)::numeric, 4) AS cost
FROM usage_log
WHERE recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
```

---

## Troubleshooting

**Costs page shows zeros**

- Verify `VERTEXOS_API_URL` is set correctly in `.env.local`
- Confirm VertexOS is running: `curl http://localhost:18800/api/v1/usage`
- Confirm `VERTEXOS_DB_DSN` is set in VertexOS's `.env`
- Check VertexOS logs for database connection errors

**Costs seem wrong**

- Update pricing in `src/lib/pricing.ts` to match current OpenRouter rates
- The source of truth for stored costs is VertexOS's `pkg/usage/model.go`
