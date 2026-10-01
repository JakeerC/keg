# Claude Code project context

Keg is a Next.js application for discovering Homebrew Mac apps and CLI tools, saving them to stars or collections, and exporting a `Brewfile`.

Before changing code:

1. Read [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) for the product, architecture, data model, routes, environment, and known gaps.
2. Read [`AGENTS.md`](./AGENTS.md) for repository rules and the generated Next.js guidance.
3. Read [`ROADMAP.md`](./ROADMAP.md) when implementing or proposing a feature.
4. Inspect `git status` and preserve unrelated working-tree changes.

## Claude-specific working guidance

- Keep changes focused and compatible with the existing Next.js App Router, Supabase, and Vercel architecture.
- Read the relevant guide under `node_modules/next/dist/docs/` before changing Next-specific behavior; this project uses a breaking Next.js version.
- Use the session-aware Supabase server client for authenticated or private data. Keep the service-role client server-only.
- Preserve Row Level Security and test ownership behavior rather than trusting UI checks.
- Do not put real secrets in code, markdown, logs, examples, or commits.
- Prefer typed data boundaries and small shared query functions over adding more `any` or duplicating nested Supabase selections.
- Maintain accessible loading, empty, error, keyboard, and focus states.

## Checks

Run the relevant checks and report their actual results:

```bash
npm run lint
npm run build
```

There is no application `test` script yet. Do not invent a passing test result. See `CONTRIBUTING.md` for the normal change and review workflow.
