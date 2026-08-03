## Why

V1's Daily Raids page is the only thing standing between a player's plan (goals + priorities) and knowing what to actually farm today. V2 has no equivalent yet — the `/dailies` route exists only as a placeholder. This change ships a working Raids > Today tab, scoped to a single project, redesigned for V2's stack (shadcn/Radix, i18next) rather than ported 1:1 from V1's MUI implementation.

## What Changes

- Add a `/dailies` nav section with 6 primary tabs: **Raids** (implemented, default) and Shops / Onslaught / Salvage Run / Arena / Guild Raids (each the existing "Under Construction" placeholder pattern, reused per tab).
- Add **Raids**' own two sub-tabs: **Today** (implemented, default) and **Raids Plan** (implemented — V1's "Daily Raids" section only; see below).
- Add **Today**: a read-only schedule of what to raid today for the currently-selected project's `Active`-status goals — one card per farmable upgrade/shard, listing which battle node(s) to raid and how many times, computed against `planningSettings.dailyEnergy` (default 288). Entries are grouped by the goal they're being farmed for, each group separated and labeled with that goal's unit and target, so it's clear why each upgrade is being raided.
- Add a **Bonus Raids** section below Today's schedule: upgrades that get zero raids under the real energy budget but would get some under an unlimited budget, ordered by the same goal-priority order the main schedule uses. An upgrade already partially raided today is excluded.
- Add empty states: no project selected (prompt to select one), and project selected but nothing farmable (explicit message, not a blank list).
- Add a project selector local to Today, independent of any other page's project selection; switching it recomputes the schedule for that project alone. Raids Plan reuses this same selected project (one selection shared across both Raids sub-tabs).
- Add **Raids Plan** (V1's "Daily Raids" section, read-only, ported to V2's per-goal-grouped conventions): a horizontally-paged, day-by-day view of the entire schedule, beginning with a Today card and continuing with Day 2 onward. A header summarizes the whole plan (total days, total energy, total raid-attempt count, count of days with significant unused energy, completion date); each day column repeats that day's own energy/raid-attempt totals plus its own per-goal-grouped raid list, reusing Today's card and grouping conventions. Days are initially limited to the first 3, with a "Show all days" control (same pattern as Bonus Raids' top-3 truncation), plus a card-density (collapse/expand) toggle.
- Make the Dailies shell, Today, and Raids Plan usable in both desktop and mobile layouts. Use unit/material art and compact icon-led stats throughout: mobile presents dense scan-friendly rows, while desktop auto-fills the available page width with readable goal/day columns instead of leaving a narrow centered schedule. The capabilities and interactions remain the same across breakpoints. Add page-local Joyride onboarding for both implemented Raids pages, including their local Dailies/Raids navigation, with desktop and mobile step coverage and localized tutorial copy.
- **Extract and extend the shared farming engine**: move the goal need-derivation + day-by-day scheduling core (currently colocated under `pages/goals/model/estimate` and `pages/goals/model/insights`) into a new `features/goal-farming` slice so both the Goals/Insights page and the new Dailies page consume one implementation. Extend the engine's single-day spend step to also return a node-level raid breakdown (upgrade, battle node, raid count) alongside its existing day-count/energy aggregates — additive only, existing Goals/Insights callers are unaffected.
- **Extract `entities/project`**: move the project list/active/default-project read model, the project color indicator, the "(Default, Active)" label formatting, and a plain project picker component out of `pages/goals` (currently the sole owner of everything project-related) into `entities/project`, so Today can select a project without duplicating that logic. Goal-project membership stays in `pages/goals` (Today never touches it).
- **Extract `features/project-management`**: move project create/edit, activate, bulk pause/resume, and member-priority reorder (currently `pages/goals`' `use-project-actions.ts`, `manage-projects-sheet.tsx`, `project-color-picker.tsx`, `project-toolbar.tsx`) into a new `features/project-management` slice. This has no second consumer yet — done at explicit request as a deliberate, documented exception to "don't extract single-use code," not a discovered reuse need (see design.md).

Explicit non-goals (deferred, not part of this change):

- Global/all-projects aggregation (V1's cross-project view) — single-project only this pass.
- Any interactivity: no mark-raided/energy-spent tracking, no TacticusAPI sync — Raids Plan is a read-only forward projection, not V1's live-tracked view (no "RAIDED" section, no per-raid dialogs, no character-filter click interaction).
- The 4 V1 shop sections (Guild/War/Rogue Trader/Crusade) — fully deferred behind the Shops placeholder.
- V1's inventory/related-upgrades/in-progress/finished/blocked accordions above "Daily Raids" — only the "Daily Raids" section itself is in scope this pass.

## Capabilities

### New Capabilities

- `dailies-navigation`: The `/dailies` route shell — 6 top-level tabs with Raids as the default landing tab, placeholder content for the other 5, and Raids' own Today/Raids Plan sub-tabs.
- `daily-raids-today`: The Today schedule itself — project scoping, the day-1 raid schedule (priority-ordered shared inventory, per-battle daily-attempt caps, energy budget), Bonus Raids, and all empty states.
- `daily-raids-plan`: The complete multi-day Raids Plan schedule (V1's "Daily Raids" section) — Today through completion from the same engine run, whole-plan summary stats, per-day totals, and pagination.

### Modified Capabilities

(none — no existing specs predate this change; the shared engine extraction is an internal architecture move covered in design.md, not a change to any existing capability's requirements)

## Impact

- **New**: `apps/web/src/fsd/features/goal-farming/` (extracted engine), `apps/web/src/fsd/features/project-management/` (extracted project mutations + management UI), `apps/web/src/fsd/pages/dailies/*` (responsive nav shell, Today and Raids Plan pages, and page-local tutorials), `entities/project/model/use-projects.ts`, `entities/project/ui/project-color-dot.tsx`, `entities/project/ui/project-select.tsx`, `entities/project/model/project-marker.ts`, a dedicated `dailies` i18next namespace (replacing the current placeholder strings in `common.json`).
- **Modified**: `apps/web/src/fsd/pages/goals/model/estimate/*` and `pages/goals/model/insights/plan-insights-calc.ts` (import the extracted engine instead of local relative paths; `spendDay`'s return type gains a new field); `pages/goals/ui/projects/projects-page.tsx` (imports `ProjectToolbar`/`useProjectActions`/`reorderedMemberIds` from `features/project-management` instead of local relative paths).
- **Terminology note**: V1's "Raid Tickets" icon (`raidTicket` in `tacticusplanner`) is not a separate in-game currency — it's a flavor icon over the same raid-attempt count (`raidsTotal`) the engine already computes (verified in `upgrades.service.ts`). V2 presents it as a plain raid-attempt count; no new resource is modeled.
- **Affected systems**: none outside `tacticus-planner-apps` — no backend/API changes, no new persisted state (Today is computed read-only from existing `projects`, `goals`, and `planningSettings` data).
