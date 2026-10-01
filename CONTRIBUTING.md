# Contributing to Keg

## Before you start

Read:

1. [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) for product and architecture context.
2. [`AGENTS.md`](./AGENTS.md) for repository, security, and Next.js rules.
3. [`ROADMAP.md`](./ROADMAP.md) for prioritized product work.

Inspect the working tree before editing and preserve unrelated changes.

## Local setup

Requirements:

- Node.js compatible with the checked-in Next.js version.
- npm and the checked-in `package-lock.json`.
- A configured Supabase project for authenticated/database flows.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Fill `.env.local` with local values. Never commit it or copy real credentials into documentation, code, logs, or screenshots.

## Development rules

- Keep the current Next.js App Router, React, TypeScript, Supabase, Homebrew, and Vercel architecture.
- Read the applicable guide under `node_modules/next/dist/docs/` before using or changing Next-specific behavior.
- Use the session-aware server Supabase client for private/authenticated reads.
- Keep the service-role client and server-only credentials out of client components.
- Preserve RLS policies and add ownership checks at the database boundary.
- Prefer typed domain/query models and shared query helpers to raw nested response shapes.
- Make ingestion jobs idempotent, authenticated, retryable, and observable.
- Preserve URL-addressable browse/search/filter/sort/pagination state.
- Add loading, empty, error, keyboard, focus, and accessible-label states to user-facing flows.
- Avoid unrelated formatting, dependency, or visual redesign changes in a focused pull request.

## Database changes

- Review both `database/schema.sql` and `database/phase3-schema.sql` before changing tables or policies.
- Keep resource identity source-aware: `(source_id, token)`.
- Update RLS policies and indexes with schema changes.
- The repository does not yet have a formal migration runner. Until one is added, document the exact SQL required and keep schema files consistent.
- Never use production data or credentials in fixtures or examples.

## Validation

Run the checks relevant to the change:

```bash
npm run lint
npm run build
```

There is currently no `npm test` script. Do not report tests as passing unless a real test command has been added and run. If an existing check fails, report the failure and its output summary rather than bypassing it.

For data/auth changes, also verify the affected user-visible flow and RLS behavior with a configured development Supabase project. For ingestion changes, verify authorization, idempotency, partial failure handling, and response counts.

## Pull request checklist

- [ ] The change has a clear user-visible outcome.
- [ ] Relevant documentation/context was updated.
- [ ] No secrets or private payloads are included.
- [ ] RLS and server/client boundaries were reviewed.
- [ ] Loading, empty, error, and accessibility states are covered.
- [ ] `npm run lint` was run and its result recorded.
- [ ] `npm run build` was run and its result recorded.
- [ ] Tests were run if available; otherwise the gap is stated.
- [ ] The diff contains no unrelated changes.
