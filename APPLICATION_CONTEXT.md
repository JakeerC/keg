# Keg Application Context

This document is the canonical, compact context for people and coding agents working on Keg. Keep it accurate when the product, architecture, scripts, or deployment model changes.

## Product identity

**Keg** is a discovery and personal library for macOS software. It currently catalogs Homebrew formulae and casks so users can:

1. Discover GUI apps and CLI tools through browse, search, categories, rankings, and curated collections.
2. Evaluate a resource using its description, version, license, Homebrew metadata, install commands, dependencies/caveats, and popularity data.
3. Save resources as stars or into public/private collections.
4. Export saved resources as a Homebrew `Brewfile`.

The product direction is to make it easy to discover a trustworthy Mac setup and turn that setup into a reusable installation plan. See [`ROADMAP.md`](./ROADMAP.md) for prioritized future work.

## Intended users

- Mac users looking for useful applications and utilities.
- Developers assembling a repeatable CLI and GUI toolchain.
- People curating shareable Mac setup collections.

The current source of truth is Homebrew. The database has a source abstraction, but the UI, commands, analytics ingestion, and external metadata are still primarily Homebrew-specific.

## Current stack

- Next.js `16.3.7` App Router and React `19.2.8`.
- TypeScript `5`, strict mode, path alias `@/*` → `src/*`.
- Supabase Postgres, Auth, and Row Level Security.
- `@supabase/ssr` for browser/server session-aware clients.
- Vercel deployment and daily cron configuration in `vercel.json`, with an alternative GitHub Actions scheduled workflow in `.github/workflows/catalog-sync.yml`.
- Homebrew Formulae API for catalog and analytics data.
- CaskFlow category data plus Gemini classification for category enrichment.
- `lucide-react`, `recharts`, and `next-themes` for UI features.

## Route and feature map

| Route or area | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Main browse/search/category page, ranking, kind filter, sort, pagination, featured collections |
| `src/app/app/[token]/page.tsx` | Resource detail page, Homebrew metadata, commands, analytics chart, related resources |
| `src/app/collections/page.tsx` | Public collection directory |
| `src/app/collections/[slug]/page.tsx` | Collection detail and resource list |
| `src/app/my-collections/page.tsx` | Authenticated user's collections |
| `src/app/stars/page.tsx` | Authenticated starred resources and Brewfile export action |
| `src/app/login/page.tsx` | GitHub, Google, and email magic-link authentication |
| `src/app/api/brewfile/route.ts` | Authenticated Brewfile generation |
| `src/app/api/cron/sync/route.ts` | Homebrew resources and analytics ingestion |
| `src/app/api/cron/classify/route.ts` | Gemini-based formula categorization |
| `src/app/api/cron/sync-cask-categories/route.ts` | CaskFlow category synchronization |
| `src/components/Sidebar.tsx` | Navigation, category links, authenticated library links, collapse state |
| `src/components/StarButton.tsx` | Bookmark/star mutation and cross-card browser event synchronization |
| `src/components/SaveToCollectionButton.tsx` | Collection membership menu and collection creation entry point |
| `src/lib/supabase-server.ts` | Cookie-backed server Supabase client |
| `src/lib/supabase-browser.ts` | Browser Supabase client with session support |
| `src/lib/supabase.ts` | Public anon-key client used by server-rendered public queries |
| `src/lib/supabase-admin.ts` | Service-role client; server-only ingestion access |

## Data model

The SQL definitions live in `database/schema.sql` and `database/phase3-schema.sql`.

- `sources`: package/catalog providers; currently seeded with `homebrew`.
- `resources`: formulae and casks, identified today by `source_id + token`; `kind` is `cli_tool` or `gui_app`.
- `categories`: display categories such as Developer Tools and Productivity.
- `resource_categories`: many-to-many resource/category mapping with a primary flag.
- `resource_icons`: optional resource icon metadata.
- `analytics_snapshots`: time-window and metric snapshots used for popularity/trend displays.
- `bookmarks`: per-user starred resources.
- `collections`: per-user public/private lists with presentation metadata.
- `collection_items`: resources in collections with ordering.
- `ingestion_runs`: tracks execution history, statuses, and counts for cron jobs.

RLS is part of the security model. Public catalog reads should use public access; user-owned bookmarks and collections must use a session-aware client; service-role access must stay inside server-only code and ingestion jobs.

## Data flow and scheduled ingestion

Catalog synchronization runs daily to keep packages, analytics, and categories fresh:
1. `02:00 UTC` - `/api/cron/sync`: Fetches official Homebrew formulae (`formula.json`) and casks (`cask.json`), upserts rows in `resources` (keyed on `source_id, token`), and fetches `30d`, `90d`, and `365d` install metrics into `analytics_snapshots`.
2. `02:30 UTC` - `/api/cron/sync-cask-categories`: Imports CaskFlow `categories.json` to map GUI applications to primary and secondary categories in `resource_categories`.
3. `03:00 UTC` - `/api/cron/classify`: Queries uncategorized CLI tools and classifies them in batches using Gemini (`gemini-2.5-flash`).

All cron endpoints require `Authorization: Bearer <CRON_SECRET>` verified by `src/lib/cron-auth.ts`, enforce a 5-minute concurrency guard, and record outcomes in `ingestion_runs`. They are configured for Vercel Cron in `vercel.json` and mirrored in `.github/workflows/catalog-sync.yml`.

5. Browse/detail routes read Supabase data and, for resource details, may fetch live Homebrew metadata.
6. Authenticated users mutate bookmarks and collection rows through browser Supabase clients governed by RLS.
7. `/api/brewfile` converts a user's starred resources into `brew` and `cask` entries.

## Local development

### Requirements

- Node.js compatible with the repository's installed Next.js version.
- npm and the checked-in `package-lock.json`.
- A Supabase project for real data/auth flows.

### Environment variables

Copy `.env.local.example` to `.env.local` and provide values locally. Never commit `.env.local`, service-role keys, Gemini keys, or cron secrets.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe Supabase anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key for ingestion jobs.
- `GEMINI_API_KEY`: server-only key for classification.
- `CRON_SECRET`: secret required by protected scheduled ingestion routes.

OAuth providers, magic-link redirect URLs, and Supabase RLS policies must also be configured in the Supabase dashboard for authentication to work.

### Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm start
```

The repository includes a `vitest` suite for secret-free unit tests. Run `npm test` to validate core logic and components. Full integration tests involving database views or Row-Level Security require a configured local Supabase environment.

## Implementation conventions

- Read the relevant Next.js guide under `node_modules/next/dist/docs/` before changing Next-specific code. This project intentionally uses a breaking Next.js version covered by the repository's generated `AGENTS.md` rule.
- Keep public catalog reads separate from authenticated reads. Use `createSupabaseServer()` when the result depends on the current user or private RLS rows.
- Never import `supabase-admin.ts` into client components or expose service-role data to the browser.
- Preserve RLS ownership checks. A client-side check is not a security boundary.
- Prefer typed domain/query shapes over raw nested Supabase responses and `any`.
- Keep resource identity source-aware even if the current UI displays Homebrew only.
- Treat ingestion as idempotent. Handle partial external API failures, rate limits, stale records, and repeated cron runs explicitly.
- Keep route search/filter state in the URL so views can be shared and revisited.
- Provide loading, empty, error, focus, and accessible-label states for user-facing interactions.
- Avoid unrelated redesigns or dependency changes when implementing a focused feature.

## Known gaps to keep in mind

These are documented in more detail in [`ROADMAP.md`](./ROADMAP.md):

- Catalog status text includes hardcoded values.
- Ranked full-text search and cursor pagination (planned for Phase 1).
- Collection editing, sharing, and duplication (planned for Phase 2).

## Documentation map

- [`README.md`](./README.md): human-oriented project overview and quick start.
- [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md): canonical product, architecture, and workflow context.
- [`AGENTS.md`](./AGENTS.md): shared instructions for coding agents; includes the generated Next.js rule.
- [`CLAUDE.md`](./CLAUDE.md): Claude Code entrypoint that points to the shared context.
- [`GEMINI.md`](./GEMINI.md): Gemini CLI entrypoint that points to the shared context.
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md): GitHub Copilot guidance.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md): human contribution and validation workflow.
- [`ROADMAP.md`](./ROADMAP.md): current-state assessment and future feature priorities.
- [`P0_CORRECTNESS_SECURITY_TRUST_PLAN.md`](./P0_CORRECTNESS_SECURITY_TRUST_PLAN.md): executable Phase 0 plan for correctness, security, observability, error handling, and quality gates.
