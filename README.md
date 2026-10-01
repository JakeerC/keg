# Keg

Keg is a discovery and personal library for macOS software. It currently catalogs Homebrew formulae and casks so users can browse apps and CLI tools, inspect installation details and popularity, save resources, organize collections, and export a `Brewfile`.

## What is implemented

- Search and browse Homebrew resources.
- Category, resource-kind, popularity, and recent-update views.
- Resource detail pages with metadata, Homebrew details, commands, dependencies/caveats, related resources, and analytics.
- GitHub, Google, and email magic-link authentication through Supabase.
- Starred resources and public/private collections.
- Brewfile export for saved resources.
- Daily Homebrew synchronization plus category enrichment jobs.
- Responsive layout, collapsible sidebar, and light/dark theme support.

See [`ROADMAP.md`](./ROADMAP.md) for the current assessment, known gaps, and future feature priorities.

## Stack

- Next.js `16.3.7` App Router
- React `19.2.8`
- Strict TypeScript
- Supabase Postgres, Auth, and Row Level Security
- Homebrew Formulae API
- Gemini classification for uncategorized resources
- Vercel cron configuration

## Getting started

### Requirements

- Node.js compatible with the repository's Next.js version.
- npm.
- A Supabase project for database and authentication flows.

Install dependencies and create local environment configuration:

```bash
npm install
cp .env.local.example .env.local
```

Fill in the local Supabase and server-only values. Never commit `.env.local` or expose service-role, Gemini, or cron credentials to the browser.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only ingestion access
- `GEMINI_API_KEY` — server-only classification access
- `CRON_SECRET` — scheduled route authorization

Authentication providers, redirect URLs, database tables, and RLS policies must also be configured in Supabase. See [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) for the data flow and security boundaries.

## Database

The current SQL definitions are in:

- [`database/schema.sql`](./database/schema.sql) — catalog, categories, icons, and analytics.
- [`database/phase3-schema.sql`](./database/phase3-schema.sql) — bookmarks and collections.

Apply them in the intended order to a development Supabase project. The repository does not yet have a formal migration runner; schema changes should be documented and kept consistent across these files.

## Project commands

```bash
npm run dev      # local development
npm run lint     # ESLint
npm run build    # production build and TypeScript validation
npm start        # serve a production build
```

There is currently no application test script.

## Documentation for contributors and coding agents

- [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) — canonical product, architecture, data model, and workflow context.
- [`AGENTS.md`](./AGENTS.md) — shared coding-agent rules and generated Next.js guidance.
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code entrypoint.
- [`GEMINI.md`](./GEMINI.md) — Gemini CLI entrypoint.
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) — GitHub Copilot guidance.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — development, database, validation, and pull request workflow.
