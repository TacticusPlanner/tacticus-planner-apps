# hre-mission-tracker Specification

## Purpose

Shows the running (or next) Hero Release Event on the Dailies HRE tab: its featured hero, its localized mission list and the player's own mission progress, which is kept in the browser per event instance.

## Requirements

### Requirement: The HRE tab shows the running or next Hero Release Event

The HRE tab SHALL show the calendar entry whose definition `type` is `NewCharacterEvent` and whose window contains now (UTC, `startUtc` inclusive, `endUtc` exclusive). If none is running, it SHALL show the next upcoming one as a labelled preview with a "starts in" countdown. If there is neither, it SHALL show an empty state. Several running entries SHALL resolve to the latest `startUtc`, then the lowest occurrence id.

#### Scenario: Running event

- **GIVEN** the Zapspitta occurrence 2026-10-18T00:00:00Z to 2026-11-01T00:00:00Z
- **WHEN** the time is 2026-10-18T20:00:00Z
- **THEN** the tab shows Zapspitta's HRE with "ends in 13d 4h", and no preview label

#### Scenario: Window end is exclusive

- **WHEN** the time is exactly 2026-11-01T00:00:00Z and no later HRE is in the calendar
- **THEN** the tab shows the empty state "No Hero Release Event is running or scheduled"

#### Scenario: Preview of the next event

- **GIVEN** no HRE is running and one starts on 2026-11-22
- **THEN** the tab shows that event, labelled as a preview with a "starts in" countdown, and its mission list is read-only

#### Scenario: Calendar loading and load failure

- **WHEN** the calendar is still loading
- **THEN** the tab shows a loading skeleton
- **WHEN** the calendar fails to load
- **THEN** the tab shows the shared load-error state with a retry action, not the empty state

### Requirement: The header names the featured hero and their alliance

The event header SHALL show the featured hero's icon and localized name, resolved from the occurrence's `featuredCharacterId`. It SHALL also show the hero's alliance (Imperial, Chaos or Xenos), the event window and the countdown. An id that does not resolve to a unit SHALL show the raw id as the name, with no icon and no alliance. Any mission text that needs the alliance SHALL then fall back to the generic wording "your alliance's units".

#### Scenario: Zapspitta

- **GIVEN** `featuredCharacterId` is Zapspitta's unit id
- **THEN** the header shows Zapspitta's icon, "Zapspitta" and "Xenos"

#### Scenario: Unresolved hero id

- **GIVEN** `featuredCharacterId` is "unknown-hero" and no unit has that id
- **THEN** the header shows "unknown-hero" without an icon, and mission 2 reads "Defeat 10 enemies with your alliance's units"

### Requirement: Every HRE uses the same mission list, worded for the featured hero's alliance

The tab SHALL show the one fixed list of 21 missions (1 to 20, then "Bonus"), each with its two objectives in the game's order (the Tacticus wiki's New Character Events page), for every HRE. Only the alliance-dependent objectives SHALL change, using the featured hero's alliance (for example "Defeat 10 enemies with Xenos units"), along with the featured-hero objectives of mission 20 and Bonus, which use the hero's name. The list SHALL be shipped with the app, not loaded from the catalog.

#### Scenario: Zapspitta mission 10

- **GIVEN** Zapspitta (Xenos)
- **THEN** mission 10 reads "Win 15 battles with an all-Xenos team", then "Play 4 Arena battles"

#### Scenario: Same list for an Imperial hero

- **GIVEN** an HRE whose featured hero is Imperial
- **THEN** mission 2 reads "Raid 5 campaign battles" and "Defeat 10 enemies with Imperial units", and mission 11 still reads "Defeat 100 units of the Necrons faction"

#### Scenario: Featured hero in mission 20

- **GIVEN** Zapspitta
- **THEN** mission 20 reads "Use abilities 10 times with Zapspitta", then "Win 250 campaign battles"

### Requirement: The player records their current mission and its progress

On a running event, the player SHALL be able to choose the current mission (1 to 20, or Bonus, which is mission 21; 22 stands for all missions done) and to enter a whole-number progress from 0 to the target for each of its two objectives. A progress of 0 SHALL show as an empty input with a "0" placeholder, so typing never adds to a leading 0. Each objective below its target SHALL offer a one-click "Mark done" that sets its progress to the target, and a "+1" button. Objectives with a target of 20 or more SHALL also offer "+10". Missions before the current one SHALL show as done. Later missions SHALL show as locked. Progress SHALL be clamped to the target, and an objective at its target SHALL show as complete. A "Mission complete" action, available once both objectives are at target, SHALL advance to the next mission with both progress values at 0. It SHALL then offer Undo for a few seconds, which restores the previous mission and its progress. Progress SHALL be kept per mission: choosing another mission SHALL keep the current mission's values, and choosing it again SHALL restore them. A mission never visited starts at 0 and 0. With no stored progress, the current mission SHALL be 1 with progress 0 and 0.

#### Scenario: Setting mission 5 progress

- **GIVEN** a running event with no stored progress
- **WHEN** the player picks mission 5 and enters 6,000 ability damage and 37 campaign wins
- **THEN** missions 1 to 4 show as done, mission 5 shows 6,000 / 10,000 and 37 / 100, and missions 6 to Bonus show as locked

#### Scenario: Typing into an empty objective

- **GIVEN** an objective at 0
- **WHEN** the player types 33
- **THEN** the input reads 33, not 033

#### Scenario: One-click objective

- **GIVEN** mission 5 at 37 / 100 campaign wins
- **WHEN** the player presses "Mark done" on that objective
- **THEN** it reads 100 / 100, shows as complete, and its "Mark done" disappears

#### Scenario: Steppers

- **GIVEN** mission 20 at 0 / 10 featured-hero ability uses and 70 / 250 campaign wins
- **WHEN** the player presses "+10" on the wins and "+1" on the ability uses
- **THEN** they read 80 / 250 and 1 / 10, and only the wins offer "+10"

#### Scenario: Clamping

- **WHEN** the player enters 140 for "Win 100 campaign battles"
- **THEN** the value is stored as 100 and the objective shows as complete

#### Scenario: Completing a mission

- **GIVEN** mission 5 has both objectives at target
- **WHEN** the player presses "Mission complete"
- **THEN** mission 6 becomes current with progress 0 and 0

#### Scenario: Undo a completion

- **GIVEN** the player pressed "Mission complete" on mission 5
- **WHEN** they press Undo
- **THEN** mission 5 is current again with both objectives at target

#### Scenario: Switching back to a mission

- **GIVEN** mission 20 at 0 / 10 and 70 / 250
- **WHEN** the player picks Bonus and then mission 20 again
- **THEN** mission 20 shows 0 / 10 and 70 / 250 again

#### Scenario: Last mission done

- **GIVEN** the Bonus mission has both objectives at target and the player presses "Mission complete"
- **THEN** every mission shows as done and the tab says "All missions complete"

#### Scenario: Preview is read-only

- **GIVEN** the tab previews an upcoming event
- **THEN** the mission picker and progress inputs are not shown

### Requirement: Mission progress persists per event instance in this browser

Mission progress SHALL be stored in the browser's local storage, keyed by the calendar occurrence id. That includes each mission's values, the points, rank, the time the rank was entered, the target, and the owned-state pace inputs. It SHALL survive a reload and SHALL NOT carry over to another HRE instance. It SHALL NOT be sent to the server or synced across devices. If storage is unavailable or holds invalid data, the tab SHALL work with in-memory progress that starts from the defaults, without showing an error. An invalid optional field SHALL be dropped alone, keeping the rest of the entry. An Undo offer SHALL NOT be stored.

#### Scenario: Reload keeps progress

- **GIVEN** the player set mission 5 with 37 campaign wins
- **WHEN** they reload the page
- **THEN** mission 5 and 37 are shown again

#### Scenario: New event starts fresh

- **GIVEN** stored progress for Sekhetar Robot's HRE
- **WHEN** Zapspitta's HRE is shown
- **THEN** it starts at mission 1 with progress 0 and 0

#### Scenario: Blocked storage

- **GIVEN** local storage throws on access
- **THEN** the tab still lets the player set progress for the session, with no error shown

#### Scenario: Entry stored before this change

- **GIVEN** a stored entry with mission 20, its progress, points and rank, and none of the new fields
- **THEN** it loads as before, with no owned inputs, no rank time, and the other missions at 0 and 0

### Requirement: Progress stored in the old objective order is migrated

Missions 7, 9, 10, 12, 13, 15, 17, 19, 20 and Bonus swapped their two objectives when the list moved to the game's order (2026-10). Progress stored before that SHALL be read with those missions' two values swapped, so each value stays with its objective, and progress SHALL be saved with a marker of the new order so it is not swapped again.

#### Scenario: Mission 7 stored in the old order

- **GIVEN** stored progress without the new-order marker for mission 7 at 2 Salvage Runs and 8 alliance ability uses (old order: Salvage Runs first)
- **THEN** the tab shows 8 / 20 alliance ability uses and 2 / 2 Salvage Runs

#### Scenario: Unchanged mission

- **GIVEN** stored progress without the marker for mission 16
- **THEN** its values are read as stored
