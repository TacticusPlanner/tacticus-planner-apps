## 1. Extract the daily-raids schedule engine into `features/daily-raids`

- [x] 1.1 Move `use-daily-raids.ts` and its calc modules (`daily-raids-calc.ts`, `daily-raids-energy.ts`, `daily-raids.domain.ts`, `location-visibility.ts`) from `pages/dailies/model` into a new `features/daily-raids` slice, exposed through its public API; verify `pnpm lint:fsd` passes with no page-to-page import introduced. Also extracted `ResourceIcon`/`ResourceIconWithTooltip` (shared rendering primitives, previously page-local) into the new slice's `ui/resource-icon.tsx`. `pnpm lint:fsd` passes; required adding `@x` cross-import files (`features/goal-farming/@x/daily-raids.ts`, `features/rank-lookup/@x/daily-raids.ts`) since the moved code now lives in a feature and steiger forbids feature-to-feature imports without that escape hatch — not anticipated in design.md, resolved using this repo's existing `@x` convention (see `entities/goal/@x/account.ts` precedent).
- [x] 1.2 Update `pages/dailies`'s Today/Plan pages and `raid-schedule.tsx`/`resource-card.tsx` to consume the moved hook/calc only through `features/daily-raids`'s public API; verify the existing Today/Plan/Bonus-Raids/Today's-Attempts test suites pass unchanged. Verified: 471 tests pass across `features/daily-raids`, `features/goal-farming`, `features/rank-lookup`, `pages/dailies`.
- [x] 1.3 Add (or relocate) the "Active project, falling back to Default" resolver to `features/daily-raids`'s public API so Today and the new home widget share one implementation; verify Today's existing default/fallback tests still pass. Resolved: this already lives at `entities/project`'s `useProjects()` (`activeProjectId ?? defaultProjectId`, one layer below both features/pages) — `pages/dailies/ui/dailies-layout.tsx` already consumes it this way. No new wrapper added in `features/daily-raids`; the home raids widget (task 5.1) calls `useProjects()` the same way instead of duplicating logic.
- [x] 1.4 Implement the location-flattening/dedup function (merge same-location raids across goals, summing raid counts; exclude Bonus Raids, Today's Attempts, and real-attempts-exhausted nodes) in `features/daily-raids`, per the home-raids-widget spec's worked examples; add unit tests for the shared-node merge and the single-goal passthrough cases. `flatten-today-locations.ts` + 5 unit tests, all passing.
- [x] 1.5 Implement a compact per-location row component (compact location chip + raid count + primary reward icon, no unit portrait or goal label — ported from V1's `LocationRow` pattern) in `features/daily-raids`'s public API. `ui/location-row.tsx`, reusing existing `dailies:schedule.*` i18n keys.

## 2. Extend `features/project-management` for the home widget

- [ ] 2.1 Add a condensed project-card component (color, name, available/blocked/estimate summary, no lifecycle actions) to `features/project-management`'s public API; verify it renders correctly both for a project with a loaded summary and one with a still-loading summary (skeleton).
- [ ] 2.2 Add a selector/hook returning Current-plan-first, non-archived projects capped to 3, plus a remaining count, for home's use; unit-test: ≤3 projects (no cap), >3 projects (capped + remaining count), no Current plan set, archived projects excluded.

## 3. Build the Token Availability widget (page-local to `pages/home`)

- [ ] 3.1 Port the token derivation logic (regen countdown, capped/over-cap detection, projected-count-from-last-sync) into `pages/home/ui/token-availability/`, sourced from the existing `gameModeTokens` player-data query; unit-test the worked examples in the home-token-availability spec (below-max countdown, at-max capped, missing token type).
- [ ] 3.2 Build the per-token card row UI (icon, current/max, countdown or capped state) and the stale-data sync banner wired to the existing `player-data-sync-button` action; verify loading/failure/empty states render distinctly.

## 4. Build the Your Projects widget

- [ ] 4.1 Build the widget shell consuming `features/project-management`'s condensed card and capped selector, including the "+N more" link to `/goals/projects` and per-card navigation to `/goals/projects/{id}`; verify against the home-projects-widget spec's truncation and navigation scenarios.
- [ ] 4.2 Build the no-projects empty state and the loading/failure states; verify each renders distinctly.

## 5. Build the Daily Raids widget

- [ ] 5.1 Build the widget shell consuming `features/daily-raids`'s flattened schedule and compact row component, scoped to the Active/Default project; verify against the home-raids-widget spec's scenarios (plain row, exhausted-node exclusion, Bonus-Raids/Today's-Attempts exclusion, shared-node merge).
- [ ] 5.2 Build the "nothing to raid today" empty state, the no-projects state, and the readiness-gated loading state (deferring render until real synced-attempts data is available); verify each renders distinctly.
- [ ] 5.3 Wire whole-widget navigation to `/dailies/raids/today`.

## 6. Compose the home page

- [ ] 6.1 Update `home-page.tsx` to render Token Availability, then the Projects/Raids pair, then the calendar last — desktop side-by-side for Projects/Raids, mobile fully stacked in the same order; verify at one viewport ≥768px and one <768px.
- [ ] 6.2 Extend `home-page.tutorial.tsx` to cover the three new sections on both desktop and mobile, registered via `useTourPageSteps`.

## 7. i18n

- [ ] 7.1 Add i18n keys for all new widget copy (Token Availability labels/banner, Your Projects labels/empty state, Daily Raids labels/empty state, new tutorial step titles/content) to the appropriate `apps/web/public/locales` namespace(s); translate to de/es/fr at the quality of sibling namespaces — no placeholder English left in non-English files.

## 8. Verification

- [ ] 8.1 Manual browser verification on the full local stack (Aspire) covering: a Current-plan project whose goals contribute to today's schedule, a shared-node scenario (two goals raiding the same location), an account with no projects, and an account with today's raids already exhausted — at one desktop and one mobile viewport.
- [ ] 8.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass.
