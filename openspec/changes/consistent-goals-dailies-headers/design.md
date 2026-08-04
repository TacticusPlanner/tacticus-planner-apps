## Context

See `proposal.md` - Why/What Changes for motivation and scope. Relevant current state:

- `GoalsLayout` (`pages/goals/ui/goals-board/goals-layout.tsx`) wraps Overview/Projects/Insights and owns the Planning Settings button + dialog state.
- The "Unfulfilled/Reached/Archived" `TabsList` is duplicated near-verbatim in `goals-page.tsx` (Overview) and `projects-page.tsx` (Projects).
- Overview's Type/Sort/Group filter row already has a working mobile pattern (`isMobile ? null : <SelectValue />`, `aria-label` + `sr-only` text) that nothing else in Goals/Dailies reuses yet.
- Three separate project-selector implementations exist: the shared `ProjectSelect` entity component (`entities/project/ui/project-select.tsx`), a hand-rolled equivalent in `insights-page.tsx`, and `ProjectSelect` again inside `ProjectToolbar` (`features/project-management/ui/project-toolbar.tsx`).
- Projects' only CRUD surface is `ManageProjectsSheet`, a slide-out `Sheet` opened from `ProjectToolbar`'s "Manage" button.
- Each goal row already has its own pause/resume/archive/delete menu (`goals-board/goal-row-actions.tsx`), independent of the project-level bulk actions being removed.
- `raids-layout.tsx` stacks `RouteTabs` and `ProjectSelect` in two rows; `raids-plan-page.tsx` stacks the stats strip, then the Collapse/Expand button, then the day-card grid (`grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))`) in three rows.

## Goals / Non-Goals

**Goals:**

- Eliminate rows that hold a single stranded control by pairing every such control with an adjacent row.
- Collapse the duplicated status `TabsList` into one shared control used by both Overview and Projects.
- Make every project selector in Goals/Dailies the same component, in the same relative position.
- Replace Projects' Sheet-based CRUD with inline, on-page management.
- Stop the Raids Plan day-card grid from stretching cards to fill unused row width.

**Non-Goals:**

- No change to goal attainment/estimate calculation logic, or to `GoalsList`'s row rendering itself.
- No change to Insights' summary/bottleneck content — only its project selector.
- No change to Today's layout or to how Today/Plan share project selection (already correct).
- No backend/API changes, no new project data fields.
- No feature-flagging or compatibility shim — pre-production V2, per `destructive-changes-policy`.

## Decisions

**1. Shared `StatusFilterSelect` in `pages/goals/ui/shared/`.** Overview and Projects are both inside the `pages/goals` slice already (different routes, same slice), so a shared subcomponent there doesn't cross an FSD boundary. It owns the Unfulfilled/Reached/Archived enum, i18n labels, per-option counts, and the reached-indicator dot (shown when the Reached count > 0 and the current value isn't "Reached"). Both counts are already computed by each page today (`goals-page.tsx` `tabCounts`, `projects-page.tsx` `counts`) for the old tab labels, so the indicator needs no new data fetch. _Alternative considered:_ keep `TabsList` and just shrink it — rejected, the ask was explicitly a single select, and a select is materially narrower, which is what makes the one-row merge fit.

**2. Shared `GoalFilters` (Type/Sort/Group) component + hook, same slice.** Extract Overview's existing filter row (`goals-page.tsx:192-268`) and its `goalType`/`sort`/`group` state/filtering logic into `pages/goals/ui/shared/`, and have Projects consume the same hook + component rather than re-implementing it. Per the confirmed decision, behavior must be identical to Overview's, not a variant — a shared hook is what keeps that true over time instead of the two pages drifting the way the old `TabsList` copy already had.

**3. Planning Settings moves from `GoalsLayout` into `GoalsPage`.** Its button and dialog-open state move down into `goals-page.tsx`, merged into the new consolidated row; `GoalsLayout` shrinks to just `PageContainer` + `Outlet`. No other page needs this state, so no context/prop drilling is introduced.

**4. Insights swaps its inline `<Select>` for the existing `ProjectSelect`.** Drop-in: Insights never used `allowAll`, and `ProjectSelect`'s default (`allowAll = false`) already matches. No new component needed here.

**5. `ProjectSelect` (entities/project) gains its own compact/icon-only mode.** Rather than have every consumer re-derive `isMobile ? null : <SelectValue />` (as Overview's filters do today), `ProjectSelect` reads `useIsMobile()` itself and renders icon-only below the 768px breakpoint, keeping the accessible name. _Alternative considered:_ leave `ProjectSelect` unchanged and let each page wrap it with its own conditional — rejected, that reintroduces the exact per-page duplication this change removes; fixing it once in the shared component is the point of standardizing on one component at all.

**6. `RaidsLayout` renders `RouteTabs` and `ProjectSelect` in one flex row** (tabs leading, selector trailing), using #5's built-in compact mode on mobile — no new logic needed there beyond the layout change itself.

**7. `raids-plan-page.tsx` — two independent, mechanical changes:**

- Move the Collapse/Expand `Button` into the existing `plan-summary` grid section as a trailing element instead of its own `flex justify-end` block below it; icon-only on mobile (chevron/expand glyph, same accessible-name pattern as the rest of this change).
- Change the day-card grid's `grid-template-columns` from `repeat(auto-fit,minmax(20rem,1fr))` to `repeat(auto-fit,minmax(20rem,24rem))`. CSS Grid's `auto-fit` collapses tracks with no item to width 0, so with fewer visible days than fit per row, the rendered cards cap at 24rem each and the remainder of the row stays empty instead of each card stretching to consume it. Pure CSS; no JS sizing logic needed. 24rem is a starting value to sanity-check visually against 1/2/3/6 visible days during implementation, not a hard requirement from the spec (the spec requires "a comfortable maximum," not a specific number).

**8. Projects' inline management surface replaces `ProjectToolbar` + `ManageProjectsSheet`,** both retired from `features/project-management/ui/`. A new component in the same slice (e.g. `project-management-list.tsx`) renders the project rows and their inline edit form, reusing `ProjectColorPicker`, `ProjectColorDot`, and the existing `useProjectActions` hook (`create`/`save`/`activate`) unchanged. The hook's `bulkStatus` method loses its only call sites (Pause all/Resume all); confirm during implementation whether anything else still calls it before deciding whether to delete it from the hook too, versus just removing the UI that invoked it.

**9. Project selection on Projects moves from `ProjectSelect.onChange` to clicking a project row.** `ProjectsPage` keeps its existing `selectedProjectId` state; the new inline list becomes what sets it, instead of the retired toolbar's select.

**10. State ownership (repo rule: document who owns shared selection state).** Today/Plan's shared project-selection state continues to live in `RaidsLayout`/`DailiesOutletContext` — unchanged by this design, only the row it renders in changes. Overview intentionally has no project selection (cross-project view, per its own docstring) and this change doesn't add one. Projects owns its `selectedProjectId` locally, as it does today, now driven by row-click instead of a select.

## Risks / Trade-offs

- **Extracting `GoalFilters`/`StatusFilterSelect` touches both pages' render logic** → regression risk for existing filter/sort/group behavior. Mitigation: keep the extracted hook's external state shape and callback signatures identical to what `goals-page.tsx` has today; migrate call sites mechanically; existing Overview behavior/tests should be unaffected since nothing observable changes there, only where the code lives.
- **Removing `ProjectToolbar`/`ManageProjectsSheet` could strand other consumers** → Mitigation: grep for any import of either component before deleting (known at proposal time: `ProjectToolbar` has no consumer besides `projects-page.tsx` and its own test; `ManageProjectsSheet` is only opened from `ProjectToolbar`) — verify this hasn't changed since, then delete both.
- **`minmax(20rem, 24rem)` is easy to get visually wrong** (an unintentional-looking empty gutter after the last card) → Mitigation: check the Raids Plan page in-browser at 1, 2, 3, and 6+ visible days before marking that task done.
- **Planning Settings loses its Projects/Insights entry points** → confirmed intentional in discovery; no mitigation needed beyond what's already documented in `proposal.md`.

## Migration Plan

No data migration and no backend coordination — this is a frontend-only structural/layout change in a pre-production submodule. Ship as a normal PR merge; no feature flag, since `destructive-changes-policy` allows V2 breaking changes without a compatibility path.

## Open Questions

- Exact visual treatment of the reached-indicator (dot size/color token) and the day-card's precise maximum width (24rem is a starting point) are implementation-level styling decisions that don't change the specs, the approach, or the task breakdown — finalize them against existing design tokens during implementation.
