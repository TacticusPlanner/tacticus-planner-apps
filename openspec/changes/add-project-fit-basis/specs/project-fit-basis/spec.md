# project-fit-basis Specification

## ADDED Requirements

### Requirement: Scoped Goals offers a fit basis toggle

Goals scoped to a project SHALL offer a segmented control **Full plan** / **This project alone**, defaulting to Full plan. The choice SHALL be persisted per browser, SHALL be the same for every project scope, and SHALL survive navigation and reload. The unscoped Goals page SHALL NOT show it. On desktop it SHALL sit at the right of the deadline header, or of the scope bar for an untargeted project. On mobile it SHALL be a full-width control above the cards.

#### Scenario: Choice persists across projects

- **GIVEN** the user chose This project alone in project A's scope
- **WHEN** they open project B's scope and reload
- **THEN** This project alone is still selected

#### Scenario: Mobile placement

- **WHEN** a project scope renders below 768px
- **THEN** the control is a full-width two-segment control above the cards

### Requirement: This project alone estimates only the project's Active goals

With This project alone selected, the client SHALL estimate only the scoped project's Active goals, in their current relative order, with the same inventory, energy and settings as the full plan, as if no other goal existed. The run SHALL be computed only while this basis is selected. Paused, Blocked and unestimated goals stay ineligible.

- Assumption: the plan engine hands resources out in priority order, so these dates equal the dates after moving the project's goals to the top.

#### Scenario: Guild War season 29, worked example

- **GIVEN** the Guild War season 29 project (deadline 2026-11-27T09:00Z) where the full plan gives Ragnar Nov 26, Kharn Nov 27 and Calgar Dec 10
- **AND** the project-alone run gives Ragnar Nov 22, Kharn Nov 20 and Calgar Dec 1
- **WHEN** This project alone is selected
- **THEN** the completion instants are Nov 23, Nov 21 and Dec 2 at 00:00Z
- **AND** Ragnar and Kharn fit, and Calgar misses by ceil(4 d 15 h / 1 d) = 5, shown "Misses by 5 d"
- **AND** with the Reached Abaddon goal the header reads "2 of 4 fit" under Full plan and "3 of 4 fit" under This project alone

### Requirement: Project-alone dates are labelled in the list

With This project alone selected, the Done By cell of each estimated goal SHALL show the project-alone date with the hint "if prioritised", and in a targeted scope the fit labels, accents, header and divider SHALL follow those dates. While the run computes, the cells SHALL show their skeleton.

#### Scenario: Hint on the date

- **WHEN** This project alone is selected in the Guild War season 29 scope
- **THEN** Calgar's Done By cell reads "Dec 1 · if prioritised" with "Misses by 5 d"

### Requirement: Other surfaces always use the full plan

Project cards, the home widget, the unscoped Goals page, Dailies, Schedule and Insights SHALL always use the full plan, whatever the toggle says.

#### Scenario: Cards ignore the toggle

- **GIVEN** This project alone is selected
- **WHEN** the user opens the Projects page
- **THEN** the Guild War season 29 card still shows "2 of 4 fit"
