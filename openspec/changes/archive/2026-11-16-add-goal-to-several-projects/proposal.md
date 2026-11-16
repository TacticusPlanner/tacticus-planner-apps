# Proposal

## Why

The merged UserJot post [Enhancements for Project Organization and Goal Management](https://tacticusplanner.userjot.com/board/p/enhancements-for-project-organization-and-goal-management) asks for adding a goal to several projects at once from the Goals page. Its comments show that multi-project membership already works but is hard to find: Chris could not see how to do it until he found it.

Agreed with Severyn on 3 Nov (decisions 40 and 41 in the planning notes):

- Bulk Add to project picks several projects, with one request per project.
- The goal row menu gets Add to another project….

Unit portraits ship in `add-project-unit-portraits`, and the target kind filter in `add-project-deadline-targets`. Projects that follow units are a separate UserJot request.

## What Changes

- **Bulk Add to project** becomes multi-select. Each chosen project gets one membership request, with the existing stale retry. If any fail, the toast names them, and the others stay added.
- **Add to another project…** in every goal row menu opens the existing project picker for that goal.

## Capabilities

### Modified Capabilities

- `goal-bulk-actions`: Add to project takes several destinations.
- `goal-project-membership`: the row menu offers Add to another project….

## Impact

- `features/goal-planning` (bulk add, membership picker dialog), `features/project-management` (picker multi-select), `pages/goals` (row menu item).
- `common` `goals.bulk.*`, `goals.project.*` i18n in en/de/es/fr.
- No API change. Independent of the deadline changes.
