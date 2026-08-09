# Verification notes

## Dashboard request and calculation budget

- The dashboard issues one project-list request plus one project-goals request for each visible
  Current/Other project. Archived-project requests are deferred until the collapsed Archived
  section is expanded and then use React Query's cache.
- Only the Current plan runs attainment, blockers, inventory allocation, estimates, and completion
  calculations. Other visible projects receive lightweight unit/goal counts from their ordered
  project-goal response.
- `project-unit-plans.test.ts` exercises 200 units and 600 goals with a 250 ms upper bound. This is
  intentionally well above typical local execution time while still guarding against accidental
  quadratic regressions in card/header grouping.

This keeps expensive calculations constant at one project while request fan-out is bounded by the
number of visible cards. A future server-side project-summary endpoint can collapse the lightweight
count requests if real-world project counts make that necessary.

## Aspire migration verification

The persistent local `planner-db` reported both migrations applied and no pending model changes
through the `api-migrations` resource. Read-only verification after migration found 11 ordinary
Character/MoW goals, zero Item/UpgradeItem goals, and 17 memberships with populated slot columns.
The PostgreSQL integration test separately seeds both ordinary and equipment legacy rows before
applying the migration, proving ordinary-row preservation and equipment-row cascade removal.

## Browser verification boundary

Aspire reported the API, web client, and PostgreSQL resources healthy. The in-app browser loaded the
local client and confirmed that `/goals/projects` is protected and redirects an unauthenticated user
to the landing page. No authenticated browser session was available, so tasks 8.2–8.4 and 8.6 remain
open for a signed-in manual pass at both sides of the 768 px breakpoint. Protected behavior is
covered by the automated component, API-contract, PostgreSQL, touch/pointer-sortable, and keyboard
sensor tests in the meantime.
