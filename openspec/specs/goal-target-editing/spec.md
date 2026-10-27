# goal-target-editing Specification

## Purpose

Lets a goal owner revise a supported goal's destination in place while preserving the goal and seeing planning results for the revised target.

## Requirements

### Requirement: Eligible goals expose target editing

The Edit goal dialog (see `goal-edit-dialog`) SHALL show an editable target section for Active or Paused Rank, Ascension, Ability, and Upgrade goals, with no separate Edit target action. It SHALL prefill the stored target, not a target inferred from current progression. Unlock, Completed, and Archived goals SHALL not offer the action. There is no Level goal to edit; the level a Rank or Ability goal needs follows from that goal's own target (see `rank-level-progression`).

#### Scenario: Edit an active Rank goal

- **WHEN** an owner opens the Edit goal dialog for an Active Rank goal
- **THEN** the target section shows that goal's stored end rank selected

#### Scenario: Unsupported goal

- **WHEN** an owner opens the Edit goal dialog for an Unlock or Completed goal
- **THEN** no target section is shown

#### Scenario: Editing a Rank target updates its required level

- **WHEN** an owner saves the dialog with a higher end rank on an Active Rank goal whose new target needs a higher character level
- **THEN** the goal's displayed required level reflects the new target, and no Level goal is created

### Requirement: Target draft is validated before save

The editor SHALL apply the target rules for the goal kind and show a specific validation reason before enabling save. It SHALL allow a valid target already reached by synced progression; that choice SHALL not silently mark the goal Completed. Ability tracks SHALL be independently editable and an Upgrade target SHALL retain its material identity with a positive target quantity.

#### Scenario: Ability track revision

- **WHEN** the owner changes only the Active track's target and leaves the Passive track unchanged
- **THEN** the saved draft contains the new Active target and the prior Passive target

#### Scenario: Invalid target

- **WHEN** the owner chooses a target below the permitted range or an Upgrade quantity of zero
- **THEN** save is unavailable and the invalid field has an explanatory message

#### Scenario: Already reached target

- **WHEN** an owner saves a valid target at or below the character's current progress
- **THEN** the goal remains in its prior status until a separate status action is taken

### Requirement: The target is saved with the dialog's single Save and preserves context

The Edit goal dialog has one Save. When the target changed, Save SHALL submit it as the target section of the goal's single edit request, carrying the revision the dialog was opened with, and that section SHALL change only the target, preserving the goal's identity, status, and creation snapshot. The dialog's other edits (notes, projects, sources, strategy, priority) are sections of the same request (see `goal-edit-dialog`); an unchanged target SHALL NOT be submitted.

#### Scenario: Successful target change

- **WHEN** the owner saves a revised Ascension target
- **THEN** the same goal remains in each project with its other settings unchanged and the list shows the new target

#### Scenario: Only the target changed

- **WHEN** the owner changes only the target and saves
- **THEN** the request carries only the target section, not the notes, projects, sources, strategy, or order

### Requirement: Conflicts preserve the draft

If the server rejects a target edit because the goal revision is stale or the new target collides with another in-flight goal of the same unit, type and target anywhere in the account (see `goal-project-membership`), the Edit goal dialog SHALL stay open, retain the proposed target and the rest of the draft, explain the conflict, and offer a way to refresh the current goal before retrying. It SHALL not claim success or overwrite the newer server state.

#### Scenario: Stale revision

- **WHEN** the goal changes elsewhere before the dialog's Save is submitted
- **THEN** the dialog keeps the draft and its opening base, shows a refresh-and-retry path, and adopts the current goal the rejection carries as the base for the next attempt only after the user chooses refresh

#### Scenario: Rank milestone collision

- **WHEN** the new Rank end target, normalized, matches an existing in-flight Rank milestone for the same character, in any project
- **THEN** the dialog keeps the draft and names the conflicting goal and its target

### Requirement: Planning reflects the saved target

After a successful edit, the goal list, project views, progress, blockers, farming estimates, and daily planning SHALL reflect the new target without requiring a full browser reload. On success the dialog SHALL close and invalidate the affected queries without awaiting their refetch. Loading and failed refreshes SHALL be distinguishable from a valid zero-need result.

#### Scenario: Rank target expands

- **WHEN** a Rank target is changed from Silver 1 to Gold 1 and the save succeeds
- **THEN** the goal's displayed target and applicable needs and estimates are recomputed for Gold 1

#### Scenario: Refresh fails

- **WHEN** the save succeeds and the dialog closes but a dependent planning query cannot refetch
- **THEN** the list's existing fetch-error state reports the failure rather than presenting the previous estimate as current

### Requirement: The Upgrade target section edits the range

For an Active or Paused Upgrade goal the Edit goal dialog SHALL prefill the stored range (rank
range for a Character; per-track ranges for a Machine of War) and allow changing or clearing it,
validated like creation (end above start, within the ladder). Saving sends the range together with
the targets as one replacement. A goal stored without a range SHALL show the selectors unset.

#### Scenario: Range is prefilled

- **WHEN** an owner opens the dialog for an Upgrade goal stored with rank range Stone2→Stone4
- **THEN** the target section shows Stone2→Stone4

#### Scenario: Clearing the range

- **WHEN** the owner clears the range and saves
- **THEN** the goal is stored without a range and planning treats it as additive

#### Scenario: Planning reflects the new range

- **WHEN** the owner saves a different range
- **THEN** Today, the Schedule and Remaining recalculate the overlap with the new range

### Requirement: Target collisions name the sibling goal for every type

When a target edit collides with another in-flight goal of the same unit and type, the dialog SHALL keep the draft and show a message naming the sibling goal's type and target, for Rank, Ascension, Ability and Upgrade alike, with an action that opens that goal.

#### Scenario: Ascension edit collides

- **GIVEN** Ragnar has in-flight Ascension goals ending at `Legendary:RedFiveStars` and `Mythic:OneBlueStar`
- **WHEN** the user edits the first goal's end to `Mythic:OneBlueStar` and saves
- **THEN** the draft is kept and the message names the existing Ascension → Mythic ★1 goal

### Requirement: Target options start above the goal's start

In the Create and Edit goal dialogs, a target picker SHALL offer only targets above the goal's start, for Rank, Ascension and each Ability track. It SHALL NOT offer a "None" or empty target. When a stored target is itself at or below the start, for example after an import, that stored value SHALL stay listed so the picker never opens blank. It SHALL then show the existing below-range message.

#### Scenario: Ascension edit

- **WHEN** the Edit goal dialog opens for Toth's Ascension goal that started at Epic two red stars
- **THEN** the target picker lists only progressions above Epic two red stars and no "None" option

#### Scenario: Ascension create

- **GIVEN** Incisus is Legendary with three red stars
- **WHEN** the user opens the Ascension target picker in the create sheet
- **THEN** the first option is Legendary four red stars

### Requirement: An Upgrade quantity error names its row

In the Edit goal dialog, an invalid Upgrade quantity SHALL show its message on the row of that material and mark that field invalid for assistive technology. It SHALL NOT show only one message for the whole list.

#### Scenario: One cleared quantity among two materials

- **WHEN** the owner clears the Lavish Helmet Crest quantity and leaves Psyk-Conductive Material at 1
- **THEN** only the Lavish Helmet Crest row shows the quantity message and is marked invalid, and Save is unavailable

### Requirement: The Edit goal dialog can add and remove Upgrade materials

For an Upgrade goal, the Edit goal dialog SHALL let the owner add materials with the same material picker as creation and remove any material row, as long as at least one material remains. Saving SHALL submit the whole material list as the Upgrade target. Removing the last material SHALL NOT be possible; the remove control on a single remaining row SHALL be unavailable.

#### Scenario: Add a material

- **GIVEN** Shiron's Upgrade goal targets Lavish Helmet Crest ×1
- **WHEN** the owner adds Psyk-Conductive Material ×2 and saves
- **THEN** the goal targets both materials

#### Scenario: Remove a material

- **GIVEN** an Upgrade goal with two materials
- **WHEN** the owner removes one and saves
- **THEN** the goal targets only the remaining material

#### Scenario: Last material

- **WHEN** an Upgrade goal has one material in the dialog
- **THEN** that row's remove control is unavailable

### Requirement: Rank and Ascension targets are picked on a ladder

In the create and Edit goal dialogs, Rank and Ascension targets SHALL be chosen on a ladder that shows every step of the unit's track, grouped by tier. The goal's start step SHALL be marked "Current". The selected target SHALL be marked, and the steps from start to target SHALL be highlighted. Rank's additional target SHALL stay a separate control under the ladder.

#### Scenario: Incisus Rank ladder

- **GIVEN** Incisus is Gold II and the Rank target is Diamond II
- **WHEN** the Rank card is open
- **THEN** Gold II is marked Current, Diamond II is marked selected, and Gold II to Diamond II is highlighted

#### Scenario: Stored target at or below start

- **GIVEN** an imported goal whose stored target is at or below its start
- **WHEN** the Edit goal dialog opens
- **THEN** that stored step is shown as selected, together with the below-range message

### Requirement: Ladder steps that cannot be targets are not selectable

On the ladder, steps at or below the goal's start SHALL NOT be selectable. Steps that another in-flight goal of the same kind and unit already targets SHALL NOT be selectable and SHALL be marked "Already a goal".

#### Scenario: Taken steps

- **GIVEN** Incisus is Gold II and has in-flight Rank goals targeting Gold III and Diamond I
- **WHEN** the Rank card is open
- **THEN** Silver III, Gold II, Gold III and Diamond I cannot be selected, and Gold III and Diamond I are marked "Already a goal"

### Requirement: The ladder is keyboard and touch operable

Each ladder step SHALL have an accessible name with its step name and state. Arrow keys SHALL move between selectable steps, and Enter or Space SHALL select. At 768px or wider all tiers SHALL show without scrolling. Below 768px the tiers SHALL wrap onto several rows and each step's hit area SHALL be at least 44px tall.

#### Scenario: Keyboard selection

- **GIVEN** focus is on the selected step Diamond II
- **WHEN** the user presses the right arrow and then Enter
- **THEN** Diamond III is selected

#### Scenario: Desktop layout

- **WHEN** the ladder is shown at 1280px
- **THEN** every tier is visible without scrolling

#### Scenario: Mobile layout

- **WHEN** the ladder is shown at 390px
- **THEN** the tiers wrap onto several rows and each step is at least 44px tall

### Requirement: The selected target range shows its cost

Beside the ladder, the card SHALL state the selected range ("Gold II → Diamond II") and the resources it needs, from the same preview result as the card's estimate. While that preview is loading or has failed, it SHALL say so.

#### Scenario: Range changes

- **WHEN** the user moves the Rank target from Diamond II to Diamond III
- **THEN** the stated range and its resources update to Gold II → Diamond III

### Requirement: Ability levels use a stepper

In the create and Edit goal dialogs, each ability track's target level SHALL be set with a number stepper (decrease, value, increase), ranging from the start (no change on that track) to 60, the highest ability level of any rarity. A typed value outside the range SHALL show the range message.

#### Scenario: Decrease stops at start

- **GIVEN** the start is 35 and the target is 35
- **THEN** the decrease control is unavailable and the value reads as no change

### Requirement: An Ability goal raises at least one track

An Ability goal SHALL be valid when at least one track rises above its start; a track left at its start is not changed. When neither track rises, the card SHALL show the no-change message. A target above the unit's current rarity cap SHALL keep the existing above-cap behaviour, including the Ascension prerequisite suggestion.

#### Scenario: Raise one track only

- **GIVEN** active and passive are both at 35
- **WHEN** the user raises active to 40 and leaves passive at 35
- **THEN** the goal is valid and targets active 40 only

#### Scenario: Neither track raised

- **WHEN** both tracks are at their start
- **THEN** the card shows the no-change message and creation or saving is unavailable

### Requirement: Ability steppers offer quick picks

Each ability stepper SHALL offer "Next" (start + 1), "+5" (start + 5, capped at 60), and "Rarity cap" (the ability cap of the unit's current rarity). "Rarity cap" SHALL be hidden when the start is at or above that cap.

#### Scenario: Quick picks for a Legendary unit at 35

- **GIVEN** the active ability is at 35 and the unit is Legendary, with cap 50
- **WHEN** the user activates "Next", then "+5", then "Rarity cap"
- **THEN** the target becomes 36, then 40, then 50

#### Scenario: At the rarity cap

- **GIVEN** a Legendary unit whose active ability is at 50
- **THEN** "Rarity cap" is not offered and "Next" sets 51
