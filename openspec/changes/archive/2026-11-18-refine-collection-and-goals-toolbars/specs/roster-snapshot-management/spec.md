## MODIFIED Requirements

### Requirement: The user takes a snapshot from a fresh sync

The Collection toolbar SHALL hold a **Snapshots** menu button for a signed-in user, both in and outside compare mode, marked "Compare" while compare mode is on. The menu SHALL offer, in order: Compare with a snapshot (a checkbox item that turns compare mode on and off, see `collection-snapshot-compare`), Take snapshot, and Manage snapshots with the usage "<count>/<limit>". Take snapshot SHALL open the snapshot dialog. The dialog SHALL offer an optional name (at most 60 characters; blank uses the date), and SHALL show usage as "<count>/<limit>". On confirm, it SHALL request a snapshot with a fresh sync and show "Syncing…" until it finishes.

- On success, the dialog closes, player data is refreshed, the list is refreshed, and a toast confirms with a Compare action that opens compare mode with the new snapshot.
- On a sync failure, the dialog SHALL show the error with Retry and "Take from last sync (synced <relative time>)", which requests the snapshot without syncing.
- When rate limited, it SHALL show when a retry is possible, alongside the same fallback.
- When the user has never synced, the fallback SHALL NOT be offered; the dialog SHALL show the error with Retry only.
- At the limit, the Take snapshot item SHALL be disabled and show "Delete a snapshot to take a new one". A limit conflict from the API SHALL show the same message.

#### Scenario: Successful snapshot

- **GIVEN** a user with 11 snapshots
- **WHEN** they take a snapshot named "Before LE"
- **THEN** "Syncing…" shows, then the dialog closes, a toast offers Compare, and usage reads 12/20

#### Scenario: Tacticus is down

- **GIVEN** the sync fails with the Tacticus API unavailable, and the last sync was 2 hours ago
- **WHEN** the user selects "Take from last sync (synced 2 hours ago)"
- **THEN** a snapshot is taken without syncing and the dialog closes

#### Scenario: Sync fails before any sync

- **GIVEN** a user who has never synced
- **WHEN** the sync fails
- **THEN** the dialog shows the error with Retry, and no "Take from last sync" option

#### Scenario: At the limit

- **GIVEN** a user with 20 snapshots
- **WHEN** they open the Snapshots menu
- **THEN** Take snapshot is disabled and says to delete a snapshot first

### Requirement: The user renames and deletes snapshots

A Manage snapshots sheet, opened from the Snapshots menu, SHALL list personal snapshots newest first, each with its name, date and relative age, plus usage "<count>/<limit>". A name SHALL be editable inline, saved on Enter or blur, and cancelled on Escape, under the same name rules. Delete SHALL ask for confirmation, naming the snapshot, and then delete it permanently. Legendary Event run-record rosters SHALL NOT be listed in this sheet. When the deleted snapshot is the one being compared, the comparison SHALL fall back to `latest`.

#### Scenario: Delete the compared snapshot

- **GIVEN** compare mode showing snapshot "Oct" vs Current, with a newer snapshot "Nov"
- **WHEN** the user deletes "Oct" and confirms
- **THEN** "Oct" is gone and "Nov" is compared with Current

#### Scenario: Cancel delete

- **WHEN** the user selects delete and then cancels the confirmation
- **THEN** the snapshot remains
