## Context

`PlanningSettingsDialog` currently lives under the Goals page, while its data hook is already in `entities/planning-setting`. `RaidsLayout` is shared by Today and Raids Plan. The existing `goals-navigation` rule restricts the action to the Goals subpage (Plan > Goals, `/plan/goals`; formerly "Overview") among Plan subpages; Dailies is a separate section. `RaidsLayout` already renders a `ProjectSelect` (`allowAll`, default all goals) trailing the Today/Raids Plan tabs, optionally narrowing the account-wide plan to one project; Today and Raids Plan still run in global goal order.

## Goals / Non-Goals

**Goals:** One dialog component and one persisted configuration reached from both sections.

**Non-Goals:** Add settings to Goals Projects/Insights, create a Raids-specific override, or change tab/project selection.

## Decisions

- Move the dialog and a reusable trigger to the `entities/planning-setting` public API, or another legal shared slice if dependencies require it. the Goals page and Dailies Raids consume that API; neither page imports the other.
- Own Dailies's dialog-open state in `RaidsLayout` so the action persists across Today/Raids Plan navigation. Place the trigger trailing in the same row as the tabs and the existing `ProjectSelect`, after the project selector (a named icon control on mobile, icon plus label on desktop).
- Reuse the existing settings query/mutation and invalidate the same estimates/raid data after save. Localize changed description and action labels in every supported locale.

## Risks / Trade-offs

- Moving the dialog could create FSD dependency violations → keep its imports within a legal shared slice and run `lint:fsd`.
- The trigger lands beside an already-present `ProjectSelect` in the same row → verify the row still fits and wraps sanely at 360px alongside the existing `dailies-navigation` project-selector requirement, rather than assuming an empty row.
- This change depends on `consolidate-goals-into-plan-and-remove-active-project` (Goals page at `/plan/goals`, "Planning Settings is a Goals-only control" requirement); it is applied and archived, so this change can proceed.

## Open Questions

- None that changes the contract. Confirm the final shared slice's dependency legality while moving the component; the ownership decision is to avoid page-to-page imports.
