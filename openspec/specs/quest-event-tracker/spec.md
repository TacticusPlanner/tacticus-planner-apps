# quest-event-tracker Specification

## Purpose

Shows the running (or claimable, or next) Quest Event on the Dailies Quest tab: its featured hero, its 17 battles by tier and the player's own best score per battle, kept in the browser per occurrence, with the points total and the crates it opens.

## Requirements

### Requirement: The Quest tab shows the running, claimable or next quest

The tab SHALL select a calendar occurrence whose definition `type` is `Quest`, in this order (UTC, `startUtc` inclusive, `endUtc` exclusive):

1. **Running**: now is inside the window.
2. **Claim window**: now is at or after `endUtc` and before `endUtc` plus the definition's `rewardsClaimWindowHours`.
3. **Preview**: the next upcoming occurrence, labelled as a preview with a "starts in" countdown.

With none of these, it SHALL show the empty state "No Quest Event is running or scheduled" and still offer the quest picker. Several candidates at one step SHALL resolve to the latest `startUtc`, then the lowest occurrence id.

#### Scenario: Nubari running

- **GIVEN** the occurrence `occ-2026-10-21-quest-nubari-vs-black-legion`, 2026-10-21T00:00Z to 2026-10-24T00:00Z
- **WHEN** the time is 2026-10-23T18:00Z
- **THEN** the tab shows Nubari's quest with "ends in 6h", and no preview label

#### Scenario: Claim window

- **WHEN** the time is 2026-10-24T10:00Z
- **THEN** the tab still shows Nubari's quest, with the warning "Battles are closed. Claim your rewards: 14h left"

#### Scenario: Preview

- **WHEN** the time is 2026-10-25T00:00Z
- **THEN** the tab shows Kîmm's quest (2026-11-11) labelled as a preview with "starts in 17d", and the tracker is read-only

#### Scenario: Calendar loading and failure

- **WHEN** the calendar is loading
- **THEN** the tab shows a skeleton
- **WHEN** the calendar fails to load
- **THEN** the tab shows the shared load-error state with Retry, not the empty state

### Requirement: The occurrence's battles come from the catalog by featured hero

The tab SHALL read the `quest-events` record whose `featuredCharacterId` equals the occurrence's `featuredCharacterId`. When the dataset is loading the battle list SHALL show a skeleton; when it fails, an error with Retry; when no record matches, the header SHALL still render and the battle area SHALL say "No battle data for this quest yet".

#### Scenario: Older quest without data

- **GIVEN** an occurrence for Sekhetar Robot (`thousSekhetar`) is selected and `quest-events` has no `thousSekhetar` record
- **THEN** the header shows Sekhetar Robot, and the battle area says "No battle data for this quest yet"

### Requirement: A picker browses every quest in the catalog

The tab SHALL offer a quest picker listing every `quest-events` record by its featured hero's portrait and localized name, defaulting to the selected occurrence's hero. Picking another hero SHALL show that quest's battles and battle details read-only: no countdown, no score inputs, no points summary, and a "Back to the current quest" action. The pick SHALL NOT persist across reloads.

#### Scenario: Browse Cyrus during Nubari

- **GIVEN** Nubari is running
- **WHEN** the player picks Cyrus
- **THEN** Cyrus's 17 battles show without score inputs, and "Back to the current quest" returns to Nubari

### Requirement: The header names the featured hero and the lineup rules

The header SHALL show the featured hero's portrait and localized name, whether the player owns them and their current shards (from synced player data), the allowed factions, the enemy factions, the event window and the countdown. It SHALL state that the featured hero must be deployed in every battle and plays at the tier's rarity cap with +20% health, armour and damage. An unresolved hero id SHALL show the raw id with no portrait.

#### Scenario: Nubari not owned

- **GIVEN** the player does not own `astarEradicator` and has 12 of its shards
- **THEN** the header shows Nubari, "Not owned · 12 shards", allowed factions Adeptus Astartes, Ultramarines, Sisterhood and Blood Angels, and enemy faction Black Legion

### Requirement: Battles are listed by tier in play order

The battle list SHALL group the 17 battles under their tier (Common, Uncommon, Rare, Epic, Legendary, Mythic, in that order), each battle in `number` order. Each row SHALL show the battle number, the deploy slots, the objective chips (see `quest-event-battle-detail`), the drop's material icon, the battle's points and its maximum, and a "perfect" mark when they are equal. Each tier heading SHALL show the tier's points and maximum.

#### Scenario: Nubari Common tier

- **GIVEN** no score entered
- **THEN** the Common heading shows "0 / 1,600" and battle 1's row shows "0 / 600" with 3 slots and two objective chips

### Requirement: The player records the best attempt per battle

For a running occurrence, or one in its claim window, each battle SHALL accept the player's best attempt:

- **medals**: 0, 1, 2 or 3;
- **Lightning Victory**: points from 0 to 100, with a "Full HP" shortcut that sets 100 (the game awards 1 to 100 by HP left);
- one tick per objective, each worth its served `score`.

With 0 medals the battle counts as not won: the Lightning Victory entry and the objective ticks SHALL be disabled and SHALL count 0, and stay stored. A battle's **points** SHALL be 100 × medals + the Lightning Victory points + the ticked objective scores. Its **maximum** SHALL be 300 + 100 + the sum of its objective scores. Inputs SHALL be read-only in a preview.

Assumptions:

- A won battle earns at least 1 medal.
- Only the best attempt counts in the game, so the player enters that one.

#### Scenario: Nubari battle 1

- **GIVEN** battle 1 has `NoDamageTakenByAnyHero` and `UseNoSummons`, each worth 100
- **WHEN** the player sets 3 medals, full HP and ticks `UseNoSummons` only
- **THEN** the battle shows "500 / 600"

#### Scenario: Partial Lightning Victory

- **GIVEN** Nubari battle 8 (Rare 2, one objective)
- **WHEN** the player sets 3 medals, Lightning Victory 99 and ticks the objective
- **THEN** the battle shows "499 / 500", as the game does

#### Scenario: Not won

- **GIVEN** battle 1 at 500 as above
- **WHEN** the player sets 0 medals
- **THEN** the battle shows "0 / 600", the Lightning Victory entry and ticks are disabled, and setting 3 medals again restores 500

### Requirement: Progress is stored per occurrence in local storage

Entries SHALL be stored under `tp.dailies.quest.progress.v1` as `{ [occurrenceId]: { battles: { [number]: { medals, lightning: number, objectives: boolean[] } } } }`, read and written in guarded `try` blocks. Invalid entries SHALL be dropped on read, medals clamped to 0 to 3 and `lightning` to 0 to 100, and an `objectives` array whose length differs from the battle's objectives SHALL be padded with `false` or cut. A storage failure SHALL keep the in-memory entries for the session and show "Progress can't be saved in this browser". Entries are not keyed by account and are not synced.

#### Scenario: Reload

- **GIVEN** battle 1 at 500
- **WHEN** the page reloads
- **THEN** battle 1 still shows 500

#### Scenario: A new quest starts clean

- **GIVEN** Nubari entries are stored
- **WHEN** Kîmm's quest runs
- **THEN** every Kîmm battle starts at 0, and the Nubari entries are kept

### Requirement: The summary shows points, crates and where points are left

The tab SHALL show a summary with:

- the **total**: the sum of battle points, against the quest's maximum (8,800 for every current quest);
- **crates opened**: the number of `quest-crates` records whose `points` the total reaches, out of 17, and the points to the next crate (none when all 17 are open);
- **points left**: the battles below their maximum, sorted by points left descending, then by number, each with its points left. Selecting one selects that battle.

When `quest-crates` is loading or failed, the crate line SHALL show a dash and the rest SHALL still render.

#### Scenario: Next crate

- **GIVEN** crate 5 needs 2,000 and crate 6 needs 2,500, and the total is 2,300
- **THEN** the summary shows "2,300 / 8,800", "5 of 17 crates" and "200 points to crate 6"

#### Scenario: Everything perfect

- **GIVEN** every battle is at its maximum
- **THEN** the summary shows "8,800 / 8,800", "17 of 17 crates", and no points-left list

### Requirement: Desktop and mobile layouts

On desktop (768px and up) the header SHALL sit above two columns: the summary and the battle list on the left, and the selected battle's detail on the right, with battle 1 selected by default (or the first battle in the points-left list once any score is entered). On mobile the page SHALL be one column: header, summary, then the tier groups as disclosures with the first tier that is not perfect open; selecting a battle SHALL open its detail in a bottom sheet with the score inputs at the top.

#### Scenario: Mobile score entry

- **GIVEN** a 420px viewport
- **WHEN** the player taps battle 4
- **THEN** a bottom sheet opens with battle 4's medals, Lightning Victory and ticks above its detail

### Requirement: Quest tab copy and tour

All Quest tab copy SHALL be localized in en, de, es and fr in a new `quest` namespace. The tab SHALL have a tour (`quest-page.tutorial.tsx`, registered through `useTourPageSteps`) with steps for the header, a battle's score inputs, the summary and the battle detail, with mobile steps pointing at the tier disclosure and the bottom sheet.

#### Scenario: Tour on mobile

- **WHEN** the tour runs at 420px
- **THEN** every step targets a rendered element
