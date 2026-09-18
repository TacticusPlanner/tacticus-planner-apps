## 1. Extract grouping into the shared page module

- [ ] 1.1 Move `groupKey`/`rowGroups` out of `goals-page.tsx` into `pages/goals/model/shared/`, exposing a function that takes rows and a `GoalGroupValue` and returns groups carrying their key, dimension, and rows, and verify unit tests cover grouping by unit, by type, and no grouping
- [ ] 1.2 Verify the shared function preserves row order within each group and group order by first appearance, with a unit test asserting a pre-sorted row set survives partitioning unchanged
- [ ] 1.3 Consume it from `goals-page.tsx` with no behavior change, and verify Overview's existing grouping test (`goals-page.test.tsx`, "groups goals by goal type") passes untouched

## 2. Apply grouping on project detail

- [ ] 2.1 Consume the shared function in `project-detail-page.tsx` so its `group` state drives rendering instead of being ignored, and verify `project-detail-page.test.tsx` asserts selecting Group by type produces one labelled block per goal type
- [ ] 2.2 Render a heading per group — the goal-type label for the type dimension, `getEntityName` for the unit dimension, none when grouping is off — and verify tests assert both heading kinds
- [ ] 2.3 Assert one block per unit when Group by unit is selected, with all of that unit's goals inside it, and verify a test covers a unit holding several goal types
- [ ] 2.4 Verify grouping applies on every status tab including Archived, with a test asserting archived rows group rather than render flat
- [ ] 2.5 Confirm the empty-state and error paths still render before any grouped output, and verify the existing filtered-empty test still passes
- [ ] 2.6 Keep the grouped output inside the existing `<div data-testid="project-detail-goals">` wrapper rather than rendering group sections at top level as Overview does, and verify `project-detail-page.tutorial.test.tsx`'s assertion on that selector still passes — the product tour anchors its "goals" step to it

## 3. Ordering inside and between groups

- [ ] 3.1 When grouped by unit, apply the Sort selection to the order of unit blocks and keep each block's goals in their automatic dependency-first order, and verify a test asserts a less-recently-updated prerequisite still renders above its dependent under sort-by-updated
- [ ] 3.2 Verify Sort orders goals normally under the type and none dimensions, with a test for each
- [ ] 3.3 Verify Completed and Archived goals remain reachable through the status filter without taking a position in the in-flight unit priority ordering, with a test covering a unit that has both historical and in-flight goals

## 4. Default and persistence

- [ ] 4.1 Change project detail's initial `group` state to `"type"`, leaving Overview's at `"none"`, and verify a test asserts a freshly opened project detail renders type-grouped while a freshly opened Overview renders flat
- [ ] 4.2 Verify the Group control still offers all three options on project detail and that selecting "none" produces a flat list, with a test for each option
- [ ] 4.3 Verify the status, Type, Sort, and Group selections all survive switching projects through the in-header `ProjectSelect` — the route has no `key`, so the component stays mounted — with a test asserting a project opened after selecting unit grouping is also shown grouped by unit

## 5. Priority is untouched

- [ ] 5.1 Verify changing the Group selection issues no mutation and leaves stored unit order unchanged, with a test asserting no unit-order request is sent
- [ ] 5.2 Confirm Reprioritize Units still opens with the project's established unit order regardless of the current Group selection, and verify a test covers opening it while grouped by type

## 6. Product tour

- [ ] 6.1 Review `project-detail-page.tutorial.tsx` against the new default presentation and update any step whose target or wording assumes a flat list, covering both desktop and mobile, and verify `project-detail-page.tutorial.test.tsx` passes
- [ ] 6.2 Add or update `tour.projectDetail.steps.*` keys for any wording changed in 6.1, translated in `de`, `es`, and `fr`, and verify the tutorial tests resolve each key

## 7. Manual verification

Required data states — prepare before starting this group: a project containing goals of at least three goal types; a project where one unit has several goals of different types; a unit whose prerequisite goal was updated less recently than the goal depending on it; a project with archived goals; a project with an established non-alphabetical unit order; a second project to switch to.

- [ ] 7.1 Start the full local stack from the workspace root through the Aspire AppHost and verify both `web` and `api` report healthy before testing
- [ ] 7.2 Open a project on desktop and verify it renders grouped by goal type with labelled blocks
- [ ] 7.3 Switch Group to unit and verify each unit appears once with its goals together; switch to none and verify a flat list
- [ ] 7.4 Repeat 7.2 and 7.3 below 768px and verify the group headings and the Group control remain legible and reachable
- [ ] 7.5 Select the Archived status filter and verify grouping still applies
- [ ] 7.6 Group by unit on a project whose prerequisite goal was updated less recently than its dependent, sort by most recently updated, and verify the prerequisite still renders above its dependent while the unit blocks themselves reorder
- [ ] 7.7 Switch to another project through the in-header project switcher and verify the Group selection carries across, then reload the route and verify it opens grouped by goal type again
- [ ] 7.8 Open Reprioritize Units while grouped by type and verify the established unit order is unchanged, then confirm Overview still opens ungrouped
- [ ] 7.9 Run the product tour on project detail at one viewport below 768px and one at or above, and verify every step still anchors to its intended element

## 8. Gates

- [ ] 8.1 Run `pnpm test:run` and verify it passes
- [ ] 8.2 Run `pnpm typecheck` and verify it passes
- [ ] 8.3 Run `pnpm lint` and verify it passes
- [ ] 8.4 Run `pnpm lint:fsd` and verify it passes
- [ ] 8.5 Run `git diff --check` and verify it reports no whitespace errors
