## ADDED Requirements

### Requirement: An open client re-checks the catalog when it returns to view

When the tab becomes visible and the last sync that left a usable catalog (ready or stale) is over an hour old, the client SHALL re-check the catalog in the background, without blocking the app or showing the initialization overlay. It SHALL NOT re-check while hidden, before a usable catalog exists, or again within the hour after a re-check starts; a failed re-check SHALL keep the cached catalog.

#### Scenario: Tab returns after more than an hour

- **GIVEN** the catalog last synced at 08:00 and the tab was hidden
- **WHEN** the tab becomes visible at 09:00:01
- **THEN** the catalog is re-checked in the background, and newly downloaded event data is shown by open pages

#### Scenario: Recent sync

- **WHEN** the tab becomes visible less than an hour after the last sync
- **THEN** no re-check runs

#### Scenario: Re-check fails

- **WHEN** a background re-check fails
- **THEN** the app keeps using the cached catalog and its catalog status is unchanged

#### Scenario: Initial sync failed without a cache

- **GIVEN** the initial sync failed and no usable cache exists, so the initialization error is shown
- **WHEN** the tab becomes visible later
- **THEN** no background re-check runs; the user retries from the error state
