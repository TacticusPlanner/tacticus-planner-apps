# goal-target-editing Specification

## Purpose

Lets a goal owner revise a supported goal's destination in place while preserving the goal and seeing planning results for the revised target.

## Requirements

### Requirement: Eligible goals expose target editing

The goal detail SHALL offer an explicit Edit target action for Active or Paused Rank, Ascension, Level, Ability, and Upgrade goals. It SHALL prefill the stored target, not a target inferred from current progression. Unlock, Completed, and Archived goals SHALL not offer the action.

#### Scenario: Edit an active Rank goal

- **WHEN** an owner opens an Active Rank goal and selects Edit target
- **THEN** the editor opens with that goal's stored end rank selected

#### Scenario: Unsupported goal

- **WHEN** an owner opens an Unlock or Completed goal
- **THEN** no Edit target action is available

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

### Requirement: Target save is separate and preserves context

Saving a target SHALL use the goal revision that was loaded with the edit form. It SHALL update only the target and SHALL preserve the goal's identity, project memberships, source preferences, notes, strategy, status, and creation snapshot. Other detail edits SHALL not be silently submitted by Save target.

#### Scenario: Successful target change

- **WHEN** the owner saves a revised Ascension target
- **THEN** the same goal remains in each project with its other settings unchanged and the detail shows the new target

#### Scenario: Other detail draft exists

- **WHEN** notes have unsaved changes while the owner saves a target
- **THEN** the target save does not submit those notes or discard their unsaved draft

### Requirement: Conflicts preserve the draft

If the server rejects a target edit because the goal revision is stale or the target collides with another milestone, the editor SHALL retain the proposed target, explain the conflict, and offer a way to refresh the current goal before retrying. It SHALL not claim success or overwrite the newer server state.

#### Scenario: Stale revision

- **WHEN** the goal changes elsewhere before Save target is submitted
- **THEN** the editor keeps the draft and shows a refresh-and-retry path

#### Scenario: Rank milestone collision

- **WHEN** the new Rank end target matches an existing Rank milestone for the same character in a shared project
- **THEN** the editor keeps the draft and identifies the conflicting target or goal

### Requirement: Planning reflects the saved target

After a successful edit, the goal list, goal detail, project views, progress, blockers, farming estimates, and daily planning SHALL reflect the new target without requiring a full browser reload. Loading and failed refreshes SHALL be distinguishable from a valid zero-need result.

#### Scenario: Rank target expands

- **WHEN** a Rank target is changed from Silver 1 to Gold 1 and the save succeeds
- **THEN** the goal's displayed target and applicable needs and estimates are recomputed for Gold 1

#### Scenario: Refresh fails

- **WHEN** the save succeeds but a dependent planning query cannot refresh
- **THEN** the UI reports stale planning data and offers retry rather than presenting the previous estimate as current
