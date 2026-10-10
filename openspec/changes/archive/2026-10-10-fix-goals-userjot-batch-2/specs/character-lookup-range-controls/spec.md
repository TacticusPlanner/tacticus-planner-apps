## ADDED Requirements

### Requirement: A range edit that stays valid keeps the other side

When the user moves only the start or only the end of the rank range and the result still has the start strictly below the end, the side the user did not move SHALL keep its current value. The other side SHALL auto-advance or auto-retreat only when the moved side reaches or crosses it. This SHALL behave the same on the desktop slider and the mobile selects.

#### Scenario: Widening the range by raising the end

- **GIVEN** a rank range from Iron 1 to Iron 2
- **WHEN** the user moves the end to Bronze 1
- **THEN** the range is Iron 1 to Bronze 1

#### Scenario: Raising the start while it stays below the end

- **GIVEN** a rank range from Stone 1 to Gold 1
- **WHEN** the user moves the start to Iron 1
- **THEN** the range is Iron 1 to Gold 1

#### Scenario: Lowering the end while it stays above the start

- **GIVEN** a rank range from Iron 1 to Gold 1
- **WHEN** the user moves the end to Bronze 2
- **THEN** the range is Iron 1 to Bronze 2
