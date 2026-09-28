## Context

`AddGoalsToProjectSheet` already lives in `features/project-management`, loads all goals and project members, supports search and add-only checkboxes, and calls the project membership replacement endpoint. It refetches before save but cannot detect a race after the refetch. Its comments intentionally exclude removals because the existing API rejects a goal's last-membership removal (400). The paired API change adds an expected-set precondition and structured conflict responses. Project detail is reached at `/plan/projects/:id`; its goal order is a projection of the account-wide `Goal.GlobalPriority` (moves are subset moves via the project goal-order endpoint), and the response of the membership call lists members with their `globalPriority`.

## Goals / Non-Goals

**Goals:** One project-context, reviewed add/remove save with clear pending state and conflict recovery.

**Non-Goals:** Allow a goal with zero projects, automatically relocate orphaned goals, or change status/priority.

## Decisions

- Keep the editor in `features/project-management` and extend its public API; Project Detail remains the launcher. Preserve the current project ID/open-state draft reset guard so switching projects cannot submit the wrong draft.
- Model baseline membership separately from pending adds/removes. Filtering/grouping changes only the visible list, not draft selection. Show counts and named goals in a review section before Save; default to no pending changes.
- Order rows by `Goal.GlobalPriority` (in-flight first, historical goals after, as on the Goals page) and offer unit and goal-type grouping only; no separate sort control, so the list never suggests an order other than the canonical one. Grouping and search change only the visible list, never the order or the draft.
- Send desired IDs and `expectedGoalIds` from the reviewed baseline in one API call. On stale conflict, fetch current set and present differences while retaining pending intent; require another explicit review/save. On last-membership or slot conflict, mark affected rows and keep the entire draft.
- Preserve the one-or-more-project invariant. An orphaning removal is rejected by the API; the conflict copy tells the user to add the goal to another project first (the Default project is always available). The goal row's Move to project flow relocates by adding the destination membership first; this sheet does not auto-relocate. Project creation from the goal membership picker is a separate flow.

## Risks / Trade-offs

- Large lists can become hard to scan → search, grouping, current/pending state, and sticky review summary at both breakpoints.
- API contract changes affect other apps callers → update all `updateProjectGoals` uses and generated types in the same paired rollout, API first.

## Open Questions

None. Resolved: global priority replaced project priority (`project_goals.priority` is gone); membership replacement never edits the canonical order, and a goal newly added to a project keeps its existing global position.
