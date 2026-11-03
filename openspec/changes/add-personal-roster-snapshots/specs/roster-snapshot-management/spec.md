## ADDED Requirements

### Requirement: The user takes a snapshot from a fresh sync

A signed-in user SHALL be able to take a snapshot from a Take snapshot button in the Collection toolbar, both in and outside compare mode. The dialog SHALL offer an optional name (at most 60 characters; blank uses the date), and SHALL show usage as "<count>/<limit>". On confirm, it SHALL request a snapshot with a fresh sync and show "Syncing…" until it finishes.

- On success, the dialog closes, player data is refreshed, the list is refreshed, and a toast confirms with a Compare action that opens compare mode with the new snapshot.
- On a sync failure, the dialog SHALL show the error with Retry and "Take from last sync (synced <relative time>)", which requests the snapshot without syncing.
- When rate limited, it SHALL show when a retry is possible, alongside the same fallback.
- At the limit, the button SHALL be disabled, with a tooltip "Delete a snapshot to take a new one". A limit conflict from the API SHALL show the same message.

#### Scenario: Successful snapshot

- **GIVEN** a user with 11 snapshots
- **WHEN** they take a snapshot named "Before LE"
- **THEN** "Syncing…" shows, then the dialog closes, a toast offers Compare, and usage reads 12/20

#### Scenario: Tacticus is down

- **GIVEN** the sync fails with the Tacticus API unavailable, and the last sync was 2 hours ago
- **WHEN** the user selects "Take from last sync (synced 2 hours ago)"
- **THEN** a snapshot is taken without syncing and the dialog closes

#### Scenario: At the limit

- **GIVEN** a user with 20 snapshots
- **WHEN** they look at the Take snapshot button
- **THEN** it is disabled and its tooltip says to delete a snapshot first

### Requirement: The user renames and deletes snapshots

A Manage snapshots sheet SHALL list personal snapshots newest first, each with its name, date and relative age, plus usage "<count>/<limit>". A name SHALL be editable inline, saved on Enter or blur, and cancelled on Escape, under the same name rules. Delete SHALL ask for confirmation, naming the snapshot, and then delete it permanently. Legendary Event run-record rosters SHALL NOT be listed in this sheet. When the deleted snapshot is the one being compared, the comparison SHALL fall back to `latest`.

#### Scenario: Delete the compared snapshot

- **GIVEN** compare mode showing snapshot "Oct" vs Current, with a newer snapshot "Nov"
- **WHEN** the user deletes "Oct" and confirms
- **THEN** "Oct" is gone and "Nov" is compared with Current

#### Scenario: Cancel delete

- **WHEN** the user selects delete and then cancels the confirmation
- **THEN** the snapshot remains

### Requirement: The picker offers personal snapshots and Legendary Event rosters

The from and to pickers SHALL list personal snapshots (newest first) and, under a "Legendary Events" group, every run-record roster of the user's Legendary Event plans, labeled with event, run and date. Run-record rosters SHALL be read-only: they can be compared, but not renamed or deleted, and they do not count toward usage. The to picker SHALL also offer Current, first, and SHALL list only sources newer than the from source.

#### Scenario: Compare with a run record

- **GIVEN** an Uthar run 2 record
- **WHEN** the user picks "Uthar · run 2 · Oct 12, 2026" as the from source
- **THEN** its roster is compared with Current

### Requirement: Snapshot actions are reported as analytics events

Taking a snapshot (including whether it used the last-sync fallback), opening compare mode, selecting a summary metric, renaming and deleting SHALL each be reported as a declared analytics event (see `product-analytics`). Events SHALL NOT include snapshot names.

#### Scenario: Taking a snapshot is reported

- **WHEN** a user takes a snapshot from a fresh sync
- **THEN** one snapshot-taken event with `fromLastSync: false` is reported, without the name
