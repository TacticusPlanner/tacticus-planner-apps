## 1. Adopt the coordinated API contract

- [ ] 1.1 Merge and deploy the implemented matching `tacticus-planner-api` change in PR #39: project-scoped goal slots, unit-order endpoint, equipment-goal removal, migration, and regenerated OpenAPI.
- [x] 1.2 Regenerate/update client request and response types for the unit-order endpoint, structured project conflict errors, removal of `Item`/`UpgradeItem`, removal of numeric creation priority, and upgrade-material target renaming.
- [x] 1.3 Inventory user-facing `active plan` references separately from legitimate goal/project lifecycle Active labels and establish shared Current plan marker helpers.
- [x] 1.4 Add contract tests for supported Character/MoW goal kinds, project-scoped conflicts, and unit-order request/response mapping.

## 2. Remove independent equipment goals

- [x] 2.1 Remove the Equipment branch from `CreateGoalSheet`, `EquipmentGoalFields`, and `useCreateEquipmentGoalForm`; remove dead exports and tests.
- [x] 2.2 Remove `Item` entity and `UpgradeItem` goal-kind branches from goal types, filters, icons, detail rendering, progress, attainment, blockers, previews, and Dailies/Insights adapters.
- [x] 2.3 Rename client upgrade-material target symbols away from `UpgradeItemTarget` while preserving ordinary Character/MoW Upgrade behavior.
- [x] 2.4 Remove equipment-goal translation and tutorial copy from every locale, retaining game-catalog equipment/player-data functionality unrelated to Goals.
- [x] 2.5 Add regression tests proving Character/MoW Upgrade goals and their material targets still create, render, estimate, and contribute to schedules.

## 3. Establish unit-plan view models and calculations

- [x] 3.1 Define one canonical project-unit view model grouped by `(entityType, entityId)` with ordered goals, unit position, status counts, blockers, and optional estimate.
- [x] 3.2 Implement automatic within-unit ordering: topological dependency order, prior relative priority for unrelated goals, and stable goal-id tie-breaker.
- [x] 3.3 Derive project detail grouping and reprioritization data from the same canonical ordered project-goal response consumed by calculations.
- [x] 3.4 Add unit tests for mixed Character/MoW projects, multiple goals per unit, dependencies, unrelated stable order, new goals joining existing units, historical goals, and deterministic ties.
- [x] 3.5 Add regression tests proving Dailies, Raids Plan, Insights, inventory allocation, and estimates consume the flattened unit order without an independent resort.

## 4. Redesign the project dashboard and header

- [x] 4.1 Replace the flat Projects list with Current plan, Other projects, and collapsed Archived projects sections, preserving distinct loading/failure/empty states.
- [x] 4.2 Build project cards with identity, description, lightweight counts, Current plan styling, progressive summaries, navigation, Make current, and secondary action menu.
- [x] 4.3 Replace `ProjectRow` on detail with a semantic header containing back navigation, identity, Current plan state/action, metrics, route switcher, and overflow actions.
- [x] 4.4 Compose cached project summaries progressively, limit expensive calculations to Current plan/visible or cached contexts, and isolate summary failures per card/header.
- [x] 4.5 Replace the icon-only New Project FAB with a clearly labeled create affordance and educational empty state.
- [x] 4.6 Add dashboard/header tests for current/default/available/archived projects, no projects, no goals, progressive states, isolated retry, action propagation, route-only switching, and archive guards.

## 5. Implement unit reprioritization

- [x] 5.1 Remove goal-row up/down controls, `reorderedMemberIds`, numeric per-project priority inputs, and their obsolete tests/copy.
- [x] 5.2 Add a Reprioritize units action to eligible project details and implement local drag ordering in a focused desktop dialog/Sheet and full-height mobile Sheet.
- [x] 5.3 Render one draggable block per in-flight Character/MoW with icon, name, contained goal types, and optional summary; explain that moving a unit moves all its goals.
- [x] 5.4 Wire Save to the API unit-order endpoint, Cancel to discard local order, pending/error handling to preserve the draft, and success invalidation to refresh project goals, Dailies, and Insights.
- [x] 5.5 Give drag handles accessible names and configure the selected drag library's keyboard sensor where supported, without adding separate visible Move before/after commands.
- [x] 5.6 Add tests for dragging units, saving/canceling, pending/conflict errors, fewer-than-two-unit eligibility, moving all contained goals, automatic inner order, mobile composition, and accessible handles.

## 6. Redesign project membership and conflict feedback

- [x] 6.1 Replace expanded project checkboxes in create/edit flows with selected chips and a searchable Add to project picker shared where form architecture permits.
- [x] 6.2 Show Current plan, Default, and Archived markers; exclude selected/archived projects from addable results while retaining removable existing archived memberships.
- [x] 6.3 Preserve at least one membership and default-project preselection.
- [x] 6.4 Replace global `useGoalTypeConflicts` behavior with selected-project conflict queries/mapping and identify each conflicting project beside its chip or goal-type review.
- [x] 6.5 Handle server conflict responses for create, combined create, membership edit, and resume by retaining input and linking/pointing to the existing conflicting goal where possible.
- [x] 6.6 Add tests for multi-home goals, separate same-type instances across different projects, conflicts within one project, Completed/Archived non-conflicts, last-membership protection, search, archived membership, and stale server conflicts.

## 7. Responsive UI, i18n, and tutorials

- [x] 7.1 Implement comparison-friendly desktop cards/headers and stacked mobile variants at the 768px breakpoint.
- [x] 7.2 Implement anchored desktop membership search and touch-friendly mobile membership Sheet/popover.
- [x] 7.3 Add/update all user-facing copy in every supported locale: Current plan, metrics/states, action menus, archive, unit grouping/reprioritization, automatic ordering, membership, conflicts, and removal of obsolete equipment/priority text.
- [x] 7.4 Update project list/detail and create-goal Joyride tutorials, with separate desktop/mobile steps where selectors or interaction differ; update matching i18n and automated tutorial coverage.
- [x] 7.5 Update Insights, Dailies, Goal Overview, detail, and shared-selector tests/tutorial expectations affected by Current plan or unit ordering.

## 8. Verification

- [x] 8.1 Measure dashboard request count and calculation timing with realistic multi-project/multi-unit data; document whether visibility/caching limits prevent excessive fan-out.
- [ ] 8.2 Manually verify dashboard and project detail below and at/above 768px with Current/default/archived projects, multiple units, multiple goals per unit, historical goals, no goals, summary failure, and pending activation.
- [ ] 8.3 Manually verify reprioritization below and at/above 768px: drag, keyboard drag sensor where supported, save, cancel, API failure, dependencies, and Dailies/Insights order after save.
- [ ] 8.4 Manually verify creation/editing with separate same-type goals in different projects, one conflicting selected project, shared canonical goals, archived memberships, and attempted last-membership removal.
- [x] 8.5 Verify no Item/UpgradeItem option remains in UI or generated client types while Character/MoW Upgrade remains functional.
- [ ] 8.6 Run authenticated flows through Aspire and verify updated tutorials on both sides of 768px.
- [x] 8.7 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`.

## 9. Review follow-up

- [x] 9.1 Reconcile zero-project creation, final archived membership, and exact unit-permutation requirements across the design and specs.
- [x] 9.2 Make project-card navigation semantic and keyboard accessible while preserving sibling actions.
- [x] 9.3 Fully validate the project-slot conflict DTO and localize conflict goal-type labels.
- [x] 9.4 Keep the project-membership picker portal inside its enclosing Sheet in create and edit flows.
- [x] 9.5 Preserve and validate reprioritization drafts on stale saves, remove obsolete Item commentary, and run the full apps verification suite.
