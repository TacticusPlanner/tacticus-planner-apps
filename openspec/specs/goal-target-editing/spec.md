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

#### Scenario: Other detail draft exists

- **WHEN** notes have unsaved changes while the owner saves a changed target
- **THEN** the same request carries the target and the notes, and neither is dropped

#### Scenario: Only the target changed

- **WHEN** the owner changes only the target and saves
- **THEN** the request carries only the target section, not the notes, projects, sources, strategy, or order

### Requirement: Conflicts preserve the draft

If the server rejects a target edit because the goal revision is stale or a Rank target collides with another in-flight Rank goal of the same unit anywhere in the account (same `(entityType, entityId, normalizedEndTarget)`; a non-Rank target edit keeps its `(entityType, entityId, goalType)` slot and cannot collide, see `goal-project-membership`), the Edit goal dialog SHALL stay open, retain the proposed target and the rest of the draft, explain the conflict, and offer a way to refresh the current goal before retrying. It SHALL not claim success or overwrite the newer server state.

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
