## MODIFIED Requirements

### Requirement: Pause and resume are primary row actions

Every goal row that has not reached its target SHALL show a pause/resume control directly in its Actions area, visible without opening the "⋯" menu: an Active goal SHALL show a control that pauses it, and a Paused goal SHALL show a control that resumes it. A Completed or Archived goal SHALL show neither, since neither status accepts a pause/resume transition. A goal whose computed attainment is Reached SHALL show neither control, whatever its stored status; its stored status is not changed by being Reached.

#### Scenario: An Active goal shows a pause control

- **GIVEN** a goal has status `Active` and has not reached its target
- **WHEN** its row renders
- **THEN** the Actions area shows a visible pause control, reachable without opening the "⋯" menu

#### Scenario: A Paused goal shows a resume control

- **GIVEN** a goal has status `Paused` and has not reached its target
- **WHEN** its row renders
- **THEN** the Actions area shows a visible resume control, reachable without opening the "⋯" menu

#### Scenario: A Completed or Archived goal shows neither control

- **GIVEN** a goal has status `Completed` or `Archived`
- **WHEN** its row renders
- **THEN** the Actions area shows no pause or resume control

#### Scenario: A Reached goal shows neither control

- **GIVEN** a goal has status `Active` or `Paused` and its computed attainment is Reached
- **WHEN** its row or card renders on the Goals page or a project detail route, on desktop or mobile
- **THEN** the Actions area shows no pause or resume control, and the goal's stored status is unchanged

## REMOVED Requirements

### Requirement: Archive is available only once a goal has reached its target

**Reason**: Archiving is removed from the product. A Reached goal is now shown in place as a completed row (`goal-list-layout`), so there is nothing to archive it away for, and the status filter no longer has an Archived option.

**Migration**: Goals already stored with status `Archived` are left as they are in the backend and are simply not offered any archive or unarchive action; no data is rewritten.
