<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Keg agent instructions

Read [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) before making project changes. Read [`ROADMAP.md`](./ROADMAP.md) when the request involves product direction or future features. These documents are the shared source of truth; update them when the architecture or product behavior changes materially.

## Repository rules

- Preserve the existing stack: Next.js App Router, React, TypeScript, Supabase, Homebrew ingestion, and Vercel deployment. Do not introduce a replacement framework or starter kit.
- Inspect the working tree before editing. Preserve unrelated user changes and do not reset, stash, or overwrite them.
- Keep the generated `nextjs-agent-rules` block above intact. Do not edit or remove it.
- Read the relevant Next.js guide from `node_modules/next/dist/docs/` before changing Next-specific APIs, routing, configuration, or conventions.
- Use `functions.read` for file inspection and targeted edits for existing files. Avoid broad rewrites when a focused change is sufficient.
- Keep secrets out of source, documentation examples, output, and commits. Use placeholders only. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` to client code.

## Architecture and security

- Use `createSupabaseServer()` for session-aware server reads and private collection access.
- Use `createSupabaseBrowser()` only in client components that need browser auth or user mutations.
- Use the public anon client for genuinely public catalog reads.
- Keep `supabase-admin.ts` server-only and preserve RLS policies. Client-side ownership checks are not security controls.
- Treat `(source_id, token)` as the long-term resource identity even while Homebrew is the only active source.
- Make ingestion idempotent, authenticated, observable, and safe to retry.
- Validate URL parameters and external API responses; handle partial failures explicitly.

## Product and UX expectations

- Keg helps users discover, evaluate, save, organize, and export Mac apps and CLI tools.
- Keep browse/search/detail/star/collection/export flows coherent.
- Preserve URL-addressable search, category, filter, sort, kind, and pagination state.
- Include loading, empty, error, keyboard-focus, and accessible-label states for interactive features.
- Avoid hardcoded catalog facts when the value can be read from the database or ingestion status.

## Validation

Run the narrowest relevant checks, then the project checks when practical:

```bash
npm run lint
npm run build
```

There is currently no application test script. Do not claim tests passed unless a real test command has been run. Record failed checks honestly; do not weaken or replace a failing check with a no-op.

## Change workflow

1. Inspect relevant routes, components, SQL, and documentation.
2. State the user-visible outcome and identify data/security implications.
3. Make the smallest complete change.
4. Verify behavior with the relevant check or a reproducible local command.
5. Review the diff for unrelated changes, secrets, broken links, and missing documentation.
6. Report changed files, checks run, failures, and remaining gaps.
