## Why

The multi-day raid plan ("Raids Plan") is a forward-looking planning artifact —
51 days, 26,950 energy, a completion date — but it lives as a sub-tab of
Dailies › Raids, whose description is "Spend today's energy on your active
goals". It belongs beside Goals and Insights in the Plan section, and Dailies ›
Raids should be just Today.

## What Changes

- **BREAKING**: `/dailies/raids/plan` is removed; the plan becomes
  `/plan/schedule`, a new Plan section child page labelled **Schedule**. No
  redirect (greenfield). Wherever other specs say "Raids Plan", they now mean
  Schedule.
- **BREAKING**: Dailies › Raids loses its Today/Plan sub-tab bar and the
  `/dailies/raids/today` path: `/dailies/raids` renders Today directly. The row
  that held the sub-tabs keeps the project selector (icon-only on mobile) and
  the Planning Settings trigger, now right-aligned on their own.
- Schedule owns its own session-local project selection (shared selector
  component, "All goals" default, not persisted, independent of Today's and of
  Goals' project scope) instead of sharing Dailies' outlet-context selection. It
  also renders a Planning Settings trigger trailing its selector, since its
  totals depend on daily energy.
- The Raids Plan page component, its tutorial, and the UI it shares with Today
  (`RaidSchedule`, `ResourceCard`/`UnitIcon`, `RaidState`) move so a Plan page
  can render them without importing from `pages/dailies`: the shared pieces go
  to `features/daily-raids/ui`, the page to `pages/goals/ui/schedule/`.
- No change to the plan's content, calculations, density toggle, day paging,
  or Raided split.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `daily-raids-plan`: the page's location becomes `/plan/schedule` under Plan;
  it owns its project selection instead of sharing Today's.
- `dailies-navigation`: Raids has no sub-tabs; the Raids tab is the Today page;
  the selector/Planning Settings row remains without tabs.
- `goals-navigation`: the Plan child-page list gains Schedule; Planning Settings
  is offered on Goals and Schedule (still not on Projects or Insights).
- `app-navigation`: the header child-picker requirement drops its third-level
  Raids sub-tab carve-out and its stale nested-route examples.
- `planning-settings-access`: the Raids entry point is Today's; Schedule carries
  its own.
- `daily-raids-today`: Today's project selector is no longer "shared with Raids
  Plan".

## Impact

- **Moved**: `apps/web/src/fsd/pages/dailies/ui/raids-plan-page.tsx` →
  `pages/goals/ui/schedule/schedule-page.tsx`; `raids-plan.tutorial.tsx` →
  `schedule-page.tutorial.tsx`; `pages/dailies/ui/raid-schedule.tsx`,
  `resource-card.tsx`, `raid-state.tsx` → `features/daily-raids/ui/` (exported
  from the feature index). `pages/dailies/ui/plan-blockers.tsx` is currently
  unreferenced on `main` and is left where it is.
- **Deleted**: `pages/dailies/ui/raids-layout.tsx` (+ test), the `RouteTabs`
  export in `dailies-layout.tsx`, the `raids/today` and `raids/plan` routes,
  and the `dailies:raids.tabs.*` keys.
- **Edited**: `pages/dailies/route.tsx` (Raids → Today directly),
  `pages/goals/route.tsx` (schedule child), `app/layout/nav-items.ts`
  (`/plan/schedule` child with `goals.tabs.schedule` /
  `scheduleDescription`), `pages/dailies/ui/today-page.tsx` (hosts the
  selector + Planning Settings row and the dialog state that `RaidsLayout`
  held), `pages/home/ui/raids/raids-widget.tsx` (links to `/dailies/raids`),
  `section-tabs.test.tsx`, `dailies-layout.test.tsx`, route tests.
- **i18n**: `goals.tabs.schedule` + `scheduleDescription` in `common.json`
  (en/de/es/fr); the Schedule page keeps using the `dailies` namespace for its
  existing `plan.*` and `tour.raidsPlan.*` keys (that namespace is preloaded
  app-wide), so no key migration.
- **Branch note**: `feat/raids-plan-v1-strip-and-planner-alignment` (commit
  `39ec378a`) rewrites Raids Plan's internals into `pages/dailies/ui/plan/*`
  and `model/plan-day-cells.ts` and starts using `plan-blockers.tsx`. This
  change is presentation-agnostic; if that branch merges first, those files
  join the move list (see design.md).
- No backend/API changes; no companion `tacticus-planner-api` change.
