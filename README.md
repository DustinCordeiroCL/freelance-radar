# FreelanceRadar

A personal local web tool that aggregates freelance opportunities from multiple platforms into a single unified interface. Filter, favorite, discard projects, and generate AI-powered proposals — all without leaving `localhost`.

## Features

- Automatic collection from Workana, Freelancer.com, 99Freelas, and Indeed Chile
- AI-powered match score for each project (via Anthropic Claude)
- Personalized proposal generation with one click
- Favorite / discard / proposal status tracking
- Desktop follow-up notifications for stale projects
- Configurable collection intervals per connector type (RSS, API, scraping)

## Requirements

- Node.js 20+
- npm 10+

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

Edit `.env.local` and fill in the required values:

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
FREELANCER_API_TOKEN=your_freelancer_token_here
DATABASE_URL="file:./dev.db"
```

> `ANTHROPIC_API_KEY` is required for match scoring and proposal generation.
> `FREELANCER_API_TOKEN` is required only for the Freelancer.com connector.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

This creates the local SQLite database at `prisma/dev.db`.

### 5. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for AI scoring and proposals |
| `FREELANCER_API_TOKEN` | Yes (for Freelancer connector) | Freelancer.com API token |
| `DATABASE_URL` | Yes | SQLite path — `file:./dev.db` |

## Database Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name describe_your_change
```

To reset the database (deletes all data):

```bash
npx prisma migrate reset
```

## Project Structure

```
src/
├── app/            # Next.js App Router pages and API routes
├── components/     # React components
├── connectors/     # Platform connectors (Workana, Freelancer, etc.)
├── lib/            # Shared utilities (db, AI client, scorer, scheduler)
└── data/           # Static data (curriculum context for AI)
prisma/
├── schema.prisma   # Database schema
└── migrations/     # Migration history
```

## Deployment

This tool is designed to run **locally only** via `npm run dev`. No deployment needed.
