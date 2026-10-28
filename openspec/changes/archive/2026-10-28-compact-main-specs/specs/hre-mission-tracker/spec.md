## MODIFIED Requirements

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

#### Scenario: Entry without the optional fields

- **GIVEN** a stored entry with mission 20, its progress, points and rank, and no owned inputs, rank time or target
- **THEN** it loads with no owned inputs, no rank time, and the other missions at 0 and 0
