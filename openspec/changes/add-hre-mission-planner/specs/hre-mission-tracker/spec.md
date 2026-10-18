# Spec Delta

## Purpose

Shows the running (or next) Hero Release Event on the Dailies HRE tab: its featured hero, its localized mission list and the player's own mission progress, which is kept in the browser per event instance.

## ADDED Requirements

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

### Requirement: The mission list comes from the catalog, worded for the event

The tab SHALL list the event's missions from the catalog. It SHALL use the occurrence's own list when the catalog has one, and the default template otherwise. Each mission SHALL show its number (1 to 20, then "Bonus") and its two objectives. Each objective SHALL be rendered from its kind, target count and optional qualifier (alliance, faction, damage type or featured hero) in the active locale. An objective kind the app does not know SHALL render as "Unknown objective" with its target, and SHALL NOT break the list.

#### Scenario: Zapspitta mission 10

- **GIVEN** Zapspitta's list, where mission 10 is `arenaBattles` 4 and `winWithAllianceLineup` 15 with the alliance Xenos
- **THEN** mission 10 reads "Play 4 Arena battles" and "Win 15 battles with an all-Xenos team"

#### Scenario: Default template used when no per-occurrence list exists

- **GIVEN** an occurrence without its own list
- **THEN** the 21 default missions are shown, with the featured hero's alliance and name substituted

#### Scenario: Event with no mission data

- **GIVEN** the catalog has neither a default template nor an occurrence list
- **THEN** the header still shows, and the mission area says "Mission list not available for this event yet"

### Requirement: The player records their current mission and its progress

On a running event, the player SHALL be able to choose the current mission (1 to 20, or Bonus) and to enter a whole-number progress from 0 to the target for each of its two objectives. Missions before the current one SHALL show as done. Later missions SHALL show as locked. Progress SHALL be clamped to the target, and an objective at its target SHALL show as complete. A "Mission complete" action, available once both objectives are at target, SHALL advance to the next mission with both progress values at 0. With no stored progress, the current mission SHALL be 1 with progress 0 and 0.

#### Scenario: Setting mission 5 progress

- **GIVEN** a running event with no stored progress
- **WHEN** the player picks mission 5 and enters 6,000 ability damage and 37 campaign wins
- **THEN** missions 1 to 4 show as done, mission 5 shows 6,000 / 10,000 and 37 / 100, and missions 6 to Bonus show as locked

#### Scenario: Clamping

- **WHEN** the player enters 140 for "Win 100 campaign battles"
- **THEN** the value is stored as 100 and the objective shows as complete

#### Scenario: Completing a mission

- **GIVEN** mission 5 has both objectives at target
- **WHEN** the player presses "Mission complete"
- **THEN** mission 6 becomes current with progress 0 and 0

#### Scenario: Last mission done

- **GIVEN** the Bonus mission has both objectives at target and the player presses "Mission complete"
- **THEN** every mission shows as done and the tab says "All missions complete"

#### Scenario: Preview is read-only

- **GIVEN** the tab previews an upcoming event
- **THEN** the mission picker and progress inputs are not shown

### Requirement: Mission progress persists per event instance in this browser

Mission progress SHALL be stored in the browser's local storage, keyed by the calendar occurrence id. It SHALL survive a reload and SHALL NOT carry over to another HRE instance. It SHALL NOT be sent to the server or synced across devices. If storage is unavailable or holds invalid data, the tab SHALL work with in-memory progress that starts from the defaults, without showing an error.

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
