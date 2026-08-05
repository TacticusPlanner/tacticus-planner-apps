## Why

Goals and Dailies subpages evolved independently, so each built its own header/toolbar row instead of sharing one. Several controls — Planning Settings, three different project-selector implementations, Daily Raids Plan's Collapse button — end up stranded alone in an otherwise-empty full-width row, and the "Unfulfilled/Reached/Archived" status filter is duplicated as near-identical tab markup on two separate pages. Projects' only editing surface is a slide-out Sheet disconnected from the page it manages, leaving Projects itself close to empty. This change consolidates the header/toolbar rows for visual consistency and less wasted vertical space, and turns Projects into a dedicated, inline project-management surface.

## What Changes

- Planning Settings moves out of the shared `GoalsLayout` wrapper and renders only on the Overview subpage, merged into Overview's status row. **BREAKING**: Projects and Insights no longer expose a Planning Settings entry point.
- The duplicated "Unfulfilled/Reached/Archived" `TabsList` on Overview and Projects is replaced by one shared status Select (defaulting to "Unfulfilled") with a small indicator on the trigger when there are Reached goals not currently being viewed.
- Overview's status select, its Type/Sort/Group filters, and the Planning Settings button merge into a single row on desktop. On mobile, the status select keeps its own row (with its indicator); the filters and Planning Settings compress to icon-only triggers, extending the icon/aria-label pattern already used by Overview's filter selects.
- Insights' hand-rolled inline project `<Select>` is replaced by the shared `ProjectSelect` entity component, gaining the project color dot and default/active markers already used elsewhere.
- Every project selector across Goals and Dailies is standardized to the same trailing, right-aligned position, paired with that page's left-aligned tab/status row when one exists (Dailies already does this; Insights and the redesigned Projects page adopt it).
- Dailies' Today/Plan tabs and its project selector merge into one row instead of two stacked rows. On mobile, the project selector compresses to an icon-only trigger; the Today/Plan tab labels stay as text.
- Daily Raids Plan's "Collapse/Expand raid details" button moves into the existing stats-strip row instead of occupying its own row; on mobile it compresses to an icon-only control.
- Daily Raids Plan's day-card grid no longer stretches cards to fill the full row width when few days are visible — column width is capped so a card's width stays close to its content regardless of how many days are shown.
- Projects becomes a dedicated project-management surface: `ProjectToolbar` is retired, and `ManageProjectsSheet` is narrowed to a create/edit-only form (its embedded project list is removed, since the list now lives permanently on the page). An inline "Manage Projects" list renders every project (including archived) directly on the page, with per-project actions (Edit, Set active, Archive/Restore); "Edit" and a "+ New project" affordance both open the narrowed Sheet form rather than expanding inline. Which project's goals appear below is controlled by a plain `ProjectSelect` placed after the project list — not by clicking a project row. **BREAKING**: the bulk "Pause all"/"Resume all" project actions are removed — redundant with the pause/resume already available on each goal row.

## Capabilities

### New Capabilities

- `goals-navigation`: Defines the Goals section's shared header/toolbar behavior — Planning Settings placement, the shared status filter (Unfulfilled/Reached/Archived) control and its reached-indicator, project-selector consistency (shared component + row position) across Overview/Projects/Insights, and the desktop/mobile row-consolidation rules.
- `project-management`: Defines Projects as the dedicated surface for viewing, editing, activating, and archiving projects — an on-page list with per-row lifecycle actions plus a narrowed create/edit form Sheet — and how a separate project selector, not row selection, drives which project's goals the page's goal list shows.

### Modified Capabilities

- `dailies-navigation`: Today/Plan tabs and the project selector now share one row instead of two, with a defined mobile compression rule for the selector.
- `daily-raids-plan`: The day-card grid's column sizing no longer grows unbounded when few days are visible, and the Collapse/Expand control moves into the stats-strip row instead of its own row.

## Impact

- Affected files/slices: `apps/web/src/fsd/pages/goals/ui/goals-board/goals-layout.tsx`, `goals-page.tsx`, `goals-list.tsx`; `apps/web/src/fsd/pages/goals/ui/projects/projects-page.tsx`; `apps/web/src/fsd/pages/goals/ui/insights/insights-page.tsx`; `apps/web/src/fsd/pages/dailies/ui/raids-layout.tsx`, `raids-plan-page.tsx`; `apps/web/src/fsd/features/project-management/ui/project-toolbar.tsx` (retired), `manage-projects-sheet.tsx` (narrowed to a form-only Sheet), and a new `project-list.tsx` (the on-page project list); `apps/web/src/fsd/entities/project/ui/project-select.tsx` (adopted more broadly); `apps/web/src/fsd/entities/goal/` (new: shared status-select and goal filters). Projects stays inside `pages/goals` (an earlier draft of this proposal planned to promote it to its own top-level page slice; dropped during implementation — `pnpm lint:fsd` rejects a sibling page slice importing `pages/goals`' shared goal-list/detail infrastructure, and extracting that infrastructure to a `widgets/` layer first is out of scope here, see `design.md` Decision 6).
- New shared UI: a status-select component (Unfulfilled/Reached/Archived with a reached-indicator) and the Type/Sort/Group filters, both in `entities/goal/ui`, usable by both Overview and Projects; an inline project list with per-row lifecycle actions plus a narrowed create/edit form Sheet, replacing the old combined list-and-form Sheet.
- i18n: new/changed strings across the `goals` and `dailies` locale namespaces (status select labels, narrowed project form, removed pause/resume copy) in `apps/web/public/locales`.
- Joyride tutorials: `today.tutorial.tsx` and `raids-plan.tutorial.tsx` need selector updates for any moved `data-testid`s. Overview and Projects currently have no tutorial coverage at all; since both get materially changed page flows here, this change adds tutorials for them per repository convention — Projects' tutorial is co-located alongside its page at `pages/goals/ui/projects/`.
- No backend/API impact — frontend-only. This is a pre-production V2 submodule, so the breaking changes above (removed Planning Settings entry points, removed bulk pause/resume) are acceptable per the `destructive-changes-policy` skill without a compatibility shim.
