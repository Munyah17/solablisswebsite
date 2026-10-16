# Solabliss — Renewable Energy Web Platform

Full webapp for Solabliss, an engineering company specialising in renewable energy consulting, contracting, tendering, sizing, design, installation and upgrades of domestic, commercial and industrial solar systems.

## Stack

- **Backend:** Node.js + Express, built-in SQLite (`node:sqlite`) — zero native deps
- **Auth:** HMAC-signed bearer tokens, bcrypt password hashing
- **Frontend:** Vanilla JS + Tailwind (CDN), single-page public site + admin panel
- **Estimator:** rule-based AI-style sizing engine (`estimator.js`) — energy audit → inverter/battery/array sizing → priced BOM with explainable rationale

## Features

### Public
- Services, **personalised solutions** + lead capture (name, phone, email, address, need)
- **Projects page** (`/projects.html`): towns/cities → sites → detail (what client had, needed, installed, cost, date)
- **Energy audit & sizing wizard** → instant engineered estimate with full BOM
- **AI estimator** — natural-language load detection, sizing and pricing
- **WhatsApp sending** via `wa.me`, client portal (own quotes & invoices)
- Visitor analytics tracking (page views + session-tagged hits)

### Admin (`/admin.html`)
- **Dashboard, visitor analytics** (views, uniques, daily chart, top pages/referrers)
- **Lead generation** — captured from lead form, sizing audits and contact form; pipeline statuses, CSV export
- **Newsletter blast** — compose + audience selection, logged with recipient list (plug in SMTP for real delivery)
- **SMS alerts** — single + blast-to-leads; queues until `sms_gateway_url`/`sms_gateway_key` configured in Settings → Integrations
- **Quotations & invoices** — statuses, convert quote→invoice, payments, **printable PDF documents**
- **Job reports** — printable completion report per site (before/need/scope/equipment/commercials + sign-off)
- **Job assessments** — site survey records (roof, shading, phase, findings, recommendation) + printable report
- **Financial & job records** — totals, monthly revenue/job value, pipeline, CSV export
- **Net metering** — import/export kWh readings with net value, CSV export
- **Future Energy** — admin-role-only vision board (energy sharing, community energy banks, micro-grids, energy exports, efficiency) behind a `future_features` flag
- User management, appliance load DB, messages, settings & pricing engine

## Run

```powershell
npm install
npm start
# → http://localhost:3000        admin: /admin.html
```

**Default admin:** `admin@solabliss.com` / `admin123` (change in User Management)

## Env

- `PORT` — default 3000
- `SOLABLISS_SECRET` — token signing secret (auto-generated if unset; set it in production)

Database file: `solabliss.db` (auto-created & seeded on first run).
