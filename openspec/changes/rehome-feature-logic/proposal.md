# Proposal

## Why

The heaviest logic in the client sits in the wrong Feature-Sliced Design layer: `pages/goals/model` (82 files, ~10K LOC), `pages/dailies/model` (~4.5K LOC of recommendation engines) and `entities/legendary-event` (~6K LOC, a 335-line barrel) are features and page internals mislabelled as pages and entities, and the `max-lines: 400` rule has manufactured ~25 hooks whose own comments say they exist "purely for that file's max-lines budget". Pre-launch is the last cheap moment to put code where the FSD intent says it belongs; after that every move competes with feature work.

Evidence (audit 2026-10-20): `apps/web/src/fsd/app/layout/app-shell.tsx:19` imports `CreateGoalSheet` / `CreateGoalLauncherProvider` from `@/pages/goals` (the shell lazy-loads a page module); `pages/goals/model/goal-creation-form/use-*.ts` (16 hooks split out of `use-create-goal-form.ts` for max-lines); `entities/legendary-event/lib/*` where `battle-preview`, `current-run`, `horde-strategy`, `lane-label`, `lane-teams`, `objective-label`, `team-support` each have exactly one consumer in the Legendary Events page; six `features/legendary-event-*` slices (403–3,238 LOC each) fragment one plan aggregate; `app/providers/` holds ~1,000 LOC of account-menu UI (`account-card.tsx`, `account-menu-parts.tsx`, `guest-account-menu.tsx`, `theme-switcher.tsx`, `account-avatar.tsx`, `player-data-sync-button.tsx`, `catalog-sync-status-badge.tsx`) beside the providers; `apps/web/knip.json` lists `src/fsd/entities/*/index.ts` as entries so unused entity exports are never reported; `packages/ui/src/components/hover-card.tsx` and `toggle.tsx` have no consumer and 12 of 23 `sidebar.tsx` exports are unused.

## What Changes

- **Goals logic becomes a feature.** `pages/goals/model` moves to `features/goal-planning` (data, estimates, attainment, blockers, insights, projects) and `features/goal-create` (creation form, launcher, preview, submission; edit and target-edit fold in as the same form family). `pages/goals` keeps routes, pages and page-only composition. `CreateGoalSheet` and `CreateGoalLauncherProvider` are exported by `features/goal-create`, so `app/layout/app-shell.tsx` and `app/routes.tsx` stop importing a page.
- **Dailies engines become features.** `team-recommendations.ts`, `hse-team-recommendations.ts`, `hre-team-recommendations.ts`, `team-recommendation-prefs.ts` move to `features/team-recommendations`; `shop-recommendations.ts`, `shop-needs.ts`, `use-shop-recommendations.ts` move to `features/shop-recommendations`. The existing `features/goal-farming/@x/daily-raids` (23 importers) and `features/shop-rewards/@x/*` cross-feature surfaces are reviewed and trimmed to what the moved code still needs.
- **Legendary Events consolidated.** `entities/legendary-event/lib` files with a single page consumer move into `pages/legendary-events`; `features/legendary-event-annotations`, `legendary-event-run-inputs` and `legendary-event-team-suggestions` fold into `features/legendary-event-plan` beside `legendary-event-teams`; `legendary-event-tokens` and `legendary-event-goals` stay. The entity barrel shrinks to the API, types, queries and shared domain functions it actually exports to more than one slice (target: under 120 lines).
- **Shell UI leaves `app/providers`.** Account-menu UI moves to `widgets/account-menu`; `app/providers` keeps providers only. Desktop and mobile navigation share one item-resolution path (`nav-items.ts`, `resolve-active-navigation.ts`, `navigation-filter.ts` consumed by both layouts, no per-layout copies).
- **Lint and dead exports.** `max-lines` is raised to a ceiling that stops manufacturing files (800, warn-only) and the max-lines-only micro-hooks are merged back into their parent hook where that reads better; `knip.json` drops the `entities/*/index.ts` entry exemption and the exports it then reports are removed; `hover-card.tsx`, `toggle.tsx` and the unused `sidebar.tsx` exports are deleted from `packages/ui`.
- No user-visible behavior changes. Pure structural refactor: `skip_specs: true`.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- none — moving code between slices, merging hooks and deleting unused exports changes no requirement. `.openspec.yaml` sets `skip_specs: true`.

## Impact

- Apps only; no companion `tacticus-planner-api` change.
- Moves: `apps/web/src/fsd/pages/goals/model/**` → `features/goal-planning`, `features/goal-create`; `pages/dailies/model/{team,hse-team,hre-team}-recommendations.ts`, `team-recommendation-prefs.ts`, `shop-*.ts`, `use-shop-recommendations.ts` → `features/team-recommendations`, `features/shop-recommendations`; `entities/legendary-event/lib/{battle-preview,current-run,horde-strategy,lane-label,lane-teams,objective-label,team-support}.ts` (+ tests) → `pages/legendary-events`; `features/legendary-event-{annotations,run-inputs,team-suggestions}` → `features/legendary-event-plan`; `app/providers/{account-card,account-menu-parts,guest-account-menu,theme-switcher,account-avatar,player-data-sync-button,catalog-sync-status-badge}.tsx` → `widgets/account-menu`.
- Config: `apps/web/eslint.config.js` (`max-lines`), `apps/web/knip.json`, `packages/ui/src/components/{hover-card,toggle,sidebar}.tsx` and the package exports map.
- Tests: every test that mocks a moved module by deep path (`vi.mock("@/pages/goals/model/...")`, `vi.mock("@/entities/legendary-event/lib/...")`) must be repointed, which is why this change **depends on `test-harness-render-app`** (page tests rendered through a real router/i18n/MSAL stub instead of path mocks) and **follows `catalog-read-layer`** (which rewrites the catalog read hooks the goals and dailies models call; moving them first would mean moving twice).
- Overlap with in-flight changes, resolved by ordering: `tune-client-query-caching` edits `pages/goals/model/goals-data/use-goal-actions.ts`, `use-goal-edit-save.ts`, `use-project-actions.ts` — it lands first, this change moves the edited files. `add-debug-info-export` adds a button in `app/providers/account-card.tsx` — if it lands first the button moves with the card; if later, it targets `widgets/account-menu`. `rebuild-foundation-pre-launch` reshapes `entities/*` API types — independent of file locations here. `fix-translated-label-truncation` touches no moved file.
- Validation: `pnpm lint:fsd` (steiger) clean, knip clean with the exemption removed, no `pages/*` import from `app/layout`, LE barrel under 120 lines, test count unchanged.
