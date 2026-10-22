# Spec Delta

## MODIFIED Requirements

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

If the server rejects a target edit because the goal revision is stale or the target collides with another in-flight goal of the same unit anywhere in the account, the Edit goal dialog SHALL stay open, retain the proposed target and the rest of the draft, explain the conflict, and offer a way to refresh the current goal before retrying. It SHALL not claim success or overwrite the newer server state.

#### Scenario: Stale revision

- **WHEN** the goal changes elsewhere before the dialog's Save is submitted
- **THEN** the dialog keeps the draft, adopts the current goal the rejection carries as the base for the next attempt, and shows a refresh-and-retry path

#### Scenario: Rank milestone collision

- **WHEN** the new Rank end target matches an existing in-flight Rank milestone for the same character, in any project
- **THEN** the dialog keeps the draft and names the conflicting goal and its target
