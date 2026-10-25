## MODIFIED Requirements

### Requirement: The player records their current mission and its progress

On a running event, the player SHALL be able to choose the current mission (1 to 20, or Bonus) and to enter a whole-number progress from 0 to the target for each of its two objectives. A progress of 0 SHALL show as an empty input with a "0" placeholder, so typing never adds to a leading 0. Each objective below its target SHALL offer a one-click "Mark done" that sets its progress to the target, and a "+1" button. Objectives with a target of 20 or more SHALL also offer "+10". Missions before the current one SHALL show as done. Later missions SHALL show as locked. Progress SHALL be clamped to the target, and an objective at its target SHALL show as complete. A "Mission complete" action, available once both objectives are at target, SHALL advance to the next mission with both progress values at 0. It SHALL then offer Undo for a few seconds, which restores the previous mission and its progress. Progress SHALL be kept per mission: choosing another mission SHALL keep the current mission's values, and choosing it again SHALL restore them. A mission never visited starts at 0 and 0. With no stored progress, the current mission SHALL be 1 with progress 0 and 0.

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

#### Scenario: Peeking at another mission

- **GIVEN** mission 20 at 0 / 10 and 70 / 250
- **WHEN** the player picks mission 21 and then mission 20 again
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
