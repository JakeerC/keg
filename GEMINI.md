# Gemini CLI project context

Keg is a Next.js App Router application for discovering Homebrew formulae and casks, evaluating their metadata and popularity, saving resources to stars or collections, and exporting a `Brewfile`.

Read these files before making changes:

- [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) — canonical product and architecture context.
- [`AGENTS.md`](./AGENTS.md) — shared repository and security rules, including the generated Next.js rule.
- [`ROADMAP.md`](./ROADMAP.md) — current gaps and prioritized future work.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — development and validation workflow.

Important constraints:

- Preserve the existing Next.js, React, TypeScript, Supabase, Homebrew, and Vercel stack.
- Read the relevant guide in `node_modules/next/dist/docs/` before changing Next-specific APIs.
- Use the session-aware server Supabase client for authenticated/private reads; keep the service-role client server-only.
- Preserve RLS policies and never treat client-side ownership checks as security.
- Keep secrets out of files, logs, examples, and commits.
- Inspect `git status` and preserve unrelated user changes.
- Run `npm run lint` and `npm run build` when relevant, and report failures honestly. There is currently no application test script.
