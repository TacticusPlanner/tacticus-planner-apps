## Why

The only way to start creating a goal today is one global, shell-level button
(`app-shell.tsx`, wired through `CreateGoalLauncherContext` and rendered in
desktop/mobile chrome). Goals Overview (`goals-page.tsx`) and Project Detail
(`project-detail-page.tsx`) never call `useCreateGoalLauncher()` at all, so a
user managing goals in either place has to leave that context to find
creation. On Project Detail this is worse than inconvenient: the one
goal-adding action there (`onAddGoals` → `AddGoalsToProjectSheet`) only
assigns an _existing_, currently-unassigned goal — there is no way to start a
brand-new goal already scoped to the project being viewed, so creating one
from a project context silently falls back to the default project instead.

## What Changes

- Add a Create Goal entry point to the Goals Overview toolbar, next to the
  existing Type/Sort/Group and project-membership filters, following the same
  icon-with-hidden-label pattern the Planning Settings button already uses so
  it renders on both desktop and mobile without a separate mobile-only
  affordance. This is new UI wiring against the already-portable
  `useCreateGoalLauncher()` hook — no new plumbing.
- Add a second, distinct action to the Project Detail header — "Create goal"
  — alongside the existing "Add goals" action, that launches goal creation
  scoped to the viewed project. "Add goals" keeps its existing meaning
  (assign an existing, unassigned goal); the new action starts a new one.
- Offer the same project-scoped Create goal action in the project's three-dot
  menu and as a clearly separated choice in Add Goals, so the paths people
  already use to manage a project can start a new goal too. Keep pending
  Add Goals selections recoverable when switching to creation.
- Widen `CreateGoalPrefill` (`create-goal-launcher-context.ts`) with a
  project-only variant carrying just `projectIds`, so a launch from a project
  context can preselect that project before the user has picked an entity or
  goal type. Wire `useCreateGoalPrefill` to apply this project preselection
  independently of the existing entity/goal-type prefill effect.
- Keep the existing global entry points (desktop sidebar button, mobile
  bottom-nav button, `Ctrl/Cmd+G` shortcut) exactly as they are — the new
  entry points are additions, not replacements.

## Capabilities

### New Capabilities

- `goal-creation-entry-points`: defines the contextual (non-global) places a
  user can start goal creation — the Goals Overview toolbar, Project Detail
  header/menu, and Add Goals sheet — and how a project-scoped launch
  preselects that project.

### Modified Capabilities

- `goals-navigation`: the Overview toolbar's enumerated control set (desktop
  single-row requirement, mobile icon-only-compression requirement) gains the
  new Create Goal entry point alongside the filters it already lists.
- `project-management`: the detail route gains a second, distinct
  goal-adding action ("Create goal") next to the existing "Add goals" one,
  scoped to the viewed project, with matching menu and Add Goals-sheet paths.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx` — new toolbar
  button calling `useCreateGoalLauncher()`.
- `apps/web/src/fsd/pages/goals/ui/projects/project-detail-header.tsx` and
  `project-detail-page.tsx` — header and menu "Create goal" actions calling
  `useCreateGoalLauncher()` with the viewed project's id.
- `apps/web/src/fsd/features/project-management/ui/add-goals-to-project-sheet.tsx`
  — distinct Create goal choice and recoverable pending Add Goals draft.
- `apps/web/src/fsd/pages/goals/model/goal-creation-form/create-goal-launcher-context.ts`
  — widened `CreateGoalPrefill` union (new project-only variant).
- `apps/web/src/fsd/pages/goals/model/goal-creation-form/use-create-goal-prefill.ts`
  — apply project-only prefill independently of the entity/goal-type prefill
  effect.
- Translation additions (all four locales) for contextual action labels.
- No backend/API changes — apps-only, no companion `tacticus-planner-api`
  change.
