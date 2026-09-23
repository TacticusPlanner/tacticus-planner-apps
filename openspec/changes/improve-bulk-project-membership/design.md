## Context

`AddGoalsToProjectSheet` already lives in `features/project-management`, loads all goals and project members, supports search and add-only checkboxes, and calls the project membership replacement endpoint. It refetches before save but cannot detect a race after the refetch. Its comments intentionally exclude removals because the existing API rejects a goal's last-membership removal. The paired API change adds an expected-set precondition and structured conflict responses.

## Goals / Non-Goals

**Goals:** One project-context, reviewed add/remove save with clear pending state and conflict recovery.

**Non-Goals:** Allow a goal with zero projects, automatically relocate orphaned goals, or change status/priority.

## Decisions

- Keep the editor in `features/project-management` and extend its public API; Project Detail remains the launcher. Preserve the current project ID/open-state draft reset guard so switching projects cannot submit the wrong draft.
- Model baseline membership separately from pending adds/removes. Filtering/grouping changes only the visible list, not draft selection. Show counts and named goals in a review section before Save; default to no pending changes.
- Add unit, type, and current-priority grouping/sort choices without changing stored order. Use canonical global priority once `establish-global-goal-priority` provides it; before that, do not derive a new execution order from the chosen UI sort.
- Send desired IDs and `expectedGoalIds` from the reviewed baseline in one API call. On stale conflict, fetch current set and present differences while retaining pending intent; require another explicit review/save. On last-membership or slot conflict, mark affected rows and keep the entire draft.
- Preserve the one-or-more-project invariant. An orphaning removal requires assigning another project first; project creation from the goal membership picker is a separate flow.

## Risks / Trade-offs

- Large lists can become hard to scan → search, grouping/sort, current/pending state, and sticky review summary at both breakpoints.
- API contract changes affect other apps callers → update all `updateProjectGoals` uses and generated types in the same paired rollout, API first.

## Open Questions

- Does global priority completely replace project priority in the response, or remain as display-only legacy data? Resolve with `establish-global-goal-priority`; this editor must never edit the canonical order either way.
