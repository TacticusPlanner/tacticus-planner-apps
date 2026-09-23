## Context

`GoalProjectsField` is shared by creation and editing, shows chips and a searchable `Command` picker, and currently only selects existing projects. The project row's Move-to-project flow already creates a project, but is a different action/context. The existing project API supports creation.

## Goals / Non-Goals

**Goals:** Create by explicit choice inside the shared picker without resetting the containing goal form.

**Non-Goals:** Implicit creation from search, goal auto-save, or changes to the row move flow.

## Decisions

- Keep the Create action and pending/error state in `GoalProjectsField`, with project mutation/query refresh supplied through a legal goal/project slice API. Reuse existing project form validation; do not duplicate a looser name rule.
- Trim and compare names according to existing project rules. Present an unmatched Create row only when the name is valid; avoid a misleading duplicate alongside an existing result.
- On success use the returned project ID directly for selection, then refresh the project list so its chip has real color/name. Do not close the enclosing sheet or clear other draft fields.
- On failure keep the search query and goal state; surface an actionable error and permit retry. If two requests race, prevent duplicate submission while pending and handle server duplicate-name rejection.

## Risks / Trade-offs

- A newly created project could outlive a cancelled goal draft → creation is an explicit action; make this clear in copy and do not silently delete it on cancel.
- The picker may be nested in a modal on mobile → use existing portal/focus conventions and verify keyboard/touch reachability.

## Open Questions

- None affecting the contract. Reuse the current project name length/case rules from the existing form/API at implementation time.
