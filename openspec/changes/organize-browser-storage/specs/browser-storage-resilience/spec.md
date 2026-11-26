## MODIFIED Requirements

### Requirement: Persisted preferences use one storage path

Every value the app keeps in `localStorage` or `sessionStorage` SHALL go through the same guarded storage path, so a storage failure is handled identically everywhere, and every key SHALL be listed in one key registry; a key that is not registered SHALL NOT compile, and a lint rule SHALL reject direct `localStorage` and `sessionStorage` access outside the guarded path and tests. A preference changed in one place SHALL be observed by every mounted reader in the same page and in other open tabs, and a preference write that the browser refuses SHALL still apply for the rest of the visit. Two reads sit outside that path: the pre-paint theme script in the entry document reads the `theme` key inside its own try/catch and falls back to the system theme, as the guarded path does; and the UI language is persisted under `i18nextLng` by the i18next browser language detector, which probes storage availability itself.

#### Scenario: Preference changed in one component

- **WHEN** a preference persisted to storage is changed by one component
- **THEN** every other mounted reader of that preference reflects the new value without a reload

#### Scenario: Preference changed in another tab

- **GIVEN** the Teams page is open in two tabs
- **WHEN** the player switches the layout to Table in one tab
- **THEN** the other tab shows the Table layout without a reload

#### Scenario: Write refused

- **GIVEN** a browser whose storage refuses writes
- **WHEN** the player collapses the desktop menu
- **THEN** the menu stays collapsed until the page is left, and no error is shown

### Requirement: Orphaned preference keys are not read or written

The app SHALL NOT read or write storage keys belonging to removed features. At startup it SHALL delete the keys left by the removed Arena Dailies page, the removed project detail grouping, the expired beta promo code tile, and the device-wide redirect marker that moved to `sessionStorage`.

#### Scenario: Leftover key from a removed page

- **GIVEN** a device that still holds a stored Arena mode preference (`tp.dailies.arena.mode`)
- **WHEN** the app starts
- **THEN** the key is removed and has no effect

## ADDED Requirements

### Requirement: Storage keys follow one naming scheme

Every key the app writes SHALL start with `tp.`, except `theme` and `i18nextLng`, which are read before the app runs. Per-device preferences SHALL be grouped into one JSON record per feature under `tp.<feature>` (for example `tp.collection` holds the Collection page's sort, view, grouping, quick filter and compare fields). The signed-in account's own data SHALL use keys starting with `tp.user.` (see `redirect-authentication`). Keys SHALL NOT carry version suffixes: each field of a record SHALL be validated on read and fall back to its own default, so one unreadable field never resets the others. Data that would otherwise grow without bound SHALL be capped: the collapsed Goals sections keep the 200 most recent, and Legendary event token reports keep the 10 most recently written events.

#### Scenario: One unreadable field

- **GIVEN** a `tp.collection` record whose `view` is a value this build does not know and whose `sort` is `power`
- **WHEN** the Collection page opens
- **THEN** it uses the default view and sorts by power

### Requirement: Values under older key names move at startup

Before anything reads storage, every start SHALL move values kept under older key names to the current ones: each per-device preference key into its feature's record field, `tp.session.*` and older unprefixed account keys to their `tp.user.*` names, and the session keys `nav.lastVisitedChild` and `tp:stale-reload:*` to `tp.nav.lastVisitedChild` and `tp.staleReload.*`. A value already present under the current name SHALL win over the older one. The older key SHALL be removed once its value is stored under the new name. Running the move when there is nothing to move SHALL change nothing.

#### Scenario: Saved choices survive the rename

- **GIVEN** a device with `collection.view` = `table`, `teams.layout` = `table` and `guildWar.zone` = `Trenches1`
- **WHEN** the app starts
- **THEN** the Collection page shows the table view, Teams shows the table layout, Guild war attacks in Trenches1, and none of the three old keys remain

#### Scenario: An older tab writes an old key

- **GIVEN** the record `tp.collection` holds `view` = `cards`
- **AND** a tab still running the previous build writes `collection.sort` = `power`
- **WHEN** the app starts again
- **THEN** `tp.collection` holds `view` = `cards` and `sort` = `power`, and `collection.sort` is gone
