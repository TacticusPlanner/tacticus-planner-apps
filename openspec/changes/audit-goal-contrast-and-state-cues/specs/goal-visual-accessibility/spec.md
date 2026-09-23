## Purpose

Ensures goal state and progress remain distinguishable and readable in light and dark themes, including compact presentation and mobile cards.

## ADDED Requirements

### Requirement: Goal text and meaningful graphics meet contrast targets

On Goals Overview, Project Detail, and goal detail, normal text SHALL have at least 4.5:1 contrast against its actual background; large text SHALL have at least 3:1; and meaningful non-text component/state cues SHALL have at least 3:1 against adjacent colors, following WCAG 2.2 AA criteria 1.4.3 and 1.4.11. This SHALL hold in light and dark themes and in both Comfortable and Compact density where available.

#### Scenario: Dense light and dark goals

- **WHEN** a populated Goals view renders in either theme and density
- **THEN** labels, counts, badges, controls, progress fills/markers, and focus/state cues meet the applicable contrast target on their rendered backgrounds

### Requirement: Goal state is not communicated by color alone

Active, Paused, Blocked/Restricted, Reached, and Archived states SHALL be distinguishable by visible text or an identified icon in addition to color wherever they are displayed. Progress layers and restriction markers SHALL have an accessible explanation independent of hue.

#### Scenario: Color is unavailable

- **WHEN** a user views goal rows/cards without relying on hue differences
- **THEN** goal status and restriction remain identifiable from text or icon plus accessible name

#### Scenario: Mobile progress

- **WHEN** a mobile goal card shows Actual/Potential progress or a restriction marker
- **THEN** the meanings remain available by text or an operable explanation, not only by colored fills
