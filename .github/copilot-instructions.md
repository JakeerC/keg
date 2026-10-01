# Keg Copilot instructions

Read [`APPLICATION_CONTEXT.md`](../APPLICATION_CONTEXT.md) before suggesting or editing code. Read [`AGENTS.md`](../AGENTS.md) for shared repository rules and [`ROADMAP.md`](../ROADMAP.md) for product priorities.

Keg is a Next.js `16.3.7` App Router application using React, strict TypeScript, Supabase Auth/Postgres/RLS, Homebrew APIs, Gemini classification, and Vercel cron jobs. Preserve this stack.

- Read the relevant Next.js guide under `node_modules/next/dist/docs/` before changing Next-specific APIs.
- Use `createSupabaseServer()` for authenticated/private server reads and `createSupabaseBrowser()` for client-side user actions.
- Never expose `supabase-admin.ts`, service-role credentials, Gemini credentials, or cron secrets to the browser.
- Preserve RLS ownership boundaries and treat `(source_id, token)` as the long-term resource identity.
- Prefer typed shared query/domain shapes over `any` and duplicated nested Supabase selections.
- Preserve URL-based browse/search/filter/sort/pagination state.
- Include loading, empty, error, keyboard-focus, and accessible-label states.
- Inspect and preserve unrelated working-tree changes.
- Run `npm run lint` and `npm run build` when relevant. There is no application test script yet, so do not claim tests passed without a real test command.
