# roster-snapshot-management Specification

## Purpose

TBD - created by archiving change add-automatic-roster-snapshots. Update Purpose after archive.

## Requirements

### Requirement: Automatic snapshots are labeled and kept separately

Snapshots with source `Auto` SHALL be labeled "Auto · <date>", with the date localized and including the year (for example "Auto · Nov 3, 2026"), unless renamed. A renamed one SHALL show its name with an Auto badge. The manage sheet SHALL list them in an Automatic section after the manual snapshots, with usage "<autoCount>/<autoLimit>" and the note "Taken after a sync when your roster has no snapshot or Legendary Event roster from the last 30 days. Up to <autoLimit> are kept; the oldest is replaced." Under it, the section SHALL say when the next one can be taken: "Next automatic snapshot after <date>", where the date is the newest personal snapshot or Legendary Event roster plus 30 days, or "Next automatic snapshot with your next sync" once that date has passed or no roster exists. Automatic snapshots SHALL NOT count toward the manual usage shown in the take dialog.

#### Scenario: A recent Legendary Event roster holds back the automatic snapshot

- **GIVEN** a user whose newest roster is an unplanned Legendary Event's roster from Nov 22, 2026
- **WHEN** they open Manage snapshots
- **THEN** the Automatic section reads "Next automatic snapshot after Dec 22, 2026"

#### Scenario: Label with year

- **GIVEN** an automatic snapshot taken 2026-11-03 in the English locale
- **WHEN** the picker lists it
- **THEN** it reads "Auto · Nov 3, 2026"

### Requirement: An automatic snapshot can be kept

Each automatic snapshot in the manage sheet SHALL offer Keep. Keep SHALL convert it into a manual snapshot, moving it into the manual list and increasing manual usage by one. At the manual limit, Keep SHALL be disabled, with the tooltip "Delete a snapshot to keep this one". A limit conflict from the API SHALL show the same message, and nothing changes.

#### Scenario: Keep

- **GIVEN** 5 manual and 3 automatic snapshots
- **WHEN** the user keeps the automatic snapshot from Oct 1, 2026
- **THEN** the manual list has 6 with that snapshot in it, and the Automatic section has 2

### Requirement: V1-imported snapshots show unknown fields as unknown

Snapshots with source `V1Import` SHALL be labeled "V1 · <name>". When either side of a comparison is a `V1Import` snapshot, XP gained and applied upgrades SHALL be shown as "—" in details, and SHALL NOT produce a chip or count in the summary.

#### Scenario: V1 import vs Current

- **GIVEN** "V1 · Before Uthar" vs Current, where Calgar's XP level rose 45 → 48
- **WHEN** his details open
- **THEN** XP level shows 45 → 48, XP gained shows "—", and applied upgrades show "—"

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

A Manage snapshots sheet, opened from the Snapshots menu, SHALL list personal snapshots newest first, each with its name, date and relative age, plus usage "<count>/<limit>". A name SHALL be editable inline, saved on Enter or blur, and cancelled on Escape, under the same name rules. Delete SHALL ask for confirmation, naming the snapshot, and then delete it permanently. After the Automatic section, a read-only "Legendary Event rosters" section SHALL list every run-record roster of the user, for every Legendary Event whether or not it has a plan, newest first, each with its event, run, date and relative age, and a note that they count as recent snapshots. They have no rename, delete or Keep. The sheet SHALL read them in one call (`GET /legendary-event-run-records`) only while it is open. When the deleted snapshot is the one being compared, the comparison SHALL fall back to `latest`.

#### Scenario: An unplanned event's roster is listed

- **GIVEN** a run-record roster for an event the user never planned
- **WHEN** they open Manage snapshots
- **THEN** the Legendary Event rosters section lists it, with no rename or delete

#### Scenario: Delete the compared snapshot

- **GIVEN** compare mode showing snapshot "Oct" vs Current, with a newer snapshot "Nov"
- **WHEN** the user deletes "Oct" and confirms
- **THEN** "Oct" is gone and "Nov" is compared with Current

#### Scenario: Cancel delete

- **WHEN** the user selects delete and then cancels the confirmation
- **THEN** the snapshot remains

### Requirement: The picker offers personal snapshots and Legendary Event rosters

The from and to pickers SHALL list personal snapshots (newest first) and, under a "Legendary Events" group, every run-record roster of the user, for every Legendary Event whether or not it has a plan (the newest 100, from one `GET /legendary-event-run-records` call), labeled with event, run and date. Run-record rosters SHALL be read-only: they can be compared, but not renamed or deleted, and they do not count toward usage. The to picker SHALL also offer Current, first, and SHALL list only sources newer than the from source.

#### Scenario: Compare with a run record

- **GIVEN** an Uthar run 2 record
- **WHEN** the user picks "Uthar · run 2 · Oct 12, 2026" as the from source
- **THEN** its roster is compared with Current

#### Scenario: An unplanned event's roster can be compared

- **GIVEN** a run record for an event the user has no plan for
- **WHEN** the user opens the from picker
- **THEN** that roster is listed under Legendary Events

### Requirement: Snapshot actions are reported as analytics events

Taking a snapshot (including whether it used the last-sync fallback), opening compare mode, selecting a summary metric, renaming and deleting SHALL each be reported as a declared analytics event (see `product-analytics`). Events SHALL NOT include snapshot names.

#### Scenario: Taking a snapshot is reported

- **WHEN** a user takes a snapshot from a fresh sync
- **THEN** one snapshot-taken event with `fromLastSync: false` is reported, without the name
