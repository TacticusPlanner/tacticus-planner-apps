## RENAMED Requirements

- FROM: `### Requirement: Target save is separate and preserves context`
- TO: `### Requirement: The target is saved with the dialog's single Save and preserves context`

## MODIFIED Requirements

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

### Requirement: The target is saved with the dialog's single Save and preserves context

The Edit goal dialog has one Save. When the target changed, Save SHALL submit it through the revision-checked target update using the revision the dialog was opened with, and that update SHALL change only the target, preserving the goal's identity, status, and creation snapshot. The dialog's other edits (notes, projects, sources, strategy, priority) are submitted by the same Save (see `goal-edit-dialog`); an unchanged target SHALL NOT be submitted.

#### Scenario: Successful target change

- **WHEN** the owner saves a revised Ascension target
- **THEN** the same goal remains in each project with its other settings unchanged and the list shows the new target

#### Scenario: Other detail draft exists

- **WHEN** notes have unsaved changes while the owner saves a changed target
- **THEN** the same Save submits the notes after the target, and neither is dropped

#### Scenario: Only the target changed

- **WHEN** the owner changes only the target and saves
- **THEN** only the target update is submitted, not the notes, projects, sources, strategy, or order

### Requirement: Conflicts preserve the draft

If the server rejects a target edit because the goal revision is stale or the target collides with another milestone, the Edit goal dialog SHALL stay open, retain the proposed target and the rest of the draft, explain the conflict, and offer a way to refresh the current goal before retrying. It SHALL not claim success or overwrite the newer server state.

#### Scenario: Stale revision

- **WHEN** the goal changes elsewhere before the dialog's Save is submitted
- **THEN** the dialog keeps the draft and shows a refresh-and-retry path

#### Scenario: Rank milestone collision

- **WHEN** the new Rank end target matches an existing Rank milestone for the same character in a shared project
- **THEN** the dialog keeps the draft and identifies the conflicting target or goal

### Requirement: Planning reflects the saved target

After a successful edit, the goal list, project views, progress, blockers, farming estimates, and daily planning SHALL reflect the new target without requiring a full browser reload. On success the dialog SHALL close and invalidate the affected queries without awaiting their refetch. Loading and failed refreshes SHALL be distinguishable from a valid zero-need result.

#### Scenario: Rank target expands

- **WHEN** a Rank target is changed from Silver 1 to Gold 1 and the save succeeds
- **THEN** the goal's displayed target and applicable needs and estimates are recomputed for Gold 1

#### Scenario: Refresh fails

- **WHEN** the save succeeds and the dialog closes but a dependent planning query cannot refetch
- **THEN** the list's existing fetch-error state reports the failure rather than presenting the previous estimate as current
