# Tasks

## 1. Header date

- [x] 1.1 Append the run date to each event child's description in `use-nav-items.ts` ("Starts <date>" upcoming, "Ends <date>" active, none archived or TBA), with en/de/es/fr strings. Verify that `use-nav-items.test.tsx` covers an active and an upcoming event.

## 2. Plan entry in the header row

- [x] 2.1 Add `legendary-event-plan-entry.tsx` (`hasEventPlan`: a linked project and at least two teams in every lane; the projects line and the wizard button, primary Plan this event or secondary Refine plan) and render it in the header row through an `actions` slot of `LegendaryEventHeader`; remove the button and the projects line from the Overview. Verify that tests cover `hasEventPlan` and both button states, and that the event page tests pass.

## 3. Gates and manual check

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`; all pass.
- [x] 3.2 Manual check on the local stack: an event with a project and teams shows Refine plan (secondary); one without a project shows Plan this event (primary); the header names the run date; at 390 px the row wraps below the name with no horizontal scroll.
