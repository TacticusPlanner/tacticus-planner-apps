# Proposal

## Why

A project's goals finish late when other projects' goals sit above them in the account-wide order. The deadline fit (`add-project-deadline-fit`) shows that honestly, from the full plan. Players also want to know whether the project _could_ make its deadline if they put it first, before they reorder anything. Severyn asked for both bases (3 Nov, decision 5). Because the plan engine hands out resources top-down, "this project alone" gives the same dates as moving the project's goals to the top, so the toggle doubles as a preview for `add-move-project-goals`.

Agreed on 3 Nov (decisions 20 to 24 in the planning notes):

- Cards never show the project-alone figure.
- While the toggle is on, the Done By cells swap to the project-alone dates with an "if prioritised" hint.
- The toggle is available on untargeted projects, showing dates only.
- It is a segmented control in the deadline header, or in the scope bar for an untargeted project.
- The separate run takes the project's Active goals in their current relative order.

## What Changes

- A **Full plan / This project alone** segmented control on Goals scoped to any project. It defaults to Full plan and is saved per browser.
- _This project alone_ runs a second estimate over only the project's Active goals, in their relative order, with the same inventory, energy and settings. The Done By cells show those dates with an "if prioritised" hint, and in a targeted scope the fit labels, header and divider follow them.
- Nothing else changes: cards, Dailies, Schedule, Insights and the unscoped Goals page always use the full plan.

## Capabilities

### New Capabilities

- `project-fit-basis`: the toggle, the separate run, and how the scoped list shows it.

## Impact

- `features/goal-planning` (`useProjectAloneEstimates`, reusing `computePlanInsights`), `pages/goals` (control, Done By hint, fit wiring).
- `common` `goals.fitBasis.*` i18n in en/de/es/fr; the Goals page tour.
- No API change. Depends on `add-project-deadline-fit` for the fit labels; on an untargeted project it works on its own.
