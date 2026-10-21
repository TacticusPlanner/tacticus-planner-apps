# Design

## Context

See proposal.md — Why. Steiger (`apps/web/steiger.config.ts`, FSD recommended rules minus `insignificant-slice`) already enforces layer direction, so every move below must keep pages → widgets → features → entities → shared and use `@x` for the one feature-to-feature edge that remains. The goals and dailies models call catalog read hooks that `catalog-read-layer` rewrites, and page tests mock moved modules by deep path, so this change runs after `catalog-read-layer` and `test-harness-render-app`.

## Goals / Non-Goals

**Goals:**

- Every slice holds only code whose consumers match its layer: pages compose, features own user-facing logic, entities own domain types/API/queries, `app/providers` owns providers.
- One mechanical move per unit, each leaving the test suite green and steiger/knip clean, so the change can land as a series of small PRs.
- Lint stops shaping code: no file exists only to satisfy `max-lines`.

**Non-Goals:**

- Rewriting any moved logic (hooks are moved and merged, not redesigned).
- Deleting the unrouted Dailies pages or `@tanstack/react-table` (`client-baseline-hardening`).
- Changing read hooks, memoization, URL state or lint strictness (`catalog-read-layer`, `memoize-render-hot-paths`, `persist-view-state-in-url`, `shell-accessibility-and-lint`).

## Decisions

1. **Two goal features, not three.** `features/goal-planning` (goals-data, estimate, attainment, blockers, farming, insights, projects, shared) and `features/goal-create` (goal-creation-form, goal-edit, target-edit, launcher). Edit and target-edit share the creation form's field hooks and preview, so a separate `goal-edit` feature would need a `@x` edge to `goal-create` for no gain. `features/goal-planning` exposes the hooks pages compose (`useGoalsData`, `useGoalActions`, `useGoalProjects`, `usePlanInsights`, estimate helpers); `features/goal-create` exposes `CreateGoalSheet`, `CreateGoalLauncherProvider`, `useCreateGoalLauncher`, `CreateGoalPrefill`, the edit dialog and target-edit entry points. The shell and routes import the launcher from `@/features/goal-create`. Where `goal-create` needs planning data (project list for the projects field) it goes through `features/goal-planning/@x/goal-create`, the same pattern as `goal-farming/@x/daily-raids`. Alternative: one `features/goals` slice — rejected, it would be a 10K-LOC feature with the same internal split and a 50-line barrel.
2. **Dailies engines split by what they recommend.** `features/team-recommendations` (team, HSE team, HRE team engines plus prefs) and `features/shop-recommendations` (shop engine, shop needs, hook). Both consume `features/goal-farming/@x/daily-raids`, which is renamed to `@x/recommendations` only if steiger requires a consumer-named `@x`; otherwise the existing surface is kept and trimmed. Page hooks (`use-daily-raids.ts` and siblings) stay in `features/daily-raids`.
3. **Legendary Events: single-consumer libs go to the page, plan features merge.** A lib file whose only importer is `pages/legendary-events` moves there with its test (`battle-preview`, `current-run`, `horde-strategy`, `lane-label`, `lane-teams`, `objective-label`, `team-support`; the exact list is recomputed at task time against the barrel's consumers, not file names). `legendary-event-annotations`, `legendary-event-run-inputs` and `legendary-event-team-suggestions` fold into `features/legendary-event-plan` because all three read and write the same plan revision through `use-plan-write-queue.ts`; `legendary-event-teams` is renamed into it. `legendary-event-tokens` (3.2K LOC) and `legendary-event-goals` stay separate: tokens is its own aggregate, goals bridges to the goals domain. The barrel keeps types, API, `queryOptions`, lifecycle, missions, master-table, team-size, run-inputs; everything else is imported from its new home. Alternative: leave the entity as is and only trim the barrel — rejected, the page-only libs would still be entity code with one consumer.
4. **Account-menu UI becomes `widgets/account-menu`.** Public API: `AccountMenu` (desktop), `GuestAccountMenu`, `PlayerDataSyncButton`, `CatalogSyncStatusBadge`, `ThemeSwitcher`. The providers it reads (`PlayerDataProvider`, `GameCatalogProvider`, theme) stay in `app/providers` and are consumed through their existing context hooks. `app/providers/auth-control.tsx` stays (it is a provider). Alternative: `features/account-management` — rejected, the menu composes several features (sync, theme, auth) which is what a widget is for.
5. **Navigation: one resolver, two layouts.** `nav-items.ts`, `use-nav-items.ts`, `resolve-active-navigation.ts`, `navigation-filter.ts`, `find-active-child.ts` are the single source for both `desktop-layout.tsx` and `mobile-layout.tsx`; any item-shaping logic duplicated inside either layout or in `mobile-drawer-sub-item.tsx` / `desktop-section-navigation.tsx` moves into those modules. They stay in `app/layout` (shell concern, not reusable).
6. **`max-lines` to 800 warn, micro-hooks merged.** The rule becomes `["warn", { max: 800, skipBlankLines: true, skipComments: true }]`. The 16 `use-*.ts` hooks under `goal-creation-form` and the other "purely for max-lines" splits are merged back into their parent only where the parent then reads as one unit (`use-create-goal-form.ts` regains its field hooks; pure calc files such as `goal-preview.ts`, `goal-spec-builder.ts`, `plan-insights-calc.ts` stay separate because purity, not length, justifies them). `raid-bosses-page.tsx` drops its `eslint-disable max-lines`. Alternative: delete the rule — rejected, a soft ceiling still flags genuine God files.
7. **knip without the entity exemption.** Remove `src/fsd/entities/*/index.ts` from `entry`; every export knip then reports is either deleted or, when a test is the only consumer, moved into the test. `packages/ui`: delete `hover-card.tsx`, `toggle.tsx` (keep `toggle-variants.ts` if `toggle-group.tsx` imports it), and the 12 unused `sidebar.tsx` exports (`SidebarFooter`, `SidebarGroupAction`, `SidebarInput`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`), with the package `exports` map updated.

## Risks / Trade-offs

- [Git history fragmentation across ~150 renames] → one commit per move unit with `git mv`, so `git log --follow` works; no edits inside the move commits.
- [Deep-path `vi.mock` in tests breaks on every move] → `test-harness-render-app` lands first; remaining path mocks are repointed in the same commit as the move (grep `vi.mock("@/pages/goals`, `vi.mock("@/entities/legendary-event`).
- [`tune-client-query-caching` and this change edit the same goal-action hooks] → that change merges first; this one moves the merged files. If it slips, rebase the move commit, never both at once.
- [Merging micro-hooks reintroduces long files that reviewers dislike] → cap at 800 with warn, and merge only hooks whose comment says max-lines was the sole reason.
- [`@x` surface grows (goal-planning → goal-create)] → one `@x` directory, listed exports only; steiger `fsd/forbidden-imports` stays on.

## Migration Plan

Land as ordered PRs, each green on `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, knip: (1) lint config + ui package deletions, (2) account-menu widget + nav dedupe, (3) dailies engines, (4) Legendary Events, (5) goals features. Rollback is reverting the PR; no data or contract involved.

## Open Questions

- Whether `features/goal-planning/@x/goal-create` is needed at all depends on how many project-selection helpers `goal-create` still imports after `catalog-read-layer`; decide when PR 5 starts (does not change the task list).
