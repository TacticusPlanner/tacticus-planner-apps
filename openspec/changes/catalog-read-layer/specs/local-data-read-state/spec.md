# Spec Delta

## Purpose

Defines how the app reads the game catalog and player data it keeps on the device: how often a dataset is read from local storage, when a read is refreshed after a sync, and how a slow or failing read is reported so a page never waits forever.

## ADDED Requirements

### Requirement: A dataset is read from local storage once per session

The app SHALL read each locally stored catalog dataset and player-data chunk from the device database at most once per browser session, however many components, rows or pages need it, and SHALL serve every later consumer from memory. Navigating between pages, remounting a page, or rendering more rows SHALL NOT issue another local read of a dataset already in memory.

#### Scenario: Goals page with many rows

- **GIVEN** a signed-in user with 50 goals opens the Goals page on a device whose catalog has synced
- **WHEN** the page and all its rows have rendered
- **THEN** each catalog dataset the page needs (characters, mows, upgrades, campaign battles, campaign definitions, ascension costs, unlock shard costs, ability costs) has been read from local storage exactly once

#### Scenario: Navigating between pages

- **GIVEN** the user has visited the Goals page and the characters dataset is in memory
- **WHEN** they navigate to a Dailies tab and back to Goals
- **THEN** no further local read of the characters dataset is issued and the pages render from the in-memory copy

#### Scenario: A dataset is loaded only when needed

- **GIVEN** the user opens the Home page
- **WHEN** the page renders
- **THEN** datasets no Home component needs (for example `unit-power`) are not read from local storage until a page that needs them is opened

### Requirement: Derived lookups come from the in-memory dataset

Lookups derived from a dataset (records by id, one event's battles, the events active at a time) SHALL be computed from the in-memory copy and SHALL be referentially stable while the underlying dataset is unchanged, so consumers can memoise on them. A derived lookup SHALL NOT cause an additional local read.

#### Scenario: One event's battles

- **WHEN** the event page asks for the battles of one legendary event
- **THEN** the result is derived from the in-memory `lre-battles` dataset without a further local read, and asking again for the same event returns the same value until that dataset is refreshed

#### Scenario: Unit name resolution is stable

- **GIVEN** a component resolves unit display names
- **WHEN** it re-renders without the characters or mows datasets having changed
- **THEN** the name resolver it receives is the same value as before, so effects keyed on it do not re-run

### Requirement: A sync refreshes only the datasets it replaced

When a catalog or player-data sync completes, the app SHALL refresh the in-memory copy of exactly the datasets that sync downloaded and SHALL leave the others untouched. Components showing a refreshed dataset SHALL update without a page reload. A sync that downloaded nothing SHALL NOT trigger any re-read.

#### Scenario: Hourly player-data sync replaces the roster

- **GIVEN** the Collection page is open and the roster chunk is in memory
- **WHEN** the background player-data sync downloads a new roster chunk and no other chunk
- **THEN** the Collection tiles update to the new roster and no catalog dataset is re-read

#### Scenario: Manifest unchanged

- **WHEN** a catalog sync finds every dataset hash unchanged
- **THEN** no in-memory dataset is refreshed and no local read is issued

### Requirement: Other open tabs refresh after a sync

When one tab of the app completes a sync that downloaded datasets, every other open tab of the app on the same device SHALL refresh its in-memory copy of those datasets the next time they are shown, without the user reloading.

#### Scenario: Two tabs, one syncs

- **GIVEN** the app is open in two tabs on the same device
- **WHEN** the first tab's catalog sync downloads the `characters` dataset
- **THEN** the second tab's components showing characters update to the new dataset without a reload, and datasets the first tab did not download are not re-read in the second tab

### Requirement: A local read settles or fails within a bounded time

A local read that has not produced a result within 15 seconds SHALL be reported as failed. A page SHALL NOT remain in its loading state indefinitely because a local read never settled.

#### Scenario: Device database stops answering

- **GIVEN** the device's local database accepts a read request but never answers it
- **WHEN** 15 seconds have passed since the read was issued
- **THEN** the read is reported as failed and the page shows its failure presentation instead of its loading presentation

#### Scenario: Slow but successful read

- **GIVEN** a local read answers after 4 seconds
- **WHEN** the result arrives
- **THEN** the page leaves its loading state and renders the data; no failure is reported

### Requirement: A failed local read offers a retry that re-issues the read

Every failed local read SHALL expose a retry. Retrying SHALL re-issue the read from local storage; while the retry is in flight the page SHALL show its loading presentation, and when it succeeds the page SHALL render normally. A failure of one dataset SHALL NOT prevent other datasets from being read.

#### Scenario: Retry after a timeout succeeds

- **GIVEN** a page shows its failure presentation after a local read timed out
- **WHEN** the user activates Retry and the re-issued read answers
- **THEN** the page shows its loading presentation during the retry and then renders the data

#### Scenario: One dataset fails, others load

- **GIVEN** a page needs three datasets and one of them fails to read
- **WHEN** the other two succeed
- **THEN** the two successful datasets are held in memory, and a retry only re-issues the failed read

### Requirement: The failure copy is localized

The copy shown for a failed local read (the message and the Retry action) SHALL be provided in every supported language.

#### Scenario: German user sees a failed read

- **GIVEN** the app language is German
- **WHEN** a local read fails
- **THEN** the failure message and the Retry action are shown in German

### Requirement: Catalog datasets and player-data chunks download with bounded concurrency

A catalog or player-data sync SHALL download the changed datasets or chunks with at most 4 downloads in flight at once, SHALL still report per-item progress, and SHALL keep the existing failure behavior: one failed item does not abort the others, the failure is reported after every item settled, and the manifest metadata is not advanced while any item failed.

#### Scenario: Ten changed datasets

- **GIVEN** a manifest with 10 changed datasets
- **WHEN** the catalog sync runs
- **THEN** at most 4 dataset requests are in flight at any moment, all 10 are stored, and the progress callback reports 10 of 10 at the end

#### Scenario: One chunk fails

- **GIVEN** a player-data sync with 6 changed chunks of which one fails
- **WHEN** the sync runs
- **THEN** the other 5 chunks are stored, the sync rejects once after all 6 settled naming the failed chunk, and the manifest metadata is not written
