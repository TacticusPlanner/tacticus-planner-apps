# Spec Delta

## Purpose

How a player's synced Tacticus LRE progress maps onto an event's battles and restrictions, how points earned and maximum points are computed per battle and per track, and how the synced progress grid presents them on desktop and mobile.

## ADDED Requirements

### Requirement: Canonical track points model

For each track the system SHALL build one points model from the catalog: per battle `i` (0-based, in `battleIds` order) the battle's `battlePoints = battlesPoints[i]`, `defeatAllPoints = defeatAll[i]`, and the five restriction `points`. Per-battle maximum SHALL be `battlePoints` (kill score) + `battlePoints` (high score) + `defeatAllPoints` + Σ restriction points. Track maximum SHALL be the sum over battles. All summaries (track, event, hub, Home) SHALL derive from this one model; no second calculation path.

Assumptions:

- Kill score and high score each award up to `battlesPoints[i]` for battle `i`.
- Defeat-all awards `defeatAll[i]` once per battle.
- Each restriction awards its fixed `points` once per battle.

#### Scenario: Worked example, Lysander Alpha battle 1

- **GIVEN** `battlesPoints[0] = 32`, `defeatAll[0] = 32`, restriction points 75, 95, 80, 85, 40
- **WHEN** the battle maximum is computed
- **THEN** it is 32 + 32 + 32 + 375 = 471

#### Scenario: Worked example, Lysander Alpha track maximum

- **GIVEN** `battlesPoints` sums to 829 over 18 battles, `defeatAll` is 32 for battles 1–17 and 48 for battle 18, and restriction points sum to 375
- **WHEN** the track maximum is computed
- **THEN** it is 829 × 2 + (17 × 32 + 48) + 18 × 375 = 1,658 + 592 + 6,750 = 9,000

### Requirement: Synced lane data maps onto battles and restrictions

The synced `lre-progress` entry for the event SHALL be read per track from its `alpha` / `beta` / `gamma` lane. `encounters[i]` SHALL be battle `i`. In `objectivesCleared`, index 0 SHALL mean defeat-all and index `k` in 1..5 SHALL mean the restriction whose catalog `index` is `k − 1`. `encounterPoints` SHALL be the battle's points earned; `highScore` the battle's recorded high score. A battle with no encounter entry has nothing cleared and 0 points. A lane that is null SHALL be presented as "no progress in this track". Points earned per track SHALL be Σ `encounterPoints` over its encounters; per event Σ over tracks. A battle is "complete" when `objectivesCleared` has six entries.

Assumptions:

- The game's objective order per battle is defeat-all first, then the five restrictions in the catalog's `unitsRestrictions.index` order (V1 verified this against battle configs; the V2 chunk does not carry them, so the order is asserted by a manual check on a real synced account, see tasks).
- Lane ids 1, 2, 3 are Alpha, Beta, Gamma, already mapped server-side.

#### Scenario: Partially cleared battle

- **GIVEN** Lysander Alpha `encounters[0] = { objectivesCleared: [0, 2, 3], highScore: 31, encounterPoints: 238 }`
- **WHEN** the grid row for battle 1 renders
- **THEN** defeat-all, Suppressive Fire (index 1) and Flying (index 2) are marked cleared; Eviscerate, Min 5 hits and No Resilient are not; the row shows 238 points of 471 and high score 31; the battle is not complete

#### Scenario: Complete battle

- **GIVEN** `encounters[3] = { objectivesCleared: [0, 1, 2, 3, 4, 5], highScore: 37, encounterPoints: 486 }`
- **WHEN** the row for battle 4 renders
- **THEN** all six cells are cleared and the row is marked complete with 486 points

#### Scenario: Battles beyond the synced encounters

- **GIVEN** a lane with 7 encounter entries on an 18-battle track
- **WHEN** the grid renders
- **THEN** battles 8–18 show every cell not cleared and 0 points, and the track header reads the sum of the seven `encounterPoints` as points earned

#### Scenario: Null lane

- **GIVEN** the event's synced entry has `gamma: null`
- **WHEN** the Gamma grid renders
- **THEN** it shows the "no progress in this track" body and the track header shows 0 of the track maximum

#### Scenario: Event absent from the chunk

- **GIVEN** the synced `lre-progress` array has no entry for the event
- **WHEN** the progress section renders
- **THEN** every track shows the "no synced progress for this event yet" body with its maximum, and the section still renders the track headers

### Requirement: Synced progress grid presentation

Per track the section SHALL show a header with points earned of maximum (for example "3,410 / 9,000") and a progress bar, then a grid of battles (rows, battle 1 first) by six columns: defeat-all and the five restrictions in catalog order, each column headed by its icon and labelled with its per-battle points. Each cell is a cleared or not-cleared indicator (icon plus accessible text, never colour alone). Each row ends with the battle's points earned of its maximum and its high score when non-zero. A collapsed "how points work" disclosure sits under the header. The grid SHALL be read-only in this change.

#### Scenario: Track header totals

- **GIVEN** Lysander Alpha encounters sum to 3,410 points
- **WHEN** the section renders
- **THEN** the Alpha header shows "3,410 / 9,000" and a bar at about 38%

#### Scenario: Desktop grid

- **WHEN** the section renders at or above 768px
- **THEN** each track is a full grid with all 18 battle rows and six objective columns visible without horizontal page scroll, tracks stacked or side by side depending on width

#### Scenario: Mobile grid

- **WHEN** the section renders below 768px for the selected track
- **THEN** each battle is a compact row with the battle number, six indicator cells and the points earned, and the column icons appear once in a sticky header row

#### Scenario: Accessible cleared state

- **WHEN** a cell renders
- **THEN** it exposes "cleared" or "not cleared" text to assistive technology in addition to its icon
