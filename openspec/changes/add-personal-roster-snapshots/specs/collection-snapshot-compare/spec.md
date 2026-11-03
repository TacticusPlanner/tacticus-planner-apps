## ADDED Requirements

### Requirement: Collection has a compare mode held in the URL

The Collection toolbar SHALL offer a Compare toggle when the user is signed in and the catalog and roster have loaded. Turning it on SHALL add `compare=latest` to the URL. Turning it off SHALL remove `compare` and `to`. `compare` SHALL hold `latest`, a personal snapshot id, or a Legendary Event run-record source `le:<eventId>:<recordId>`. `to` SHALL hold `current` (the default, omitted from the URL) or another source. `latest` SHALL resolve to the newest source by `takenAt` once the list has loaded.

The params follow Collection's URL rules (see `player-collection`): replace the history entry, omit defaults, and drop invalid values. An unknown or deleted source SHALL be dropped and fall back to `latest`. A `to` equal to or older than `compare` SHALL be dropped and fall back to `current`. Search, filters and quick filters SHALL keep applying in compare mode. The compare state SHALL NOT be remembered beyond the URL.

#### Scenario: Toggle defaults to latest vs Current

- **GIVEN** snapshots from 2026-10-01 and 2026-11-01
- **WHEN** the user turns Compare on
- **THEN** the URL gains `compare=latest`, and the 2026-11-01 snapshot is compared with the current roster

#### Scenario: Shared link

- **GIVEN** a URL with `compare=<id of 2026-10-01>&to=<id of 2026-11-01>` and the Xenos alliance filter
- **WHEN** the page loads
- **THEN** the two snapshots are compared over Xenos units only

#### Scenario: Deleted snapshot in the URL

- **GIVEN** a URL whose `compare` id no longer exists
- **WHEN** the page loads
- **THEN** `compare` becomes `latest`, without adding a history entry

### Requirement: Compare mode distinguishes its data states

In compare mode, the page SHALL show:

- while the source list or a source's roster is loading, a skeleton where the summary and list go;
- when either fails to load, an error with Retry;
- when no source exists, an empty state "Take your first snapshot" with the Take snapshot action, and no list;
- when sources exist but no listed unit changed, the summary at zero and "No changes for these units", with "Show unchanged" available.

For guests, the Compare toggle and Take snapshot button SHALL be replaced by a "Sign in to save snapshots" prompt.

#### Scenario: No snapshots yet

- **GIVEN** a signed-in user with no personal snapshots and no run records
- **WHEN** they turn Compare on
- **THEN** the empty state with Take snapshot is shown and no list is rendered

#### Scenario: Guest

- **WHEN** a guest opens Collection
- **THEN** no Compare toggle or Take snapshot button is shown, and the sign-in prompt is

### Requirement: The summary leads and filters the list

Compare mode SHALL show the summary (see `roster-snapshot-diff`) above the list, computed over the units that match the active search, filters and quick filter. While any of those is active, it SHALL say so (for example "for 24 matching units"). Each non-zero metric SHALL be selectable. Selecting one SHALL narrow the list to the units contributing to it, and selecting it again SHALL clear that. At most one metric SHALL be selected at a time. The selected metric SHALL NOT be held in the URL.

On desktop, the summary SHALL be a card above the list. On mobile, it SHALL be a single horizontally scrolling row of metric chips, and the page SHALL NOT scroll horizontally at 420px.

#### Scenario: Selecting rank-ups

- **GIVEN** a summary with 7 rank-ups across 4 units
- **WHEN** the user selects rank-ups
- **THEN** only those 4 units are listed, and selecting it again lists every changed unit

### Requirement: Compare mode lists changed units by power gain

Compare mode SHALL list the units owned in "to" that match the active search, filters, quick filter and selected metric, as one flat list without faction groups. Unchanged units SHALL be hidden unless "Show unchanged" is on; when it is on, they are shown dimmed after the changed ones. The default order SHALL be power gain descending, then localized name. The Sort control SHALL also offer Collection's sorts, evaluated on the "to" state. A Legendary Event filter SHALL narrow the list to the members and reserves of one event's plan teams, optionally a single lane (Alpha, Beta or Gamma).

#### Scenario: Default order

- **GIVEN** Calgar gained 4,650 power, Titus 1,200, and Tigurius is unchanged
- **WHEN** compare mode renders
- **THEN** Calgar is listed before Titus and Tigurius is not listed

#### Scenario: LE lane filter

- **GIVEN** an Uthar plan whose Alpha teams contain Calgar and Titus
- **WHEN** the user filters by Uthar, Alpha
- **THEN** only Calgar and Titus are listed

### Requirement: Diff tiles show change chips and full details

On desktop, each listed unit SHALL render as the Collection unit tile at its "to" state, with change chips for its changed fields (for example "+2★", "D1→D3", "+5 ability", "+260 shards", "+4.6k power"). Activating the tile SHALL open a popover listing every field before → after, including shards net, spent and earned. On mobile, each unit SHALL render as a row (portrait, name, chips), and activating it SHALL open the same details in a bottom sheet. In compare mode, activating a tile SHALL open the details, not the Library page; the details SHALL offer a link to the Library page.

#### Scenario: Desktop details

- **GIVEN** the Calgar worked example on desktop
- **WHEN** the user activates his tile
- **THEN** a popover lists rank, stars, XP level, active ability and shards (net −240, spent 500, earned +260), plus a link to his Library page

#### Scenario: Mobile row

- **GIVEN** a 420px viewport
- **WHEN** compare mode renders
- **THEN** each unit is one row with chips, and the page does not scroll horizontally

### Requirement: A fields setting chooses which changes are shown

Compare mode SHALL offer a fields multi-select: shards, mythic shards, XP, upgrades, abilities, equipment and power. All are on by default. It SHALL hide the matching chips and detail rows, and SHALL NOT change which units are listed or the summary. The choice SHALL be remembered on this device and SHALL NOT be in the URL. When storage is unavailable, it SHALL fall back to all on. On desktop, it sits in the toolbar. On mobile, it sits in a "Compare options" bottom sheet together with the from/to pickers.

#### Scenario: Hide equipment

- **WHEN** the user turns equipment off and reloads
- **THEN** no equipment chip or detail row is shown, and the listed units are unchanged

### Requirement: Compare mode has tour steps

The Collection tour SHALL gain steps for the Compare toggle, the summary and the Take snapshot button, with separate desktop and mobile targets. Step copy SHALL come from `tour.collection.steps.*` in every supported locale.

#### Scenario: Mobile tour targets the options sheet trigger

- **GIVEN** a mobile viewport in compare mode
- **WHEN** the tour reaches the compare step
- **THEN** it targets the Compare options trigger
