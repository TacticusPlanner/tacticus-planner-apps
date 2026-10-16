# legendary-event-filter-chips Specification

## Purpose

Defines how selected filter chips on the Legendary Event pages (master table, tier list and leaderboard controls) are shown so that a selected chip can be told from an unselected one in both the light and the dark theme, without relying on colour alone.

## Requirements

### Requirement: A selected filter chip is visibly different from an unselected one

On the master table, the tier list and the leaderboard controls, a selected chip SHALL differ from an unselected chip by a primary-coloured border at least 2px thick and a tinted fill, and its border colour SHALL have a contrast of at least 3:1 against the page background in the light and the dark theme. A selected chip SHALL also expose its state as pressed to assistive technology.

#### Scenario: Master table in the light theme

- **GIVEN** the light theme and the master table with In teams and Remaining selected
- **WHEN** the controls render
- **THEN** the In teams and Remaining chips show the thick primary border and tinted fill, and the unselected chips (All, Unlocked, the second All and Estimated) show the thin neutral border with no fill

#### Scenario: Tier list in the dark theme

- **GIVEN** the dark theme and the tier list with the Chaos chip selected
- **WHEN** the filter row renders
- **THEN** the Chaos chip is distinguishable from All, Imperial and Xenos by border and fill, and its state is exposed as pressed

#### Scenario: Selection does not depend on colour alone

- **WHEN** a chip is selected
- **THEN** its border weight differs from an unselected chip's, so a user who cannot tell the two colours apart still sees the difference
