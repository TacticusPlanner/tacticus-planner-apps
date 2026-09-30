## Context

See proposal.md — Why. Current state on `main` (all under `apps/web/src/fsd`):

- `pages/dailies/route.tsx`: `raids` → `RaidsLayout` with children `today`
  (`TodayPage`) and `plan` (`RaidsPlanPage`), index redirecting to `today`.
- `pages/dailies/ui/raids-layout.tsx`: renders `RouteTabs` (Today | Plan, from
  `dailies-layout.tsx`), the `ProjectSelect` bound to `DailiesOutletContext`
  (`projectId`/`setProjectId` owned by `DailiesLayout`), a
  `PlanningSettingsTrigger`, and owns the settings dialog's open state so it
  survives sub-tab switches.
- `pages/dailies/ui/raids-plan-page.tsx` reads `projectId` from the outlet
  context, calls `useDailyRaids(projectId)` (a `features/daily-raids` hook), and
  renders the summary grid, density toggle, Show all days, and day `Card`s built
  from `RaidSchedule` (`raid-schedule.tsx`, which imports `resource-card.tsx`)
  with `RaidState` for non-ready states. `TodayPage` uses the same
  `RaidSchedule`, `RaidState`, plus `campaign-event-status.tsx` (Today-only).
  `plan-blockers.tsx` exists but nothing imports it on `main`.
- `pages/goals/route.tsx` + `app/routes.tsx` splice Plan children under
  `GoalsLayout`; `app/layout/nav-items.ts` lists Plan's children (Goals,
  Projects, Insights) with `goals.tabs.*` label/description keys in
  `common.json`; Dailies' keys live in the `dailies` namespace, which is
  preloaded app-wide.
- Insights (`pages/goals/ui/insights/insights-page.tsx`) is the existing model
  for a Plan page with its own local `projectId` state and a right-aligned
  `ProjectSelect`.
- FSD: pages must not import pages; `features/daily-raids` already re-exports
  UI (`ResourceIcon`, `LocationRow`) and cross-imports `features/goal-farming`
  through its `@x` entry.
- Branch `feat/raids-plan-v1-strip-and-planner-alignment` (commit `39ec378a`,
  not on `main`) replaces the day `Card`s with `pages/dailies/ui/plan/*`
  (`plan-day-strip`, `plan-day-card`, `plan-material-cell`, `plan-unit-filter`,
  `use-drag-scroll`), adds `model/plan-day-cells.ts`, and renders
  `PlanBlockers`.

## Goals / Non-Goals

**Goals:**

- Relocate the page and its navigation; keep its behavior byte-for-byte.
- Leave Today's behavior unchanged apart from losing the sub-tab bar.
- Respect FSD: shared Raids UI moves to the feature layer once, no page-to-page
  import.

**Non-Goals:**

- Any redesign of the plan's presentation (that is the feature branch's job).
- Merging Schedule into Insights.
- Redirects for the removed `/dailies/raids/plan` and `/dailies/raids/today`
  paths (greenfield; user decision).
- Changing Planning Settings semantics.

## Decisions

### D1. Route and name: `/plan/schedule`, "Schedule"

Added as the fourth Plan child in `pages/goals/route.tsx` and `nav-items.ts`
(`goals.tabs.schedule`, `goals.tabs.scheduleDescription`). "Schedule" avoids a
"Plan › Plan" breadcrumb and describes the content (day-by-day). Alternatives:
"Timeline" (fine, but the page already says "days"), folding into Insights
(Insights is an aggregate page and already dense), keeping "Raids Plan" as the
label (the section name already carries "Plan").

### D2. Page slice: `pages/goals/ui/schedule/`

`raids-plan-page.tsx` → `pages/goals/ui/schedule/schedule-page.tsx`
(`SchedulePage`), `raids-plan.tutorial.tsx` → `schedule-page.tutorial.tsx`
(`useScheduleTutorial`). Existing tests move with them. The page keeps
`useTranslation("dailies")` for its `plan.*` and tour keys — moving ~20 keys ×
4 locales buys nothing and the namespace is preloaded app-wide (see the comment
in `nav-items.ts`). Alternative: a new `pages/schedule` slice with its own
route splice in `app/routes.tsx` — more files for no boundary benefit, since
Plan's children are all owned by `pages/goals` today.

### D3. Shared Raids UI moves to `features/daily-raids/ui`

`raid-schedule.tsx`, `resource-card.tsx`, and `raid-state.tsx` move to
`features/daily-raids/ui/` and are exported from the feature's `index.ts`
(`RaidSchedule`, `RaidState`, plus `UnitIcon`/`ResourceCard`/`GoalTargetBadge`
if a page imports them directly). Both `TodayPage` and `SchedulePage` import
from `@/features/daily-raids`. `campaign-event-status.tsx` stays in
`pages/dailies` (Today-only). `plan-blockers.tsx` stays put on `main` (unused);
if the feature branch has merged, it and `ui/plan/*` + `model/plan-day-cells.ts`
move the same way. Their `i18n` calls (`useTranslation("dailies")`) are
unaffected by the move. Existing tests for these components move with them and
are the regression net for Today.

### D4. Schedule owns its project selection like Insights

`SchedulePage` holds `const [projectId, setProjectId] = useState<string>()`,
reads `useProjects()` for the selector, renders `[ProjectSelect allowAll]
[PlanningSettingsTrigger]` right-aligned in its own row (the `goals-navigation`
"stands alone" case, plus the trigger), and owns the settings dialog state. No
outlet context. Alternative: share a selection with Today via a global store —
rejected; the pages are in different sections and `goals-navigation` already
requires project-aware pages to start from "All goals" independently.

### D5. Dailies › Raids becomes Today directly

- `pages/dailies/route.tsx`: `{ path: "raids", element: <TodayPage /> }`; the
  `raids/today` and `raids/plan` children and the index redirect are removed.
- `RaidsLayout` is deleted; its selector + settings row and dialog state move
  into `TodayPage` (there is no longer a second sub-page to keep state across).
  `RouteTabs` becomes unused and is deleted from `dailies-layout.tsx`.
- `DailiesOutletContext` keeps providing the Dailies-wide project selection to
  Today, Shops, Arena, Onslaught, Salvage Run — unchanged.
- `pages/home/ui/raids/raids-widget.tsx` links change from
  `/dailies/raids/today` to `/dailies/raids`.
- `dailies:raids.tabs.*` keys are deleted (the tour step key that referenced
  "Raid views" is updated in the same task).

### D6. Desktop / mobile

No new split. Schedule's selector row follows Today's existing rule (icon-only
selector below 768px, labeled above). Tour targets are unchanged
(`data-testid`s move with the components).

## Risks / Trade-offs

- [Today regresses during the FSD move] → Tests for `raid-schedule`,
  `resource-card`, `raid-state`, and `today-page` move and must pass; `pnpm
lint:fsd` guards the boundary.
- [Feature branch lands first and the move list is stale] → Design D3 names the
  extra files; tasks 1.x say "as of main; add the branch's files if merged".
- [Users look for the plan under Dailies] → The Plan section's picker lists
  Schedule; the home Raids widget still points at Today. No redirect by
  decision.
- [Spec text elsewhere still says "Raids Plan"] → Covered by the blanket
  sentence in `daily-raids-plan` "Schedule is a Plan section page"; no need to
  edit `goal-farming-estimates`, `global-goal-priority`, etc.
- [Two Planning Settings triggers in Plan] → Intentional and specified; both
  open the same dialog.

## Migration Plan

Frontend-only, one PR, no data migration. Rollback = revert.
