# P0 Implementation Plan: Correctness, Security, and Trust

**Related roadmap phase:** Phase 0 — Stabilize the current experience  
**Status:** Proposed execution plan  
**Scope:** F0.1–F0.6 from [`ROADMAP.md`](./ROADMAP.md)

## 1. Objective

Make the existing Keg experience dependable before adding major discovery, social, or multi-source features.

At the end of this plan:

- Navigation filters produce the results they claim to produce.
- Rankings and analytics use current, unambiguous data.
- Private collections are visible only to their owners.
- Every scheduled ingestion endpoint fails closed when unauthenticated and reports its actual outcome.
- User mutations expose failures instead of silently appearing successful.
- Lint, build, and a real test command provide a repeatable quality gate.

## 2. Current evidence and affected areas

| Risk | Current evidence | Primary files |
| --- | --- | --- |
| Browse filters are inert | `filter` is read/preserved but does not alter the main query | `src/app/page.tsx`, `src/components/Sidebar.tsx` |
| Analytics can be stale/duplicated | Sync writes only `30d`; detail renders three windows; browse queries do not clearly select the latest row | `src/app/api/cron/sync/route.ts`, `src/app/page.tsx`, `src/app/app/[token]/page.tsx`, `database/schema.sql` |
| Private owner access can fail | Collection is initially read with the public client before the authenticated session is loaded | `src/app/collections/[slug]/page.tsx`, `database/phase3-schema.sql` |
| Cron access can be public | Sync checks `CRON_SECRET` only if it exists; other ingestion routes have no shared authorization | `src/app/api/cron/*/route.ts`, `vercel.json`, `.env.local.example` |
| Failures are hard to observe | Batch errors are logged and execution continues; several browser mutations ignore returned errors | `src/app/api/cron/*/route.ts`, `src/components/StarButton.tsx`, `src/components/SaveToCollectionButton.tsx`, `src/components/CollectionActions.tsx` |
| Quality gate is red | `npm run lint` currently reports 35 errors and 27 warnings; no test script or CI workflow exists | `package.json`, `eslint.config.mjs`, `.github/` |

## 3. Scope boundaries

### Included

- Existing Homebrew browse, detail, analytics, authentication, collections, bookmarks, and ingestion paths.
- Minimal schema additions needed for analytics views/run history and testability.
- Error/loading/empty behavior required to communicate operation status.
- Lint/test/CI setup needed to enforce the corrected behavior.

### Not included

- Ranked full-text search or cursor pagination; those belong to Phase 1.
- Collection editing, sharing, duplication, or install-plan workflows; those belong to Phase 2.
- A second package source.
- Open reviews, community moderation, notifications, or local installation.
- A broad visual redesign.

## 4. Decisions to lock before implementation

These decisions prevent ambiguous behavior from being encoded in multiple pages.

1. **`featured` meaning:** use resources contained in public collections where `collections.is_featured = true`, deduplicate by resource ID, and preserve collection/item ordering. If there are no featured collections, show an explicit empty state. Do not silently treat `featured` as another popularity query.
2. **`top` meaning:** rank by the latest available 30-day install snapshot using the resource's correct metric (`install-on-request` for formulae and `cask-install` for casks).
3. **`recent` meaning:** rank by `resources.updated_at` descending, with a deterministic resource-ID tie-breaker.
4. **Analytics truth:** a displayed value must identify its metric, time window, and captured date. Missing windows display `Unavailable`, not `0`, unless the source explicitly reports zero.
5. **Private collection not-found behavior:** return the same not-found result for a missing collection and a private collection viewed by a non-owner. Do not disclose that a private slug exists.
6. **Cron failure semantics:** missing/invalid authorization is rejected before any external request; configuration failures are not reported as successful runs; partial batch failures produce a `partial` status and non-2xx response where appropriate.
7. **Mutation semantics:** optimistic UI may remain, but every failed mutation must roll back state and show a recoverable error message.

## 5. Ordered workstreams

### P0.0 — Establish a safe baseline

**Effort:** S  
**Dependencies:** none

#### Tasks

- Record the current results of `npm run lint` and `npm run build`.
- Confirm the working tree and identify unrelated changes before implementation.
- Add a test framework and `npm test` script without weakening ESLint or TypeScript checks. Prefer small pure-function tests first; choose the browser/integration layer based on available Supabase infrastructure.
- Create a shared test data factory for resources, snapshots, collections, and users without real credentials.
- Add a CI workflow that runs lint, tests, and build on pull requests.

#### Acceptance criteria

- The baseline failures are recorded in the change notes.
- `npm test` is a real command and fails when a test fails.
- CI does not require production secrets for unit tests.
- No test fixture contains private tokens, service-role keys, or production payloads.

### P0.1 — Make browse filters correct

**Effort:** S  
**Dependencies:** P0.0

#### Tasks

1. Define a typed filter union: `featured | top | recent`.
2. Validate the URL value in `src/app/page.tsx`; unknown values fall back to the default browse mode.
3. Move browse data selection into small server-side query functions so search, category, kind, filter, sort, and limit are applied consistently.
4. Implement the three meanings defined above:
   - `featured`: query public featured collection items and deduplicate resources.
   - `top`: query the latest relevant 30-day analytics row per resource.
   - `recent`: query resources by `updated_at` and deterministic tie-breaker.
5. Reset pagination when changing a filter or search mode.
6. Preserve filter state in load-more URLs and ensure search does not accidentally retain an incompatible filter without an explicit rule.
7. Add result headings and empty states that identify the active mode.

#### Acceptance criteria

- Each sidebar entry returns a measurably different, correctly labeled result set when fixture data distinguishes the modes.
- A direct URL such as `/?filter=recent` is sufficient to reproduce the view.
- Invalid filters do not cause a database error or misleading label.
- Kind and category constraints work in every filter mode.
- Load more preserves all active URL state.

#### Tests

- Query/filter unit tests for valid, invalid, and combined URL state.
- Server/integration test proving featured resources are deduplicated.
- Regression test proving top results use the latest analytics row only.

### P0.2 — Correct analytics history and ranking data

**Effort:** M  
**Dependencies:** P0.0

#### Tasks

1. Add a shared analytics definition for supported windows and metric-by-kind mapping.
2. Update `src/app/api/cron/sync/route.ts` to fetch and upsert the windows the UI displays (`30d`, `90d`, `365d`) or change the UI contract to only display windows actually available. The preferred outcome is to support all three.
3. Add database views or server-side query helpers that select exactly one latest snapshot for each `(resource_id, time_window, metric)`.
4. Update browse, related-resource, and detail queries to use that latest-row contract.
5. Ensure formulae use `install-on-request` and casks use `cask-install`; do not combine incompatible metrics for a single ranking.
6. Distinguish missing data from zero data in the detail chart and card counts.
7. Add indexes appropriate to latest-row and ranking queries; document any SQL migration required.
8. Handle failed analytics endpoints separately from failed resource sync. A resource catalog sync must not falsely imply analytics freshness.

#### Acceptance criteria

- A resource appears at most once per browse ranking.
- Detail charts show accurate values for each supported window or an explicit unavailable state.
- Re-running sync for the same capture date is idempotent.
- A failed analytics fetch is visible in the sync result and does not overwrite valid prior data with fabricated zeros.
- All ranking responses identify the window/metric used in code and documentation.

#### Tests

- Snapshot selection tests with multiple dates and duplicate metrics.
- Formula/cask metric mapping tests.
- Idempotency test for repeated sync payloads.
- Detail chart test for missing versus zero values.

### P0.3 — Repair private collection authorization boundaries

**Effort:** S  
**Dependencies:** P0.0

#### Tasks

1. In `src/app/collections/[slug]/page.tsx`, create the session-aware server client before reading the collection.
2. Read the collection and its items through that client so RLS evaluates the current user.
3. Keep public catalog and public collection reads least-privileged; do not use the service-role client as a workaround.
4. Ensure owner checks use the authenticated session returned by the same server client.
5. Return the same not-found UI/status for missing and unauthorized private collections.
6. Review collection mutation components for ownership enforcement and surfaced errors.
7. Add a regression test matrix for anonymous, owner, and non-owner access.

#### Acceptance criteria

| Actor | Public collection | Private owner collection | Private non-owner collection |
| --- | --- | --- | --- |
| Anonymous | Can view | Not found | Not found |
| Owner | Can view/manage | Can view/manage | N/A |
| Authenticated non-owner | Can view | Not found | Not found |

- A private slug cannot be enumerated through different response behavior.
- No client-side condition is relied upon as the authorization boundary.
- Collection items follow the same visibility decision as their collection.

### P0.4 — Secure and instrument ingestion routes

**Effort:** M  
**Dependencies:** P0.0; schema migration can proceed in parallel

#### Tasks

1. Add a server-only shared authorization helper, for example `src/lib/cron-auth.ts`, that:
   - Requires `CRON_SECRET` to be configured in production.
   - Validates `Authorization: Bearer <secret>` before external calls.
   - Rejects missing configuration instead of allowing an open endpoint.
   - Does not log the received secret.
2. Apply the helper to:
   - `/api/cron/sync`
   - `/api/cron/classify`
   - `/api/cron/sync-cask-categories`
3. Preserve Vercel cron compatibility and document the required secret configuration.
4. Add an `ingestion_runs` table/migration with at least:
   - run ID
   - job name
   - started/finished timestamps
   - status: `running | succeeded | partial | failed`
   - processed, skipped, failed counts
   - safe error summary/metadata
5. Record a run for every authorized ingestion request. Mark it failed if setup or external fetch fails before processing; mark it partial when some writes fail but the job continues.
6. Replace silent batch continuation with structured error collection. Continue only where safe, and return a non-success status when the final result is incomplete.
7. Add bounded timeouts and response validation for Homebrew, CaskFlow, and Gemini calls.
8. Ensure overlapping runs cannot corrupt counts or produce inconsistent partial state; use idempotent upserts and, if needed, a lightweight job lock.

#### Acceptance criteria

- All three ingestion routes reject unauthenticated requests before making external calls.
- A missing production `CRON_SECRET` cannot expose a job route.
- Authorized responses include a run ID, status, and processed/skipped/failed counts.
- The database contains a traceable run record without secrets or full private payloads.
- Partial failures are distinguishable from successful completion.
- Replaying an authorized request is safe.

#### Tests

- Authorization tests for missing, malformed, wrong, and correct bearer tokens.
- Configuration test proving missing secret fails closed.
- Response contract tests for success, partial, and failed runs.
- Idempotency tests for repeated upserts.

### P0.5 — Surface mutation and route failures

**Effort:** S  
**Dependencies:** P0.0; can run alongside P0.1–P0.4

#### Tasks

1. Add a shared client error-message pattern for bookmark and collection mutations.
2. Update `StarButton` to disable/reconcile concurrent requests, roll back on failure, and show an accessible status message.
3. Update `SaveToCollectionButton` to report failed membership changes and failed collection loads; do not leave optimistic checkboxes in a false state.
4. Update `CollectionActions` to handle privacy-update and delete failures before redirecting or refreshing.
5. Update `CreateCollectionModal` to validate input, handle duplicate/server errors, and preserve the form on failure.
6. Add route-level error boundaries where server-rendered pages can fail, while retaining useful not-found behavior.
7. Ensure loading and empty states do not imply that a request succeeded.

#### Acceptance criteria

- Every user mutation has visible pending, success, and failure behavior.
- Failed optimistic actions restore the previous state.
- Failed deletes do not navigate away as if deletion succeeded.
- Errors are accessible to screen readers and do not expose database internals or secrets.
- Refreshing after a failure does not silently discard the user-facing error without a clear retry path.

### P0.6 — Clear the quality gate

**Effort:** M  
**Dependencies:** P0.1–P0.5 should be substantially complete

#### Tasks

1. Remove current lint errors without disabling rules globally:
   - replace `any` with domain/query types;
   - fix React effect patterns;
   - escape rendered text;
   - remove unused imports and variables;
   - fix the `prefer-const` issue;
   - address image optimization warnings where practical.
2. Add focused tests for:
   - browse filters and URL state;
   - analytics normalization/latest-row selection;
   - cron authorization and run outcomes;
   - collection visibility matrix;
   - bookmark rollback behavior;
   - Brewfile generation.
3. Add CI under `.github/workflows/` for lint, test, and build.
4. Document which checks require a configured Supabase environment and keep secret-free unit tests runnable in CI.
5. Run the full local checks from the repository root.

#### Acceptance criteria

```text
npm run lint   -> exit 0
npm test       -> exit 0
npm run build  -> exit 0
```

- CI runs the same checks on pull requests.
- No global ESLint suppression is introduced to obtain a green result.
- The test suite covers the security and correctness cases listed above.

## 6. Recommended execution order

### Slice 1 — Shared contracts and tests

- Define resource/analytics/filter/run-result types.
- Add test runner and fixtures.
- Add cron auth helper tests.
- Add analytics latest-row and filter helper tests.

### Slice 2 — Public browse correctness

- Implement explicit filter semantics.
- Centralize browse query construction.
- Fix analytics latest-row selection and missing-data display.
- Add route/query regression tests.

### Slice 3 — Security boundary

- Fix session-aware private collection reads.
- Apply cron authorization to all scheduled routes.
- Add security regression tests and verify RLS behavior in a development Supabase project.

### Slice 4 — Operational trust

- Add ingestion run schema and structured results.
- Improve external request validation, timeouts, and partial failure handling.
- Update status/error reporting for client mutations.

### Slice 5 — Quality gate and rollout

- Resolve lint failures.
- Add CI.
- Run the full check suite.
- Perform a manual smoke test of anonymous, authenticated-owner, and authenticated-non-owner flows.
- Update [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md) with the new run-history table, test command, and resolved gaps.

## 7. Verification matrix

| Area | Verification |
| --- | --- |
| Browse | Direct URL tests for each filter, category + kind combinations, invalid values, pagination preservation |
| Analytics | Multiple snapshots, missing windows, zero counts, formula/cask metrics, repeated sync date |
| Collections | Anonymous/public, owner/private, non-owner/private, item visibility, mutation failure |
| Cron security | No secret, wrong secret, valid secret, no external fetch before auth |
| Ingestion | Success, external timeout, malformed response, one failed batch, replayed payload |
| UI mutations | Star rollback, collection toggle rollback, privacy update failure, delete failure, create failure |
| Quality | lint, test, build, CI, no secret leakage |

## 8. Rollout and rollback

### Before rollout

- Apply the schema migration for any analytics view/run-history table in development first.
- Configure `CRON_SECRET` in the deployment environment before enabling protected routes.
- Run one authorized sync in a staging/development project and inspect the run record.
- Compare pre/post resource counts and analytics coverage.
- Confirm public and private collection behavior with separate accounts.

### Rollout

1. Deploy code and schema together when required.
2. Keep the old data readable while new analytics/run-history records are populated.
3. Trigger one authorized ingestion job manually.
4. Monitor route responses, ingestion run status, external API errors, and collection access.
5. Enable the scheduled job after the manual run is healthy.

### Rollback

- Disable the scheduled cron if ingestion produces partial or unsafe data.
- Revert route code while retaining additive run-history records where possible.
- Do not remove historical analytics or collection data as part of an application rollback.
- If a schema view is incompatible, restore the prior query path before retrying the migration.

## 9. P0 completion definition

P0 is complete only when all of the following are true:

- F0.1–F0.6 acceptance criteria are met.
- The private collection access matrix passes against real RLS behavior.
- All scheduled ingestion routes fail closed and produce auditable outcomes.
- Analytics values and browse rankings have an explicit latest-row contract.
- User mutations communicate failures and reconcile optimistic state.
- `npm run lint`, `npm test`, and `npm run build` pass locally and in CI.
- [`APPLICATION_CONTEXT.md`](./APPLICATION_CONTEXT.md), [`ROADMAP.md`](./ROADMAP.md), and contributor/agent guidance describe the new behavior accurately.
