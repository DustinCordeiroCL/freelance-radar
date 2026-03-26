# FreelanceRadar

A personal local web tool that aggregates freelance opportunities from Workana, Freelancer.com, 99Freelas, and Indeed Chile into a single unified interface. Filter by score, platform, or proposal status, generate AI-powered proposals with one click, and get desktop follow-up reminders — all running on `localhost`.

## Features

- **Automatic collection** from Workana (PT + ES), 99Freelas, Freelancer.com (API), and Indeed Chile (scraping)
- **AI match score** (0–100) calculated automatically for every new project via Anthropic Claude
- **Proposal generation** — one click generates a personalized proposal in the project's language
- **Proposal management** — edit, save, copy, and regenerate proposals
- **Favorite / discard / status tracking** per project
- **Desktop follow-up notifications** when a project in negotiation or development goes stale
- **Configurable intervals** — separate collection intervals for RSS/API/scraping connectors
- **Auto cleanup** — projects older than 30 days (without favorites or proposals) are removed daily

---

## Requirements

- Node.js 20+
- npm 10+

---

## Getting Started

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

- **ANTHROPIC_API_KEY** → [console.anthropic.com](https://console.anthropic.com) → API Keys
- **FREELANCER_API_TOKEN** → [freelancer.com/api](https://www.freelancer.com/api) → Register an app

### 4. Run database migrations

```bash
npx prisma migrate dev
```

This creates the local SQLite database at `dev.db`.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Collecting opportunities

Click **"Collect now"** in the dashboard header to trigger an immediate collection from all active connectors. Results appear in the grid sorted by match score.

The scheduler also runs collection automatically in the background (default: every 30 minutes for RSS/API, every 3 hours for scraping).

### Match score

Every new project is automatically scored (0–100) by Claude. The badge shows green (≥70), yellow (40–69), or red (<40). While scoring is in progress, the badge shows "scoring…".

### Generating proposals

Click the document icon (✍️) on any project card. If no proposal has been saved yet, one is generated automatically. You can:
- Edit the text in the textarea
- **Save** — persists your edits to the database
- **Copy** — copies to clipboard
- **Regenerate** — generates a fresh version
- **Open on platform** — jump directly to the original listing

### Proposal status

Use the dropdown on each card to track project state:
- **Em negociação** — you've submitted a proposal
- **Em desenvolvimento** — project accepted, work in progress
- **Concluída** — completed

### Follow-up notifications

A desktop notification is sent daily (09:00) for any project in `em_negociacao` or `em_desenvolvimento` that hasn't had a status update in the configured number of days (default: 3).

### Settings

Go to **Settings** to configure:
- Collection intervals per connector type (RSS, API, scraping)
- Which connectors are active
- Follow-up notification threshold (days)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `FREELANCER_API_TOKEN` | No | Freelancer.com API token |
| `DATABASE_URL` | Yes | SQLite path — `file:./dev.db` |

---

## Database

### Run migrations

```bash
npx prisma migrate dev
```

### Reset database (deletes all data)

```bash
npx prisma migrate reset
```

### View data in browser

```bash
npx prisma studio
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── favorites/page.tsx    # Favorites
│   ├── settings/page.tsx     # Settings
│   └── api/                  # API routes
├── components/               # React components
├── connectors/               # Platform connectors
├── hooks/                    # React hooks
├── lib/                      # Shared utilities
│   ├── db.ts                 # Prisma client
│   ├── anthropic.ts          # Anthropic client
│   ├── scorer.ts             # AI scoring
│   ├── scheduler.ts          # Cron jobs
│   └── notifier.ts           # Desktop notifications
└── data/
    └── curriculum.ts         # Developer profile for AI context
prisma/
├── schema.prisma             # Database schema
└── migrations/               # Migration history
instrumentation.ts            # Next.js server boot hook (starts scheduler)
```

---

## Deployment

This tool is designed to run **locally only**. No deployment needed — just `npm run dev`.
