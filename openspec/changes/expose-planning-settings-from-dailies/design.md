## Context

`PlanningSettingsDialog` currently lives under the Goals page, while its data hook is already in `entities/planning-setting`. `RaidsLayout` is shared by Today and Raids Plan. The existing `goals-navigation` rule restricts the action to the Goals subpage (Plan > Goals, `/plan/goals`; formerly "Overview") among Plan subpages; Dailies is a separate section. `RaidsLayout` has no project selector any more: Today and Raids Plan show the account-wide plan in global goal order, and a project is only an optional filter on other Dailies pages.

## Goals / Non-Goals

**Goals:** One dialog component and one persisted configuration reached from both sections.

**Non-Goals:** Add settings to Goals Projects/Insights, create a Raids-specific override, or change tab/project selection.

## Decisions

- Move the dialog and a reusable trigger to the `entities/planning-setting` public API, or another legal shared slice if dependencies require it. the Goals page and Dailies Raids consume that API; neither page imports the other.
- Own Dailies's dialog-open state in `RaidsLayout` so the action persists across Today/Raids Plan navigation. Place the trigger in the Raids tab row at both breakpoints (a named icon control on mobile, icon plus label on desktop); there is no project selector in that row.
- Reuse the existing settings query/mutation and invalidate the same estimates/raid data after save. Localize changed description and action labels in every supported locale.

## Risks / Trade-offs

- Moving the dialog could create FSD dependency violations → keep its imports within a legal shared slice and run `lint:fsd`.
- `dailies-navigation` still records a Raids-tab project selector that no longer exists (removed with the global goal order) → do not expand this change into that unrelated spec reconciliation; test the actual controls and flag the mismatch separately.
- This change depends on `consolidate-goals-into-plan-and-remove-active-project` (Goals page at `/plan/goals`, "Planning Settings is a Goals-only control" requirement) being applied and archived first; wording here already assumes it.

## Open Questions

- None that changes the contract. Confirm the final shared slice's dependency legality while moving the component; the ownership decision is to avoid page-to-page imports.
