## ADDED Requirements

### Requirement: Day cards list shop purchases after the raided materials

Every day card that has at least one projected shop purchase SHALL present them in a section labelled "Shops", placed after the "Raided" section (and after the actionable cells when there is no Raided section). Each purchase SHALL show the shop's localized name, the unit's portrait, the expected number of purchases, the expected shards, and the currency icon with the currency spent. A day with no shop purchase SHALL NOT render the section or its divider. The section SHALL appear on both desktop and mobile layouts and SHALL NOT make the day card exceed its fixed height; it scrolls with the card's grid like the other sections. A shop purchase SHALL NOT be shown as raids, SHALL NOT count toward the day's energy or raid totals, and SHALL NOT be dimmed or removed by the Raided rule.

#### Scenario: Shops section follows Raided

- **GIVEN** Day 3 has an actionable cell, a Raided cell and a projected war-shop purchase for Kharn
- **WHEN** Schedule renders
- **THEN** Day 3 shows the actionable cell, then the "Raided" divider and cell, then a "Shops" divider listing the war-shop purchase for Kharn

#### Scenario: Day without purchases

- **GIVEN** Day 4 has no projected shop purchase
- **WHEN** Schedule renders
- **THEN** Day 4 shows no "Shops" divider

#### Scenario: Shop-only goal

- **GIVEN** the only in-scope goal is an Unlock goal for a shop-only unit
- **WHEN** Schedule renders
- **THEN** its day cards show only a "Shops" section, with no actionable or Raided cells

### Requirement: Day cards list Onslaught runs after the shop purchases

Every day card that has at least one projected Onslaught run SHALL present them in a section labelled "Onslaught", placed after the "Shops" section (and after the Raided or actionable cells when there is no Shops section). Each entry SHALL show the unit's portrait, the expected number of runs and the expected shards. A day with no Onslaught run SHALL NOT render the section or its divider. The section SHALL appear on both desktop and mobile layouts, scroll with the card's grid within its fixed height, and be dimmed by the character filter like any other entry. Onslaught runs SHALL NOT be shown as raids and SHALL NOT count toward the day's energy or raid totals.

#### Scenario: Onslaught follows Shops

- **GIVEN** Day 2 has a projected war-shop purchase and a projected Onslaught run for Kharn's Ascension goal
- **WHEN** Schedule renders
- **THEN** Day 2 shows the "Shops" divider and purchase, then the "Onslaught" divider and run

#### Scenario: Day without Onslaught runs

- **GIVEN** Day 5 has no projected Onslaught run
- **WHEN** Schedule renders
- **THEN** Day 5 shows no "Onslaught" divider

#### Scenario: Onslaught-only goal

- **GIVEN** the only in-scope goal is an Ascension goal whose only selected source is Onslaught
- **WHEN** Schedule renders
- **THEN** its day cards show only an "Onslaught" section, with no raid cells

## MODIFIED Requirements

### Requirement: Character filter bar highlights a unit across days

Above the day strip, Raids Plan SHALL show a bar of the distinct unit portraits that have at least one actionable cell, projected shop purchase or projected Onslaught run anywhere in the full plan (including days not yet revealed), in goal-priority order. A unit with a shop purchase or an Onslaught run on a day SHALL also appear among that day card's unit portraits. Selecting a portrait SHALL mark it selected, dim every cell, shop purchase and Onslaught run on every day card that does not serve that unit, and show controls to jump to that unit's first and last scheduled day (a single control when both are the same day), where a scheduled day is one with an actionable cell, a shop purchase or an Onslaught run for that unit. Selecting the selected portrait again SHALL clear the filter. Each portrait SHALL be a toggle button with the unit's localized name as its accessible name and a pressed state.

#### Scenario: Selecting a unit dims unrelated cells

- **GIVEN** Calgar and Tigurius both have cells in the plan
- **WHEN** the user selects Calgar in the filter bar
- **THEN** on every day card, cells not serving Calgar are dimmed and cells serving Calgar are not
- **AND** selecting Calgar again restores every cell

#### Scenario: A shop-only unit is in the filter bar

- **GIVEN** Kharn's only scheduled work is war-shop purchases and Calgar has raid cells
- **WHEN** Schedule renders
- **THEN** the filter bar shows both portraits
- **AND** selecting Kharn dims Calgar's cells and every shop purchase not for Kharn, and offers jumps to Kharn's first and last shop day

#### Scenario: An Onslaught-only unit is in the filter bar

- **GIVEN** Kharn's only scheduled work is Onslaught runs
- **WHEN** Schedule renders and the user selects Kharn
- **THEN** every other unit's cells, purchases and runs are dimmed and jumps to Kharn's first and last Onslaught day are offered

#### Scenario: Jump to a unit's last day beyond the revealed days

- **GIVEN** only three days are revealed and Tigurius's last scheduled day is Day 9
- **WHEN** the user selects Tigurius and activates the "Day 9" jump
- **THEN** all days are revealed and the strip scrolls so that Day 9's card is in view

#### Scenario: Jumps on mobile

- **GIVEN** Raids Plan is viewed below the 768px breakpoint
- **WHEN** the user selects a unit and activates its first-day jump
- **THEN** the strip scrolls so that day's card is in view, and the filter bar wraps without horizontal page overflow

#### Scenario: No filter bar without scheduled units

- **GIVEN** the plan has no actionable cells, shop purchases or Onslaught runs on any day
- **WHEN** Raids Plan renders
- **THEN** no filter bar is shown
