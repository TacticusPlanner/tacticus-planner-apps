## Context

See `proposal.md` - Why/What Changes for motivation and scope. Relevant current state:

- `GoalsLayout` (`pages/goals/ui/goals-board/goals-layout.tsx`) wraps Overview/Projects/Insights and owns the Planning Settings button + dialog state. Overview, Projects, and Insights all stay inside `pages/goals` (Decision 6, moving Projects to its own page slice, was dropped after implementation found `pnpm lint:fsd` rejects a sibling page slice importing `pages/goals`' shared `GoalsList`/`GoalDetailSheet`/hook infrastructure even through a public `index.ts` — see the removed decision's note below).
- The "Unfulfilled/Reached/Archived" `TabsList` is duplicated near-verbatim in `goals-page.tsx` (Overview) and `projects-page.tsx` (Projects).
- Overview's Type/Sort/Group filter row already has a working mobile pattern (`isMobile ? null : <SelectValue />`, `aria-label` + `sr-only` text) that nothing else in Goals/Dailies reuses yet.
- Three separate project-selector implementations exist: the shared `ProjectSelect` entity component (`entities/project/ui/project-select.tsx`), a hand-rolled equivalent in `insights-page.tsx`, and `ProjectSelect` again inside `ProjectToolbar` (`features/project-management/ui/project-toolbar.tsx`).
- Projects' only CRUD surface today is `ManageProjectsSheet`, a slide-out `Sheet` combining a project list (left) and a create/edit form (right), opened from `ProjectToolbar`'s "Manage" button. Its `save` call already sends `status`, with Archive using `"Archived"` and Restore using `"Active"`, and its Archive action is guarded by `disabled={actions.pending || selected.isDefault || selected.isActivePlan}` — this mapping and these guards carry over unchanged (see Decision 7).
- Each goal row already has its own pause/resume/archive/delete menu (`goals-board/goal-row-actions.tsx`), independent of the project-level bulk actions being removed.
- `raids-layout.tsx` stacks `RouteTabs` and `ProjectSelect` in two rows. `raids-plan-page.tsx` stacks the stats strip, then the Collapse/Expand button, then the day-card grid (`grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))`), then a separate "Show all days" button below the grid, in four rows total. `raids-layout.tsx` is shared by both the Today and Raids Plan sub-tabs, so the tabs+selector row merge (Decision 5) changes the header both sub-tabs render inside, even though neither sub-tab's own content changes.

## Goals / Non-Goals

**Goals:**

- Eliminate rows that hold a single stranded control by pairing every such control with an adjacent row.
- Collapse the duplicated status `TabsList` into one shared control used by both Overview and Projects.
- Make every project selector in Goals/Dailies the same component, in a consistent position appropriate to its page.
- Replace `ProjectToolbar` and narrow `ManageProjectsSheet` to a form-only Sheet, with project browsing and lifecycle actions moved onto the Projects page itself.
- Stop the Raids Plan day-card grid from stretching cards to fill unused row width.

**Non-Goals:**

- No change to goal attainment/estimate calculation logic, or to `GoalsList`'s row rendering itself.
- No change to Insights' summary/bottleneck content — only its project selector.
- No change to Today's own page content, or to how Today/Plan share project selection (already correct) — the shared Raids header those sub-tabs render inside does change (Decision 5), but that's a layout change to the shared `RaidsLayout`, not to either sub-tab's content.
- No backend/API changes, no new project data fields.
- No Type/Sort/Group filters on Projects (explicitly deferred — would complicate the project's priority-ordered goal list).
- No feature-flagging or compatibility shim — pre-production V2, per `destructive-changes-policy`.

## Decisions

**1. Shared `StatusFilterSelect` and `GoalFilters` both live in `entities/goal/ui/`.** Both are needed by Overview; `StatusFilterSelect` is also needed by Projects. Both Overview and Projects stay inside `pages/goals` (Decision 6 below), but the general rule still applies: code shared between two pages' UI belongs at or below the entity layer, not tucked into one page's local `shared/` folder, so it reads as commonly-owned rather than borrowed from whichever page happened to write it first. `StatusFilterSelect` owns the Unfulfilled/Reached/Archived enum, i18n labels, per-option counts, and the reached-indicator dot (shown when the Reached count > 0 and the current value isn't "Reached"); both pages already compute these counts today (`goals-page.tsx` `tabCounts`, `projects-page.tsx` `counts`), so the indicator needs no new data fetch. `GoalFilters` (Type/Sort/Group) is extracted from Overview (`goals-page.tsx:192-268`) and relocated the same way even though Projects won't consume it yet, per explicit decision, so it's already positioned correctly if that changes later — Overview switches to consuming it from `entities/goal/ui` rather than keeping a local copy. _Alternative considered:_ keep `GoalFilters` local to Overview since Projects doesn't need it now — rejected in favor of moving it preemptively.

**2. Planning Settings moves from `GoalsLayout` into `GoalsPage`.** Its button and dialog-open state move down into `goals-page.tsx`, merged into the new consolidated row; `GoalsLayout` shrinks to just `PageContainer` + `Outlet`. No other page needs this state, so no context/prop drilling is introduced.

**3. Insights swaps its inline `<Select>` for the existing `ProjectSelect`.** Drop-in: Insights never used `allowAll`, and `ProjectSelect`'s default (`allowAll = false`) already matches. No new component needed here.

**4. `ProjectSelect` (entities/project) gains its own compact/icon-only mode.** Rather than have every consumer re-derive `isMobile ? null : <SelectValue />` (as Overview's filters do today), `ProjectSelect` reads `useIsMobile()` itself and renders icon-only below the 768px breakpoint, keeping the accessible name. _Alternative considered:_ leave `ProjectSelect` unchanged and let each page wrap it with its own conditional — rejected, that reintroduces the exact per-page duplication this change removes.

**5. `RaidsLayout` renders `RouteTabs` and `ProjectSelect` in one flex row** (tabs leading, selector trailing), using Decision 4's built-in compact mode on mobile. This changes the shared header both Today and Raids Plan render inside; neither sub-tab's own content changes.

**6. ~~Projects becomes its own top-level page slice~~ — dropped; Projects stays inside `pages/goals`.** The original plan promoted Projects to a sibling `pages/projects` slice, nested under `/goals/project` inside `GoalsLayout` at the `app/routes.tsx` layer (the same "app composes top-level page slices" pattern used everywhere else, applied one level deeper for this one nested route). Implementation found this doesn't actually work: `pnpm lint:fsd` (steiger's `fsd/forbidden-imports` rule) rejects `pages/projects` importing anything from `pages/goals`' public API — same-layer page-to-page imports are forbidden even through `index.ts`. Projects' page depends on `pages/goals`-internal shared infrastructure (`GoalsList`, `GoalDetailSheet`, and roughly 20-30 supporting model/hook files for attainment, estimates, blockers, and insights) that Overview also uses; moving Projects out would first require extracting all of that into a new `widgets/` layer — a large, high-risk refactor of business-critical calculation code with no scope or review of its own. Decision: keep Projects at its current location, `pages/goals/ui/projects/projects-page.tsx`; the rest of this change (Decisions 7-9, sections 2-8) proceeds unchanged, just without the slice move. Revisit the `widgets/` extraction as its own, separately-scoped change if Projects' independence from Overview's internals becomes worth the cost later.

**7. Projects' management surface: `ProjectToolbar` is retired; `ManageProjectsSheet` is narrowed, not replaced.** The Sheet's embedded project list is removed (the list now lives permanently on the page instead), leaving the Sheet as a create/edit form only, opened either blank ("New project") or pre-filled (a row's "Edit" action). The new on-page list (`features/project-management/ui/project-list.tsx`, composed by `pages/goals/ui/projects/projects-page.tsx` per Decision 6) renders every project — including archived — as a row with inline lifecycle actions: Edit (opens the narrowed Sheet), Set active, Archive/Restore. The Sheet keeps the existing `status` mapping (Archive → `"Archived"`, Restore → `"Active"`) and the existing Archive guard (`disabled` when pending, default, or the active plan) unchanged from today's `ManageProjectsSheet` — that mapping/guard logic now lives in the list rows' own action handlers rather than the Sheet's, since lifecycle actions moved there and the Sheet itself is form-only. Bulk "Pause all"/"Resume all" are removed entirely — redundant with each goal's own row-level pause/resume.

**8. A plain `ProjectSelect`, placed after the project list, is what drives the goal list below — not row selection.** Clicking a project row only triggers that row's own actions (Edit/Set active/Archive/Restore); it does not change which project's goals the page displays. `ProjectsPage` keeps its existing `selectedProjectId` state, now set exclusively by the trailing `ProjectSelect`'s `onChange`, matching how every other project-scoped page in this change already works (Decision 4's shared component, trailing position). _Reverts an earlier draft of this decision_, which had row-click set the selection — dropped because it conflated two different jobs (managing a project vs. choosing which project's goals to view) in one gesture.

**9. `raids-plan-page.tsx`: three related, mechanical changes to the same summary area.**

- Move the Collapse/Expand `Button` into the existing `plan-summary` section as a trailing element instead of its own `flex justify-end` block below it.
- Move the "Show all days" button into that same area rather than leaving it below the day-card grid — it and Collapse/Expand both control the visible set of day columns, so they belong together instead of in two separate rows.
- Change the day-card grid's `grid-template-columns` from `repeat(auto-fit,minmax(20rem,1fr))` to `repeat(auto-fit,minmax(20rem,24rem))`. CSS Grid's `auto-fit` collapses tracks with no item to width 0, so with fewer visible days than fit per row, the rendered cards cap at 24rem each and the remainder of the row stays empty instead of each card stretching to consume it. Pure CSS; no JS sizing logic needed. 24rem is a starting value to sanity-check visually against 1/2/3/6 visible days during implementation, not a hard requirement from the spec.
- On mobile, Collapse/Expand renders icon-only; "Show all days" keeps its text (it's a one-time reveal action, not a persistent toggle, so there's less benefit to compressing it and no established icon for "reveal more days").

## Risks / Trade-offs

- **Extracting `GoalFilters`/`StatusFilterSelect` into `entities/goal/ui` touches Overview's render logic** → regression risk for existing filter/sort/group behavior. Mitigation: keep the extracted hook's external state shape and callback signatures identical to what `goals-page.tsx` has today; existing Overview behavior/tests should be unaffected since nothing observable changes, only where the code lives.
- **Narrowing `ManageProjectsSheet` changes its own existing tests significantly** (no more embedded list/selection state to test inside the Sheet) → Mitigation: split its current test coverage — list/selection behavior moves to the new on-page list's tests, form-submission/validation/Archive-guard behavior stays with the narrowed Sheet's tests.
- **Removing `ProjectToolbar` could strand other consumers** → Mitigation: grep for any import of it before deleting (known at proposal time: no consumer besides `projects-page.tsx`/the new Projects page and its own test) — verify this hasn't changed since, then delete.
- **`minmax(20rem, 24rem)` is easy to get visually wrong** (an unintentional-looking empty gutter after the last card) → Mitigation: check the Raids Plan page in-browser at 1, 2, 3, and 6+ visible days before marking that task done.
- **Planning Settings loses its Projects/Insights entry points** → confirmed intentional in discovery; no mitigation needed beyond what's already documented in `proposal.md`.

## Migration Plan

No data migration and no backend coordination — this is a frontend-only structural/layout change in a pre-production submodule. Ship as a normal PR merge; no feature flag, since `destructive-changes-policy` allows V2 breaking changes without a compatibility path.

## Open Questions

- Exact visual treatment of the reached-indicator (dot size/color token) and the day-card's precise maximum width (24rem is a starting point) are implementation-level styling decisions that don't change the specs, the approach, or the task breakdown — finalize them against existing design tokens during implementation.
