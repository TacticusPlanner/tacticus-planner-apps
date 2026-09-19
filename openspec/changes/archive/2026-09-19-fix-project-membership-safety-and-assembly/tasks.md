## 1. Promote unit-name resolution to a shared slice

- [x] 1.1 Add `shared/unit-name` exporting a name resolver with the superset signature `(entityType: string | null, entityId: string | null) => string`, returning `""` for a null id and resolving Character via `characters:<id>` with the catalog-record fallback and Mow via the catalog, and verify unit tests cover Character, Mow, unknown id, unknown entity type, and null id
- [x] 1.2 Refactor `pages/goals/model/shared/use-goal-catalog.ts` to return the shared resolver as `getEntityName` instead of its own copy, and verify the existing goals-page, project-detail, and overview-metrics tests still pass unchanged
- [x] 1.3 Refactor `features/v1-import/model/use-entity-display-name.ts` onto the shared resolver and verify the V1 import report's existing tests still pass, including the unknown-unit case that must keep falling back to the raw V1 identifier
- [x] 1.4 Run `pnpm lint:fsd` and verify no page-to-page or feature-to-feature import remains for name resolution and that `features/project-management` can reach it

## 2. Membership removal semantics

- [x] 2.1 Add a removal helper in `pages/goals/model/projects/` that, given a goal's current memberships and the project to leave, returns the membership list to submit — the remaining memberships, or `[defaultProjectId]` when none remain — and verify unit tests cover multi-membership removal, last-membership relocation, and the Default-is-the-only-membership case returning no submittable change
- [x] 2.2 Extend the helper to report why removal is unavailable when the goal's only membership is the Default project, and verify a unit test asserts the unavailable reason rather than a thrown error
- [x] 2.3 Extend the helper to report removal unavailable when `defaultProjectId` is `undefined` (projects query pending, errored, or unauthenticated), and verify a unit test asserts no submittable list is produced and no `null` entry can reach the request body — `useProjects` already returns `defaultProjectId`, so consume it rather than adding a second accessor
- [x] 2.4 Gate the destination pre-flight on the moving goal's status, reusing `findProjectGoalConflicts` only when the goal is Active or Paused, and verify unit tests cover an occupied slot for an Active goal, an occupied slot for a Completed/Archived goal (which must be allowed through), and an empty slot
- [x] 2.5 Build the submitted list from memberships refetched at submit time rather than from the rendered row, and verify a test asserts a membership added elsewhere after load survives an unrelated removal

## 3. Row membership data

- [x] 3.1 Carry memberships on project-detail rows by extending `goalRowFromProjectMember` (`model/shared/types.ts`) so `row.projects` is populated, and verify a unit test asserts the mapped row carries the goal's memberships
- [x] 3.2 Populate memberships on Overview's archived rows — `goals-page.tsx` currently calls `goalRowFromSummary(goal)` with no memberships argument — and verify a test asserts archived rows carry `projects` like non-archived rows do
- [x] 3.3 Thread the owning project through `goals-list.tsx` to both `GoalRowActions` call sites, and verify tests assert project scope reaches the menu on the project detail route and is absent on Overview

## 4. Removal from the project context

- [x] 4.1 Add a "Remove from this project" item to `goal-row-actions.tsx`, rendered only when the row has an owning project, and verify `goal-row-actions.test.tsx` asserts the item is present with project scope and absent without it
- [x] 4.2 Wire the item to submit `PUT /me/goals/{goalId}/projects` through the helper from 2.1, invalidating both goal and project queries on success, and verify a test asserts the submitted membership list for a multi-membership goal and for a last-membership goal
- [x] 4.3 Render the removal item unavailable with the appropriate explanation for the Default-only and destination-unknown cases from 2.2/2.3, and verify tests assert both states
- [x] 4.4 Surface the pre-flight conflict from 2.4 — naming the Default project and the goal type — instead of submitting, and keep the 409 `projectGoalSlotOccupied` response handled as the backstop; verify tests cover both the pre-flight path and a 409 returned after a passing pre-flight
- [x] 4.5 Report the outcome with a toast naming the goal and, for a relocation, the destination project by its current name, and verify a test asserts the destination name is read from project data rather than hardcoded

## 5. The goal edit form follows the same rule

- [x] 5.1 Change `goal-projects-field.tsx` so removing the last chip relocates to the Default project instead of setting `lastRemovalBlocked`, keeping the blocked state only for the Default-only and destination-unknown cases, and verify `goal-projects-field.test.tsx` covers relocation, Default-only refusal, and destination-unknown refusal
- [x] 5.2 Verify the archived-membership cases behave identically in the edit form — an archived chip remains visible and marked, an archived project is still not addable, and removing an archived-only membership relocates to Default — with tests for each

## 6. Bulk assembly surface

- [x] 6.1 Add an assembly Sheet to `features/project-management` exporting it from that slice's public API, listing the profile's goals with search (using the shared resolver from 1.1) and a per-goal indication of whether it already belongs to the viewed project, and verify a component test covers rendering, search narrowing, and the member indication
- [x] 6.2 Submit existing members with their current `priority` from `GET /me/projects/{id}/goals` and additions with distinct increasing values above the current maximum, and verify a test asserts existing unit order is preserved and additions land last after the server's normalization
- [x] 6.3 Build the submission from membership refetched at save time rather than from the rendered list, and verify a test asserts a goal added elsewhere after opening the sheet survives the save
- [x] 6.4 Pre-flight project-scoped goal-type uniqueness across the whole submitted set, making a goal whose slot is held by an Active/Paused member unselectable with a stated reason, and verify tests cover a blocked selection, a batch where only one selection conflicts, and a Completed/Archived member that does not block
- [x] 6.5 Ensure the sheet never removes a member — already-member goals render as members and cannot be unchecked — and verify a test asserts no existing member is dropped from the submitted list
- [x] 6.6 Add the "Add goals to this project" trigger to `project-detail-page.tsx` and verify `project-detail-page.test.tsx` asserts the trigger opens the sheet
- [x] 6.7 Run `pnpm lint:fsd` and verify the feature is consumed by `pages/goals` through its public API with no page-to-page or feature-to-feature import

## 7. Distinguishing deletion from removal

- [x] 7.1 Reword `delete-goal-dialog.tsx` to state that deletion is account-wide and to name project removal as the alternative when an owning project is in context, and verify the project detail and Overview tests assert the project-scoped wording appears only in project context
- [x] 7.2 Confirm the removal action carries no destructive styling and no confirmation dialog while delete keeps both, and verify a test asserts the two menu items' distinct treatment

## 8. Overview project-membership filter

- [x] 8.1 Add a project filter control to Overview's filter row in `goals-page.tsx` as local state defaulting to no filter, including an explicit unfiltered option, and verify `goals-page.test.tsx` asserts the default state lists goals from every project
- [x] 8.2 Apply the filter to the displayed rows only, on every status tab including Archived, and verify tests assert filtering narrows in-flight and archived tabs alike and issues no mutation
- [x] 8.3 Confirm the filter neither reads nor writes the persisted project selection used by Dailies and Insights, and verify a test asserts that selection and Current plan are unchanged after filtering Overview
- [x] 8.4 Render the control within the Type/Sort/Group filter group — not trailing in the status row, and not reusing `ProjectSelect` — inline on desktop and icon-only with an accessible name below 768px, and verify tests at both viewports assert the placement and the accessible name

## 9. Internationalization

- [x] 9.1 Add `common.json` keys for the removal action, the relocation destination message, the last-membership and destination-unknown explanations, the destination-conflict message, the assembly sheet including its blocked-selection reason, the reworded delete confirmation, and the Overview project filter — and verify no new literal user-facing string remains in the changed components
- [x] 9.2 Translate every key from 9.1 into `de`, `es`, and `fr` at the quality of the sibling namespaces already in `apps/web/public/locales`, and verify each locale file parses and carries no English fallback text for the new keys
- [x] 9.3 Verify the relocation and conflict messages interpolate the destination project's current name, and confirm a renamed Default project is reflected in all four locales

## 10. Product tour

- [x] 10.1 Add tour steps for the assembly trigger and the row removal action to `project-detail-page.tutorial.tsx` for both desktop and mobile, targeting `data-testid` selectors, and verify `project-detail-page.tutorial.test.tsx` covers both step sets
- [x] 10.2 Add a tour step for the Overview project filter to `goals-page.tutorial.tsx` for both desktop and mobile, and verify `goals-page.tutorial.test.tsx` covers both step sets
- [x] 10.3 Add `tour.projectDetail.steps.*` and the corresponding Overview tour keys for every new step, translated in `de`, `es`, and `fr`, and verify the tutorial tests resolve each key

## 11. Manual verification

Required data states — prepare before starting this group: a goal in two projects; a goal in exactly one non-Default project; a goal whose only membership is the Default project; a goal whose only membership is an archived project; a Completed or Archived goal in exactly one non-Default project whose Default-project slot is already held by an Active goal for the same unit and goal type; an Active goal in the same slot situation; a project whose unit order is established and non-alphabetical; a project with no goals.

- [x] 11.1 Start the full local stack from the workspace root through the Aspire AppHost and verify both `web` and `api` report healthy before testing
- [x] 11.2 Verify each removal case on desktop against the states above: multi-membership removal, last-membership relocation with the destination named, the Default-only unavailable case, the occupied-destination conflict message for the Active goal, the allowed relocation for the Completed/Archived goal, and the archived-only relocation
- [x] 11.3 Repeat 11.2 in the goal edit form's chip control and confirm it behaves identically to the row action
- [ ] 11.4 Repeat 11.2 below 768px and verify the removal action and its messages remain reachable and legible
- [x] 11.5 Verify bulk assembly end to end on the established-order project and the empty project: search, add several goals, save once, and confirm existing members survive, existing unit order is unchanged, and added units land last
- [x] 11.6 Verify a conflicting selection is blocked with its reason and that saving a batch containing it still adds the non-conflicting selections
- [ ] 11.7 Verify the Overview project filter at one viewport below 768px and one at or above, on both an in-flight and the Archived status tab, and confirm Dailies' project selection and Current plan are both unchanged afterward
- [ ] 11.8 Verify the V1 import report still resolves unit names correctly after the shared-resolver refactor, including an unknown unit falling back to the raw V1 identifier
- [ ] 11.9 Run the product tour on project detail and on Overview at one viewport below 768px and one at or above, and verify every new step anchors to its intended element

## 12. Gates

- [x] 12.1 Run `pnpm test:run` and verify it passes
- [x] 12.2 Run `pnpm typecheck` and verify it passes
- [x] 12.3 Run `pnpm lint` and verify it passes
- [x] 12.4 Run `pnpm lint:fsd` and verify it passes
- [x] 12.5 Run `git diff --check` and verify it reports no whitespace errors
