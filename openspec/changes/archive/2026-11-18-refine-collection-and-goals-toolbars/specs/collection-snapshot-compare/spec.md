## MODIFIED Requirements

### Requirement: Collection has a compare mode held in the URL

The Collection toolbar's Snapshots menu (`roster-snapshot-management`) SHALL offer a Compare with a snapshot toggle when the user is signed in and the catalog has loaded. Turning it on SHALL add `compare=latest` to the URL. Turning it off SHALL remove `compare` and `to`. `compare` SHALL hold `latest`, a personal snapshot id, or a Legendary Event run-record source `le:<eventId>:<recordId>`. `to` SHALL hold `current` (the default, omitted from the URL) or another source. `latest` SHALL resolve to the newest source by `takenAt` once the list has loaded.

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

For guests, the Snapshots menu SHALL be replaced by a "Sign in to save snapshots" prompt. A guest who opens a URL with `compare` or `to` SHALL see the same prompt, and the page SHALL NOT request snapshot sources.

#### Scenario: No snapshots yet

- **GIVEN** a signed-in user with no personal snapshots and no run records
- **WHEN** they turn Compare on
- **THEN** the empty state with Take snapshot is shown and no list is rendered

#### Scenario: Guest

- **WHEN** a guest opens Collection
- **THEN** no Snapshots menu is shown, and the sign-in prompt is shown

#### Scenario: Guest opens a compare URL

- **GIVEN** a guest
- **WHEN** they open Collection with `?compare=<id>&to=current`
- **THEN** the sign-in prompt is shown, no compare view renders, and no snapshot sources are requested

### Requirement: Compare mode has tour steps

The Collection tour SHALL gain one Snapshots step, targeting the Snapshots menu button and explaining taking a snapshot and comparing with one, and a step for the summary, with separate desktop and mobile targets. Step copy SHALL come from `tour.collection.steps.*` in every supported locale. The mobile Compare options step SHALL be included only while compare mode is on; otherwise it SHALL be left out.

#### Scenario: Mobile tour targets the options sheet trigger

- **GIVEN** a mobile viewport in compare mode
- **WHEN** the tour reaches the compare step
- **THEN** it targets the Compare options trigger

#### Scenario: Mobile tour outside compare mode

- **GIVEN** a mobile viewport with compare mode off
- **WHEN** the tour runs
- **THEN** it has no Compare options step
