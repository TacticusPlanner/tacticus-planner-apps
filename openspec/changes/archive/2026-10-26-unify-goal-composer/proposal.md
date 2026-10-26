# Unify the goal composer

## Why

The UI/UX audit of the goal dialogs (workspace `goals-dialog/ux-audit.md`) found that many problems come from create and edit being two separately built forms for the same goal. `polish-goal-dialogs` fixes each one where it shows up, but the forms will keep drifting:

- different target pickers;
- validation shown differently;
- a preview that went stale in one form only;
- a tour button in only one of them.

Two further problems are structural:

- **Targets are chosen from long dropdowns.** These hide where the unit is now, which steps are already a goal, and what each step costs. The polish change marks this in the lists, but a dropdown still shows one option at a time.
- **On mobile, create is one long sheet.** Even after the polish change's footer and status fixes, unit, goal types, per-goal settings, projects and review all share one scroll.

## What Changes

- **One goal form for both dialogs.** Create and edit render the same per-kind goal card: target, sources or strategy, Mythic materials, notes and estimate. Edit is that card with the unit and goal type locked, and without the controls that only make sense at creation: prerequisites, milestones, "Create paused" and "Create another goal". Validation messages, empty states and previews are the same in both.
- **Visual target picker.**
  - Rank and Ascension targets are picked on a ladder of steps. The ladder shows the unit's current step, steps already held by another goal (not selectable), and the selected target, with the range between highlighted. The cost of the selected range is shown beside it.
  - Ability levels use a stepper with quick picks: next level, +5, and the cap of the unit's current rarity.
  - Rank's additional target stays a secondary control under the ladder.
- **Mobile create is a three-step flow.** Unit, then Goals, then Review, with Back and Next in the footer and Create goal on the last step. A launch with a prefilled unit (from the Legendary Event page) starts at Goals. Next is unavailable while the current step has blocking problems, which are listed as on desktop. Edit on mobile stays a single form, since it holds one goal.
- **Tours** for both dialogs are updated for the new picker and, on mobile, step through the flow.

Builds on `polish-goal-dialogs`, which must be archived first. Its fixed-height desktop layout, collapsible cards, issue list and default-target rules are kept and reused here.

**Not in scope**

- Quick add from the Goals list and goal presets. These are separate product decisions.
- A desktop wizard. Desktop keeps the polish change's two-pane layout.
- API changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-edit-dialog`: edit presents a goal exactly as creation does, minus creation-only controls.
- `goal-target-editing`: Rank and Ascension targets on a ladder; Ability levels on a stepper with quick picks; in both dialogs.
- `goal-creation`: the mobile create sheet becomes a three-step flow (modifies the compact-layout requirement as amended by `polish-goal-dialogs`).

## Impact

- **Code:**
  - `apps/web/src/fsd/features/goal-create`: the create cards (`unit-goal-form-fields.tsx`, `goal-type-fields.tsx`, `ability-goal-fields.tsx`, `upgrade-goal-fields.tsx`) and the edit form (`goal-edit-form.tsx`, `goal-edit-fields.tsx`, `goal-target-fields.tsx`) are replaced by one set of per-kind cards. The create sheet gains a mobile step container.
  - Edit already reuses `FarmingStrategyField`, `AcquisitionSourceField` and `MythicMaterialSourceField`, so they need no changes.
- **Tests:** the create-sheet and edit-dialog tests move to the shared card where they assert the same behaviour, and the dialog tests keep only dialog-specific cases.
- **Tours and i18n:** both tutorials change, and there are new keys in en/de/es/fr.
- **No API, data model or dependency changes.**
