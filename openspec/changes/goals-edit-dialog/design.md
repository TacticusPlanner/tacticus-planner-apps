## Context

- `GoalDetailSheet` (`pages/goals/ui/goal-detail/goal-detail-sheet.tsx`, 431 lines) hosts a view mode (`GoalDetailView`, header, estimate, guidance, dependencies) and an edit mode (`GoalDetailEditForm`: notes, projects, farming strategy, acquisition sources, locations), with `GoalTargetSection` as a third, independently saved editor (`updateGoalTarget`, revision-checked). General save is `updateGoal` then `updateGoalProjects` (`use-goal-detail-save.ts`). Opened from the goal name link (`GoalNameLink` -> `onView`) on the Goals page and Project Detail; it also links to prerequisite goals and launches Create goal from blockers.
- `CreateGoalSheet` is a `Sheet` rendered once from `app-shell.tsx` (the launcher context). The shared `Sheet` already resolves `bottom` on mobile and `right` (`sm:max-w-sm`) on desktop.
- Priority is the account-wide order: `updateGoalOrder(goalIds, expectedRevision)` takes the complete ordered in-flight list; `moveOntoDisplaced` (`entities/goal/model/goal-order.ts`) already implements the move.
- `unit-combobox` / `rarity-combobox` portal into the enclosing Sheet content node to dodge Radix scroll lock.
- Saving today would take four calls (`updateGoalTarget`, `updateGoal`, `updateGoalProjects`, `updateGoalOrder`) that can half-apply. The companion API change `goals-edit-dialog` (applies first) adds one atomic endpoint, `PUT me/goals/{goalId}/edit`, with optional `target`, `details`, `projects`/`projectIds`, and `priority {position, expectedOrderRevision}` sections; it returns the updated goal (and the new order when priority was sent), and reuses the existing 400/409 bodies.

## Goals / Non-Goals

**Goals:**

- One presentation-adaptive shell (dialog on desktop, bottom sheet on mobile) used by Create and Edit.
- Edit reduced to editable fields with one atomic Save.
- A position select for priority reusing the existing reorder path.

**Non-Goals:**

- No change to the create form's fields, validation, or launcher/prefill behavior.
- No change to how estimates, blockers, or guidance are computed (they simply lose this surface).
- No relocation of the removed information (history, dependencies, guidance); the list, Dailies, and project guidance remain as they are.
- Other sheets (`ManageProjectsSheet`, `AddGoalsToProjectSheet`) stay sheets.

## Decisions

1. **Shell: a `ResponsiveDialog` in `shared/ui`.** It renders Radix `Dialog` when `!useIsMobile()` and the existing `Sheet` (bottom) otherwise, exposing Header/Title/Body/Footer parts so Create and Edit share layout and portal-container plumbing. Alternative: change `Sheet`'s desktop side to a dialog globally, which would also move the two project sheets (out of scope). Alternative: two separate components per goal form, which duplicates the discard/outside-click logic.
2. **Layout.** Desktop dialog: `max-w-5xl`-class width, `max-h-[90vh]`, header and footer fixed, body `overflow-y-auto`, body content in a two-column grid (`md:grid-cols-2` at the dialog's own width via container query, so the split follows dialog width, not the viewport). Fields that are naturally wide (acquisition source tree, unit/goal-type cards in Create) span both columns. Mobile: unchanged single column.
3. **Combobox portal.** Both comboboxes and `GoalProjectsField` resolve the portal container from the shell (the dialog content node) exactly as they did from the Sheet's; the "closest Sheet content" lookup is generalized to "closest dialog/sheet content". This is the highest-risk part (scroll lock inside popovers) and is verified by test and in the browser.
4. **Edit form state: one draft.** A single `GoalEditDraft` holds target draft, notes, strategy, locations, sources, project ids, and priority position; "dirty" is a comparison against the loaded goal (reusing `hasGoalDetailDraftChanged`, `isGoalTargetDraftChanged`). `GoalTargetSection` is split: the field editors (`goal-target-fields.tsx`, `goal-target-edit.ts`) are kept and rendered inline with no own Edit/Save/Cancel; its save logic is replaced by the dialog's single Save request. Alternative: keep the section self-contained with its own button, rejected by the single-Save decision.
5. **Save is one request.** `useGoalEditSave` builds the request from the draft's differences (only changed sections; `expectedRevision` is the loaded `detail.revision`, sent with the target) and calls a new `editGoal` client function in `entities/goal`. Success replaces the goal in the cache, applies the returned order to the order cache, then invalidates goal/project/planning queries once and closes. Failures are all-or-nothing, so the draft is kept untouched and mapped to the existing typed errors (stale revision -> refresh-and-retry, membership/slot conflict, order conflict -> reload order, 400 naming the section). Alternative: four sequential calls with partial-failure bookkeeping, rejected as fragile and unnecessary given the new endpoint.
6. **Priority select.** Options 1..N from `inFlightInGlobalOrder(goals)` (the same list the Goals page uses); the goal's index is the initial value. On save, send `priority: { position, expectedOrderRevision }` with the revision from the global-plan query (`use-global-goal-plan.ts`); the server computes the move, so the client no longer builds an id list for this path. A 409 (`goalOrderConflictDetails`) keeps the draft and refetches the order on "reload". Goals without a position (Completed/Archived) hide the select. The Goals page's reorder hook is the single owner of the order revision; the dialog reads it through the entity's public API rather than the page's hook.
7. **Opening and routing.** Pages own `editGoalId` state (as they own `detailGoalId` today) and render `GoalEditDialog`. `GoalNameLink` renders plain text (keeping the Unlock hover behavior it has now); `goal-row-actions.tsx` gains an Edit button (desktop) and a card action (mobile), with `stopRowNavigation` as for its siblings. The dependency/prerequisite navigation (`onViewGoal`, `onGoalChange`, `createPrerequisite`, `isolated`, estimate props, `levelChargedXp` and the potential-ratio props) all disappear from the dialog's props; the pages stop computing dialog-only inputs where they are not shared with the list.
8. **Desktop vs mobile split (per repo rule).** Same fields and Save behavior on both; only the shell differs (desktop centered dialog with two columns; mobile bottom sheet with one column). Tour: the Edit dialog tutorial targets `data-testid` selectors that exist in both shells; the desktop steps use the two-column layout targets and the mobile steps the sheet's, registered while open as today.
9. **Removal is by deletion.** `goal-detail-view`, `goal-detail-header`, `goal-estimate-section`, `goal-farming-guidance` (the detail one), `goal-farming-summary`, `use-goal-detail-metrics`, `goal-detail-projects`, the dependency queries, and their tests are deleted; helpers with other consumers (`prerequisitePrefill`, blockers) stay. knip and `lint:fsd` catch anything left unreferenced.

## Risks / Trade-offs

- [Combobox scroll-lock/portal regressions inside `Dialog`] -> shared portal-container helper plus tests that scroll a popover list inside the dialog, and a browser check on both shells.
- [The API half must land first] -> the apps change is applied after the API change merges; the client type is regenerated from its OpenAPI artifact.
- [Information removed from the UI (blockers, guidance, dependencies) leaves no per-goal view] -> accepted by the requester; the list's Remaining column and blocker/status cells and Dailies remain. Called out as BREAKING in the proposal.
- [Priority select for a long list (100+ options)] -> native-feeling `Select` with scroll; acceptable, revisit if it proves unwieldy.
- [Large refactor of a 954-line and a 2,073-line test file] -> tests are rewritten around the new dialog contract rather than ported line by line; the create-goal tests change only where they assert the sheet shell.

## Migration Plan

Apply and merge the API change first, then this one; no flag. Rollback is a revert of the apps PR (the additive endpoint can stay). No data migration; no persisted preference is involved.
