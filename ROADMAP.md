# Keg Future Features Roadmap

**Audit date:** 2026-10-01  
**Scope:** Current repository state on `main`, including the existing Supabase/Homebrew data model and Next.js application.

## 1. Product direction

Keg is a discovery and personal library for macOS software: users can browse Homebrew formulae and casks, inspect installation details and popularity, save apps, organize them into collections, and export a `Brewfile`.

The strongest product direction is:

> **Make it effortless to discover a trustworthy macOS setup, understand what each tool does, and turn that setup into a reusable installation plan.**

This keeps the product focused on three connected jobs:

1. **Discover:** find useful GUI apps and CLI tools through search, categories, rankings, and curated collections.
2. **Evaluate:** understand an app's purpose, maintenance/version status, dependencies, caveats, license, and popularity trend.
3. **Assemble:** save individual apps or complete collections and export/install the resulting setup.

The roadmap deliberately puts correctness, data freshness, and a reliable discovery loop ahead of social features or additional package sources.

## 2. Current-state assessment

### Technology and architecture

- **Framework:** Next.js `16.3.7` App Router with React `19.2.8` and strict TypeScript.
- **Frontend:** Server-rendered route pages with client components for search, filters, theme switching, auth state, starring, and collection actions. Styling is primarily in `src/app/globals.css` plus inline component styles.
- **Data and auth:** Supabase Postgres, `@supabase/ssr`, cookie-backed server clients, browser clients, and RLS policies. Authentication supports GitHub, Google, and email magic links.
- **Ingestion:** Vercel cron calls `/api/cron/sync`, which imports Homebrew formulae, casks, and 30-day analytics. Separate endpoints sync CaskFlow categories and classify formulae with Gemini.
- **Deployment:** Vercel configuration contains a daily sync schedule. No application test script or CI configuration is currently present.
- **Data model:** The base schema is source-agnostic (`sources`, `resources`, `categories`, analytics), while the current UI and ingestion behavior are Homebrew-specific. Bookmarks and collections were added in `database/phase3-schema.sql`.

### User-facing capabilities already present

| Area | Current capability | Evidence |
| --- | --- | --- |
| Discovery | Browse popular resources, search by name/token, category navigation, kind toggle, sort by popularity/recent update, incremental loading | `src/app/page.tsx`, `src/components/SearchBar.tsx`, `src/components/KindToggle.tsx`, `src/components/SortDropdown.tsx` |
| Resource details | Resource metadata, Homebrew live details, install/uninstall/zap commands, related apps, install trend chart | `src/app/app/[token]/page.tsx`, `src/components/TerminalCommand.tsx`, `src/components/AnalyticsChart.tsx` |
| Accounts | OAuth and magic-link sign-in, session-aware navigation, sign-out | `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/components/AuthButton.tsx` |
| Personal library | Star/unstar resources and browse saved apps | `src/components/StarButton.tsx`, `src/app/stars/page.tsx` |
| Collections | Create public/private collections from a save menu, add/remove resources, view collections, toggle privacy, delete, show featured collections | `src/components/SaveToCollectionButton.tsx`, `src/components/CreateCollectionModal.tsx`, `src/app/collections/*`, `database/phase3-schema.sql` |
| Export | Download starred resources as a Homebrew `Brewfile` | `src/app/api/brewfile/route.ts` |
| Presentation | Responsive app grid, collapsible sidebar, light/dark theme, loading screens, custom visual design | `src/components/Sidebar.tsx`, `src/components/ThemeToggle.tsx`, `src/app/globals.css` |

### Current product strengths

- The core browse-to-detail-to-save loop exists end to end.
- The schema already leaves room for more package sources and resource categories.
- RLS policies establish a useful ownership boundary for bookmarks and collections.
- Homebrew data gives the product a differentiated, structured catalog rather than a generic bookmark directory.
- The UI has a clear visual identity and supports both GUI apps and CLI tools.

## 3. Important gaps found during the audit

These are not speculative enhancements; they are the highest-leverage gaps visible in the current implementation.

### P0: correctness, security, and trust

1. **Sidebar discovery filters are not wired through.** `Featured`, `Top Charts`, and `Recently Added` set the `filter` query parameter, but `src/app/page.tsx` reads it only to preserve it in the load-more URL. The result query does not change, so three navigation entries currently behave like the default browse view.
2. **Analytics history is incomplete and can be misleading.** The sync route records only `30d` snapshots, while the detail page renders `30d`, `90d`, and `365d`. Several browse queries also read historical snapshots without explicitly selecting the latest snapshot, which can produce duplicate resources or stale counts.
3. **Private collection access is inconsistent.** `src/app/collections/[slug]/page.tsx` loads the collection with the anonymous `supabase` client before reading the authenticated server session. Because RLS hides private rows from anonymous requests, an owner can fail to open their own private collection.
4. **Cron protection is optional.** `/api/cron/sync` rejects requests only when `CRON_SECRET` is set; the classify and CaskFlow sync endpoints have no request authentication. Production ingestion routes should never be publicly triggerable or dependent on an accidentally missing secret.
5. **Operational failures are mostly partial and silent.** Several batch writes log errors and continue, while client mutation components often ignore Supabase errors. Users and operators do not get a reliable success/failure signal.
6. **The current quality gate is red.** `npm run build` passes, but `npm run lint` fails with 35 errors and 27 warnings, including untyped data, React effect patterns, and unescaped text. There is no automated test script or CI workflow.

### P1: product friction and data foundations

1. **The data access layer is mostly untyped and duplicated.** Pages use `any` and repeat Supabase selection shapes. This makes changes to the schema risky and makes source expansion harder.
2. **Search is a basic `ilike` query.** It has no relevance ranking, facets, spelling tolerance, pagination cursor, or clear result count. Query/category sorting is partly performed in JavaScript after fetching.
3. **Collections are hard to manage.** Creation is only exposed from the save dropdown; there is no first-class create button in My Collections, no editing, no reordering UI, no item removal on the collection page, and no collection duplication/share workflow.
4. **The catalog is presented as live but freshness is not visible.** The status bar contains hardcoded Homebrew version and app count values. There is no last-sync timestamp, data freshness state, or stale-resource handling.
5. **The current detail page depends on a live Homebrew request.** It gracefully falls back when the request fails, but important metadata is not normalized into the database and there is no release history or compatibility view.
6. **The schema is maintained as manually executed SQL files.** There is no tracked migration workflow, generated Supabase database type, seed strategy, or documented production setup path.

### P2: differentiation opportunities

- Turn collections into reusable setup plans instead of passive lists.
- Add meaningful historical trend and version information to resource pages.
- Add user-controlled update notifications and saved discovery preferences.
- Expand beyond Homebrew only after the source abstraction is real in queries, URLs, commands, and identifiers.

## 4. Prioritized roadmap

Effort is relative engineering effort for the existing codebase: **S** = a few days, **M** = about one to two weeks, **L** = several weeks. Sequence is more important than exact duration.

### Phase 0 — Stabilize the current experience (P0, first)

**Outcome:** Existing navigation and saved data behave predictably, production ingestion is protected, and the project has a green baseline.

| ID | Feature/workstream | Effort | Acceptance criteria |
| --- | --- | --- | --- |
| F0.1 | Implement `featured`, `top`, and `recent` browse modes | S | Each sidebar link produces a distinct query/result set; URL state survives load-more and search; invalid filter values fall back safely. |
| F0.2 | Correct analytics selection and retention | M | Sync captures the intended windows; browse pages use one latest snapshot per resource/metric; detail charts show real values or an explicit unavailable state; resource ranking has no snapshot-driven duplicates. |
| F0.3 | Fix authenticated private collection reads | S | Owners can open and manage private collections; non-owners cannot infer or read them; public collection behavior is unchanged. |
| F0.4 | Lock down and make cron jobs observable | M | All ingestion/classification routes require a shared secret or an equivalent server-only authorization; missing production configuration fails closed; responses report processed, skipped, and failed counts; sync logs include a run identifier. |
| F0.5 | Establish the quality baseline | M | `npm run lint` passes; add unit/integration coverage for filtering, RLS-sensitive collection access, bookmark toggling, Brewfile output, and sync normalization; add a CI check for lint, typecheck/build, and tests. |
| F0.6 | Add consistent error/loading/empty states | S | Failed searches, mutations, collection actions, auth transitions, and sync-dependent views give actionable feedback and do not silently appear successful. |

**Why first:** These items protect user trust and make every later feature safer to build. A larger catalog or more social surface would amplify current correctness and security problems.

See [`P0_CORRECTNESS_SECURITY_TRUST_PLAN.md`](./P0_CORRECTNESS_SECURITY_TRUST_PLAN.md) for the ordered implementation slices, file-level workstreams, verification matrix, rollout plan, and completion definition.

### Phase 1 — Make discovery genuinely useful (P1)

**Outcome:** A user can quickly find the right tool, understand why it is relevant, and see trustworthy freshness signals.

| ID | Feature/workstream | Effort | Acceptance criteria |
| --- | --- | --- | --- |
| F1.1 | Introduce generated database types and shared query functions | M | Supabase rows and nested relationships are typed; repeated resource/card queries are centralized; `any` is removed from the primary browse/detail/collection paths. |
| F1.2 | Upgrade search and filtering | L | Search supports ranked name/token/description matching, category and kind facets, sort options, result counts, and cursor-based pagination; all state is URL-addressable and shareable. |
| F1.3 | Add real browse surfaces | M | Featured resources, top charts, recently added, trending/rising, and category pages each have explicit ranking rules, empty states, metadata, and links that work independently of the home page. |
| F1.4 | Improve resource detail pages | M | Show data freshness, source, last updated date, version history where available, dependencies/conflicts, caveats, homepage/license links, and a clear copy/share action for install commands. |
| F1.5 | Replace hardcoded catalog status | S | Status bar and metadata use a server-side catalog summary with last successful sync, resource counts by kind, and a stale/error indicator. |
| F1.6 | Improve mobile and accessibility behavior | M | Keyboard users can operate search, filters, menus, and dialogs; icon-only controls have accessible names; responsive layouts avoid overflow; loading and focus states are visible. |

**Discovery success measures:** search-to-detail rate, zero-result rate, detail-to-star/collection rate, share/copy usage, and percentage of browse results backed by fresh analytics.

### Phase 2 — Turn saving into a setup workflow (P1/P2)

**Outcome:** Users can build, maintain, share, and reproduce a complete Mac environment.

| ID | Feature/workstream | Effort | Acceptance criteria |
| --- | --- | --- | --- |
| F2.1 | Make collections first-class | M | My Collections has a create action; users can edit title, description, emoji, visibility, and slug; collection pages support removing and reordering items; destructive actions have confirmed error handling. |
| F2.2 | Add collection-level install plans | M | A collection can preview its formulae/casks, resolve duplicates, show generated commands, and export a deterministic `Brewfile`; export works for a collection as well as stars. |
| F2.3 | Support collection sharing and duplication | M | Public collections have stable share metadata and a copy/duplicate action; private collections remain owner-only; copied collections are clearly attributed to their creator/source. |
| F2.4 | Add onboarding and starter packs | M | New users can start from curated collections such as Web Development, Writing, or Mac Essentials and understand how to save, customize, and export them. |
| F2.5 | Add user notes, tags, and install state | L | Users can annotate saved resources, tag them within their library, and optionally mark them planned/installed/archived without changing public catalog data. |
| F2.6 | Add saved searches and update notifications | L | A user can save a search or collection and opt into version/category updates with clear notification preferences and unsubscribe controls. |

**Setup success measures:** collection creation rate, resources per collection, collection export rate, duplicate/clone rate, return usage of saved libraries, and successful export downloads.

### Phase 3 — Build a durable catalog platform (P1/P2)

**Outcome:** Keg can support more data and more sources without duplicating the current Homebrew implementation.

| ID | Feature/workstream | Effort | Acceptance criteria |
| --- | --- | --- | --- |
| F3.1 | Formalize source-aware identity | L | Resource URLs and queries use `(source, token)` identity; source is visible in the UI; collisions are impossible; commands are generated by source/kind adapters rather than hardcoded Homebrew conditionals. |
| F3.2 | Add migration and ingestion infrastructure | M | Schema changes are tracked as ordered migrations; ingestion has idempotent jobs, retries, rate-limit handling, stale/deleted-resource handling, and a run history table. |
| F3.3 | Add a protected admin/data-quality view | M | Operators can see last sync, row counts, failures, uncategorized resources, stale resources, analytics coverage, and rerun an authorized job. |
| F3.4 | Improve categorization quality | M | Category assignments have a source/confidence/review state; classifier retries are bounded; duplicate mappings are prevented; an operator can correct a category without the next job overwriting it. |
| F3.5 | Add a second source only after F3.1 | L | A second package source can be browsed, searched, detailed, saved, and exported through the same product abstractions, with source-specific install instructions and freshness rules. Candidate sources should be selected from user demand rather than assumed. |

**Platform success measures:** sync success rate, time since last successful sync, percentage of resources with valid metadata/categories/analytics, ingestion latency, and operator time per incident.

### Phase 4 — Long-term differentiation (P3)

These should follow evidence from the earlier phases rather than compete with the core loop.

- **Trend intelligence:** rising/falling rankings, release velocity, popularity history, and category-level trend pages.
- **Compatibility intelligence:** macOS version/architecture support, Apple Silicon notes, known conflicts, and dependency impact.
- **Team/shared libraries:** shared collections with roles, invite links, and change history for teams or households.
- **Community signals:** lightweight recommendations or annotations with abuse controls and moderation; avoid launching open reviews before there is a moderation and trust model.
- **Install companion:** optional local helper or deep links for applying a reviewed install plan, with explicit confirmation and safe dry-run output.
- **Progressive web experience:** installable/mobile-friendly browsing and cached public catalog pages if analytics show meaningful mobile or repeat usage.

## 5. Recommended technical enablers

These should be treated as roadmap work, not an afterthought:

1. **Typed data boundary:** generate Supabase types and create small repository/query modules for resources, analytics, bookmarks, and collections.
2. **Schema/migrations:** consolidate `database/schema.sql` and `database/phase3-schema.sql` into a reproducible migration history with seed data and documented environment setup.
3. **Explicit domain contracts:** define `Resource`, `ResourceCard`, `AnalyticsSnapshot`, `Collection`, and ingestion result types; avoid passing raw nested Supabase responses into UI components.
4. **Query correctness:** use source-qualified identifiers, explicit analytics metric/window/latest-row rules, server-side pagination, and indexes matched to search/category/ranking queries.
5. **Security boundary:** keep service-role access in server-only modules, fail closed on cron authorization, validate route inputs, and test RLS as behavior rather than assuming policies are correct.
6. **Testing strategy:** unit-test normalization/ranking/export helpers; integration-test Supabase-backed server flows; use browser tests for search, auth handoff, starring, collection editing, and private/public visibility.
7. **Observability:** record ingestion run status and counts, capture external API failures, expose freshness to users, and avoid logging secrets or full private payloads.
8. **Performance/accessibility:** replace avoidable raw images with optimized image handling where appropriate, reduce duplicated client Supabase subscriptions, verify the visual effects on low-power devices, and maintain keyboard/screen-reader behavior.

## 6. Suggested first 30 days

1. **Week 1:** fix browse filters, private collection access, cron authorization, and mutation error handling.
2. **Week 2:** correct analytics windows/latest-row queries and replace hardcoded catalog status with a summary query.
3. **Week 3:** establish migrations/types and add tests around browse, bookmarks, collections, export, and ingestion normalization.
4. **Week 4:** ship the first search/discovery slice: ranked search, explicit facets, working browse surfaces, and data freshness labels.

## 7. Decisions to validate with users

Before committing to Phase 3 or the social features in Phase 4, validate:

- Is the primary user an individual setting up a Mac, a developer managing CLI tools, or someone curating recommendations for others?
- Are collections primarily private setup lists, public recommendation lists, or both?
- Which second source is actually requested: another package manager, GitHub releases, or a different type of Mac software?
- Do users want notifications for version changes, popularity changes, or only collection updates?
- Is the desired install action copy/export only, or should Keg eventually coordinate a local installation?

Until these answers are known, prioritize the Homebrew discovery and reproducible setup workflow rather than broadening the catalog indiscriminately.

## 8. Definition of roadmap success

Keg should be considered ready to broaden scope when:

- Core browse, search, detail, star, collection, and export flows are covered by passing automated checks.
- Ingestion is authenticated, observable, retryable, and displays freshness accurately.
- Users can find a resource with low zero-result friction and understand its install implications.
- A user can create or copy a collection and reliably reproduce it as a deterministic `Brewfile`.
- The team can add a source or schema field without editing raw nested query shapes throughout the UI.
