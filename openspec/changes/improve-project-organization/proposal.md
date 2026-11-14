# Proposal

## Why

The merged UserJot post [Enhancements for Project Organization and Goal Management](https://tacticusplanner.userjot.com/board/p/enhancements-for-project-organization-and-goal-management) asks for:

- adding a goal to several projects at once from the Goals page;
- a project visual better than a colour dot, such as the first few characters' portraits;
- project tags (Raid, GW, LRE, Horde).

Its comments show that multi-project membership already works but is hard to find: Chris could not see how to do it until he found it.

Agreed with Severyn on 3 Nov (decisions 40 to 45 in the planning notes):

- Bulk Add to project picks several projects, with one request per project.
- The goal row menu gets Add to another project….
- Cards show the first 4 unit portraits, then "+N", and the colour dot stays.
- Portraits also show on the home widget.
- An icon library is out of scope for now.
- Target kinds serve as tags, through a filter on the Projects page.

Projects that follow units (auto-adding a unit's goals) are split into their own UserJot request and are not part of this change.

## What Changes

- **Bulk Add to project** becomes multi-select. Each chosen project gets one membership request, with the existing stale retry. If any fail, the toast names them, and the others stay added.
- **Add to another project…** in every goal row menu opens the existing project picker for that goal.
- **Portraits** on project cards (Projects page and home widget): the first 4 distinct units among the project's in-flight goals, in priority order, then "+N".
- **Target kind filter** on the Projects page: chips All, LE, BP, GR, GW, Date, None, shown only when the listed projects use at least 2 of those kinds (None counts as a kind).

## Capabilities

### Modified Capabilities

- `goal-bulk-actions`: Add to project takes several destinations.
- `goal-project-membership`: the row menu offers Add to another project….
- `project-management`: cards show portraits, and the list can be filtered by target kind.
- `home-projects-widget`: cards show portraits.

## Impact

- `features/goal-planning` (bulk add), `features/project-management` (picker multi-select, card portraits, filter), `pages/goals` (row menu item, Projects filter), `pages/home` (widget portraits).
- `common` `goals.bulk.*`, `goals.project.*` i18n in en/de/es/fr; Projects tour.
- No API change. The filter needs the target kinds from `add-project-deadline-targets`; before that it only distinguishes LE from None.
