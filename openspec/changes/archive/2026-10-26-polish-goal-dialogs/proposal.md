# Proposal

## Why

A UI/UX audit of the Create and Edit goal dialogs (workspace `goals-dialog/ux-audit.md`, 2026-10-26, desktop 1280px and mobile 390px, every goal type) found problems in three areas:

- **The create form often opens invalid or colliding.**
  - Ascension's target defaults to the current step.
  - Rank's default target can be one the unit already has a goal for.
- **Errors are hard to find and fix.**
  - Only one error shows at a time, at the bottom of a long form.
- **Some controls mislead the user.**
  - Goal-type labels can't be clicked.
  - Edit's farming-strategy preview describes the saved range, not the edited one.
  - Several sections render empty.

These cost every user time on the most-used flow in the planner, and some are accessibility failures. This is a frontend-only change; no `tacticus-planner-api` companion change is needed.

## What Changes

**Create dialog — defaults and conflicts**

- Each type's default target is the first target above the unit's current value that no existing active or paused goal already holds. Ascension no longer defaults to the current step.
- Target dropdowns mark targets that are already a goal, and disable them with a reason.
- Unlock is disabled, with a reason, when the unit already has an Unlock goal.
- Slot conflicts show inside the affected type's card.
- Machine-of-War units get Machine-of-War wording, not "character".

**Create dialog — validation and review**

- Every blocking problem is shown inline, under the control that causes it.
- A summary next to the submit button lists all problems; each item moves focus to its field.
- Invalid fields are marked for assistive technology.
- Upgrade quantities are no longer silently clamped. Invalid values get an inline error, and a target at or below the owned count gets a warning. The owned count is shown next to each quantity.
- "What will be created" lists each goal with its target range, in card order. When the form is invalid it says so instead of "calculating…", and its estimate is labelled.

**Both dialogs — target pickers and empty states**

- Target pickers (create and edit, every type) offer only targets above the goal's start. They offer no "None" option.
- Sections that have nothing to show say so: MoW Ability resources, edit farming locations, edit "Started from".
- Edit's MoW ability start values name their tracks.
- Shard locations that the catalog can't resolve are not offered as raw ids.
- Shop offers available on all seven days say "Every day".
- When Campaigns is selected with no node checked, the group states that the cheapest node of the needed type will be used. This is the behavior the spec already defines; the UI never said so.

**Create dialog — notes and priority**

- Creation sets notes per goal and where the new goals sit in the global priority order. This needs an API addition (see Impact).

**Edit dialog**

- The Rank farming-strategy preview follows the edited target.
- The header carries the page tour button, as Create's does.
- The dialog previews the resources and estimated days for the draft target, using the same estimate as the create preview. This replaces the current rule that edit shows no estimate.
- Upgrade goals can add and remove materials, using the create dialog's material picker. The API already accepts the whole material list.

**Accessibility**

- Goal-type and prerequisite checkboxes are named by, and toggled from, their whole label row.
- The keyboard focus indicator on dialog controls meets 3:1 contrast.

**Mobile create sheet**

- The footer holds only Close and Create goal, side by side. "Create paused" and "Create another goal" move into the body.
- Current status collapses to a one-line summary.
- A newly enabled goal-type card scrolls into view.

**Desktop layout**

- The dialog opens at a fixed height, so enabling the first goal type no longer makes it jump and re-centre.
- The form sits in a scrolling main column beside a column that stays in view, holding the current status and "What will be created" with per-goal costs. Until a type is chosen, the main column shows an empty state.
- Goal cards collapse to a one-line summary (start → target and any problems), with only one card open at a time. This happens on mobile too. Card headers are visually set off, so several goals no longer blend into one form.

**Desktop layout polish**

- Edit target selects have a sensible maximum width.
- The upgrade picker shows full material names.
- Repeated "Resources needed" lines are merged.

**Not in scope**

- One shared form for create and edit, a visual target picker, and a mobile step-by-step flow. These follow in `unify-goal-composer`.
- Pause at creation beyond the existing "Create paused".
- Pause or milestones in edit.
- Renaming Close to Cancel.
- A distinct Upgrade icon.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-creation`:
  - default targets skip reached and taken targets;
  - taken targets are marked;
  - an existing Unlock goal disables Unlock;
  - validation is inline, with a summary;
  - upgrade quantities are validated;
  - the review lists targets;
  - unit-kind wording;
  - the mobile footer and status-summary layout;
  - newly enabled cards scroll into view;
  - the desktop fixed-height two-pane layout and collapsible goal cards;
  - notes and priority at creation.
- `goal-edit-dialog`:
  - the dialog may show an estimate for the draft target (modifies "The Edit goal dialog contains only editable fields");
  - tour button in the header;
  - the strategy preview follows the draft;
  - no blank "Started from";
  - labelled ability starts;
  - an explicit empty state for farming locations.
- `goal-target-editing`: target options exclude steps at or below the start for every kind; upgrade quantity errors name their row; Upgrade materials can be added and removed in edit.
- `goal-acquisition-source-picker`: unresolved nodes are not offered; all-week offers read "Every day"; a Campaigns group with no node checked states that the cheapest node will be used.
- `goal-visual-accessibility`: named, label-toggled checkboxes and a visible focus indicator in the goal dialogs.

## Impact

- **Code:**
  - `apps/web/src/fsd/features/goal-create`: the create form model and fields, the edit form and fields, shared visuals.
  - `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx`, which hosts the edit dialog, for the tour button.
  - `apps/web/src/fsd/shared/ui/responsive-dialog.tsx` gains an optional desktop class for the fixed height.
  - `packages/ui` checkbox and select focus styles. This is an app-wide visual change.
- **i18n:** new and changed keys in `apps/web/public/locales/{en,de,es,fr}/common.json`.
- **Tours:** the create and edit dialog tutorials gain steps or new targets for the review summary and the mobile status summary.
- **API:** `POST` combined create needs optional per-goal `notes` and an optional request-level priority `position`. `CombinedGoalSpec` has no notes and the request has no position today. This goes in a companion `tacticus-planner-api` change that lands first; the apps tasks for notes and priority depend on it. Doing it as follow-up `PUT` calls after creation was rejected because a half-failed batch would leave goals without their notes or in the wrong place.
- **No data model or dependency changes in this repo.**
