# FreelanceRadar

A personal local web tool that aggregates freelance opportunities from multiple platforms into a single unified interface. Filter, score, and generate AI-powered proposals — all running on `localhost`.

---

## Getting Started

### Requirements

- Node.js 20+
- npm 10+

### 1. Clone the repository

```bash
git clone https://github.com/DustinCordeiroCL/freelance-radar.git
cd freelance-radar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required for match scoring and proposal generation
ANTHROPIC_API_KEY=sk-ant-...

# Required for the Freelancer.com connector
FREELANCER_API_TOKEN=your_token_here

# SQLite database path
DATABASE_URL="file:./dev.db"
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Collecting opportunities

Click **"Collect now"** in the dashboard header to trigger an immediate collection from all active connectors. The scheduler also runs collection automatically in the background (default: every 30 minutes for RSS/API, every 3 hours for scraping).

### Match score

Every new project is automatically scored (0–100) by Claude. The badge shows green (≥70), yellow (40–69), or red (<40). Scoring runs in a sequential queue to avoid rate limit issues.

### Proposals

Click the document icon on any project card to open the proposal modal. You can generate, edit, save, copy, and regenerate proposals. Proposals are written in the same language as the project description.

### Proposal status

Use the dropdown on each card to track project state: **No status → Em negociação → Em desenvolvimento → Concluída**.

### Profile

Upload your CV (PDF) in the **Profile** page to extract your skills and job titles. These are used to filter collected projects by relevance and to personalize AI scoring and proposals.

### Settings

Configure collection intervals, active connectors, follow-up notification threshold, score alert threshold, and your Anthropic API key.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key (*can also be set in Settings UI) |
| `FREELANCER_API_TOKEN` | No | Freelancer.com API token |
| `DATABASE_URL` | Yes | SQLite path — `file:./dev.db` |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── favorites/page.tsx    # Favorites
│   ├── earnings/page.tsx     # Earnings tracker
│   ├── profile/page.tsx      # CV upload and profile management
│   ├── settings/page.tsx     # Settings
│   └── api/                  # API routes
├── components/               # React components
├── connectors/               # Platform connectors
├── hooks/                    # React hooks
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── anthropic.ts          # Anthropic client
│   ├── scorer.ts             # AI scoring logic
│   ├── scoringQueue.ts       # Sequential scoring queue
│   ├── scheduler.ts          # Cron jobs
│   ├── notifier.ts           # Desktop notifications
│   ├── profile.ts            # Profile context builder
│   └── keys.ts               # API key resolution
└── data/
    └── curriculum.ts         # Fallback developer profile for AI context
prisma/
├── schema.prisma
└── migrations/
instrumentation.ts            # Next.js server boot hook (starts scheduler)
```

---

## Database

```bash
npx prisma migrate dev     # Run migrations
npx prisma migrate reset   # Reset (deletes all data)
npx prisma studio          # Browse data in browser
```

---

## Deployment

Designed to run **locally only**. No deployment needed — just `npm run dev`.

---

---

# Roadmap

---

## ✅ V1 — MVP

> Core collection, scoring, proposals, and scheduler.

- [x] **Etapa 1** — Project setup (Next.js 15, Prisma, SQLite, TypeScript strict)
- [x] **Etapa 2** — Collection connectors: Workana (PT + ES), 99Freelas, Freelancer.com (API)
- [x] **Etapa 3** — Automatic AI match scoring (0–100) via Anthropic Claude
- [x] **Etapa 4** — Backend API routes (projects CRUD, favorites, discard, status, proposal)
- [x] **Etapa 5** — Dashboard UI: grid view, filter bar (platform, score, status, search)
- [x] **Etapa 6** — Proposal modal with AI generation, edit, save, copy, regenerate
- [x] **Etapa 7** — Scheduler (cron), follow-up desktop notifications, Settings page
- [x] **Etapa 8** — Polish: loading states, empty states, toast notifications, dark theme toggle

---

## ✅ V2 — Profile, Earnings & New Connectors

> CV parsing, profile-based filtering, earnings tracking, and platform expansion.

- [x] **Etapa 1** — API keys management UI (Anthropic key configurable in Settings without `.env`)
- [x] **Etapa 2** — Resume upload (PDF) + profile management (skills and job titles extracted by Claude)
- [x] **Etapa 3** — Profile keyword filter applied to all collections; SoyFreelancer and Upwork connectors (Playwright-based)
- [x] **Etapa 4** — Earnings page with revenue tracking per project; dark theme as default
- [x] **Etapa 5** — List view mode with row numbering, sort by date/score/value, fixed score slider, score alert threshold setting
- [x] **Etapa 6** — Multilingual title extraction from CV (ES/EN/PT-BR as separate chips); individual chip removal in Profile page

---

## 🔧 Fixes applied outside versioned scope

> Corrections and improvements made between V2 and V3 based on real usage.

- [x] Proposal modal redesigned: two-panel layout (description + proposal side by side), wider and taller (`92vw × 88vh`), footer layout fixed
- [x] Sort by value corrected: falls back to parsed budget string when `proposalValue` is null
- [x] Scoring infinite loop fixed: on API failure, `matchScore` is set to `0` instead of staying `null`
- [x] Sequential scoring queue (`scoringQueue.ts`): replaced concurrent `scoreProject()` calls with batched queue (3 at a time, 1s between batches)
- [x] SoyFreelancer connector fully rewritten with Playwright: correct URL (`/trabajos-freelance`), alphanumeric ID regex, cookie consent dismissal
- [x] SoyFreelancer: `preFiltered` flag added to bypass `isRelevant` post-filter (connector already searches by keyword)
- [x] SoyFreelancer: container selector fixed to `.jobRepeater` (was stopping at `h2.jobSubTitle`)
- [x] SoyFreelancer: Spanish job title used as search query (e.g. `"Desarrollador Backend"`) instead of raw skill names
- [x] Indeed: confirmed blocked by Cloudflare Bot Management — disabled, connector preserved for future proxy solution
- [x] Score polling: replaced broken `setTimeout` chain with `setInterval` + `projectsRef` pattern — scores now update live without page refresh
- [x] Base font size increased to 15px for better desktop readability

---

## 🚧 V3 — Performance, UX & Platform Expansion

> Database optimization, UX improvements, cost reduction, blacklist filtering, and 8 new platform integrations.

- [ ] **Etapa 1** — Performance base
  - [ ] Polling auto-deactivates when all projects are scored (currently runs indefinitely on a fixed interval)
  - [ ] DB indexes on `matchScore`, `collectedAt`, `platform`, `isFavorite`, `isDiscarded`, `proposalStatus`
  - [ ] `createMany` with `skipDuplicates` in `saveProjects` (eliminate N+1 DB queries per collect)
  - [ ] Cache `profileContext` in memory during scoring queue (eliminate N identical DB reads per scoring batch)

- [ ] **Etapa 2** — UX & Filters
  - [ ] Infinite scroll (replace full list render)
  - [ ] Remove score range slider; add "Hide unscored" toggle
  - [ ] Hide inactive platform buttons in dashboard filter bar (driven by Settings)
  - [ ] Filters persisted in URL query params (survive page refresh)

- [ ] **Etapa 3** — Quality & Cost
  - [ ] Keyword blacklist in Settings (`excludeKeywords[]`) — applied at collection time to filter irrelevant categories (e.g. "analista", "diseñador")
  - [ ] Switch scoring model from Sonnet → Haiku (~95% cost reduction; proposal generation stays on Sonnet)
  - [ ] Run connectors in parallel with `Promise.allSettled` (reduce total collection time)
  - [ ] Extract shared `useProjectActions` hook from `ProjectCard` and `ProjectCardList`

- [ ] **Etapa 4** — New integrations (easy — RSS / public JSON)
  - [ ] **RemoteOK** — `GET remoteok.com/api` public JSON, global remote dev jobs, tag-filterable by stack
  - [ ] **We Work Remotely** — RSS `/remote-programming-jobs.rss`, global
  - [ ] **Remotive** — RSS `remotive.com/remote-jobs/feed/`, software-dev category
  - [ ] **Trampos.co** — RSS, Brazilian tech/creative market

- [ ] **Etapa 5** — New integrations (medium — scraping / public API)
  - [ ] **Torre.co** — `POST /api/opportunities/_search` public JSON, Latin American market (ES/EN)
  - [ ] **GetOnBoard** — Playwright scraping, leading tech platform in Chile/Latam
  - [ ] **Programathor** — Playwright scraping, Brazilian dev-specific platform
  - [ ] **Guru.com** — RSS by category, global freelance alternative

---

## 🗺️ V4 — Mapped (not yet scoped)

> Ideas validated as worth pursuing but deferred for a future version.

- **Server-Sent Events (SSE)** — Replace client-side polling with server push for real-time score updates. Relevant if the app is ever hosted for multiple users simultaneously.
- **Auto-suggest exclusion keywords** — Analyze titles of discarded projects and surface frequent words as blacklist candidates. Decision on inclusion deferred to implementation phase (risk of over-restricting in multi-user contexts).
- **Tags as a relational table** — Currently stored as JSON string, preventing proper DB-level filtering. Refactor to a `ProjectTag` junction table for richer search and filtering.
