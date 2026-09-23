## Context

`PlanningSettingsDialog` currently lives under the Goals page, while its data hook is already in `entities/planning-setting`. `RaidsLayout` is shared by Today and Raids Plan. The existing `goals-navigation` rule restricts the action to Overview among Goals subpages; Dailies is a separate section.

## Goals / Non-Goals

**Goals:** One dialog component and one persisted configuration reached from both sections.

**Non-Goals:** Add settings to Goals Projects/Insights, create a Raids-specific override, or change tab/project selection.

## Decisions

- Move the dialog and a reusable trigger to the `entities/planning-setting` public API, or another legal shared slice if dependencies require it. Goals Overview and Dailies Raids consume that API; neither page imports the other.
- Own Dailies's dialog-open state in `RaidsLayout` so the action persists across Today/Raids Plan navigation. On desktop place the trigger in the Raids controls alongside the project selector; on mobile place a named icon control in the tab row while the existing project selector retains its current layout.
- Reuse the existing settings query/mutation and invalidate the same estimates/raid data after save. Localize changed description and action labels in every supported locale.

## Risks / Trade-offs

- Moving the dialog could create FSD dependency violations → keep its imports within a legal shared slice and run `lint:fsd`.
- `dailies-navigation`'s recorded mobile project-selector layout differs from current code → do not expand this change into that unrelated reconciliation; test the actual controls and flag the mismatch separately.

## Open Questions

- None that changes the contract. Confirm the final shared slice's dependency legality while moving the component; the ownership decision is to avoid page-to-page imports.
