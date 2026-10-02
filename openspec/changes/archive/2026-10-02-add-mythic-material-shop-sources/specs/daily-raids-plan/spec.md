## MODIFIED Requirements

### Requirement: Day cards list shop purchases after the raided materials

Every day card that has at least one projected shop purchase SHALL present them in a section labelled "Shops", placed after the "Raided" section (and after the actionable cells when there is no Raided section). Each purchase SHALL show the shop's localized name, the portrait of the unit the purchase serves, the expected number of purchases, what it buys — for a shard offer the expected shards, for a Mythic-material offer the material's art and localized name with the expected item count — and the currency icon with the currency spent. Purchases of the same offer for goals of different units SHALL be listed per unit (a unit's goals stay merged into one row), and together SHALL NOT exceed that offer's daily capacity (see `goal-farming-estimates`). A day with no shop purchase SHALL NOT render the section or its divider. The section SHALL appear on both desktop and mobile layouts and SHALL NOT make the day card exceed its fixed height; it scrolls with the card's grid like the other sections. A shop purchase SHALL NOT be shown as raids, SHALL NOT count toward the day's energy or raid totals, and SHALL NOT be dimmed or removed by the Raided rule.

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

#### Scenario: Mythic-material purchases

- **GIVEN** the Ragnar Rank goal from the `goal-farming-estimates` Venerable Battle Mark worked example, with reference date Monday 2026-10-05
- **WHEN** Schedule renders Day 2 (Tue)
- **THEN** its "Shops" section lists a Crusade purchase for Ragnar of 3 purchases, 3 Venerable Battle Mark, 1290 crusade currency, and a Guild purchase for Ragnar of 2 purchases, 2 Venerable Battle Mark, 1800 Guild Credits, each with the Venerable Battle Mark art

#### Scenario: Shared offer split across goals

- **GIVEN** the two-goal shared-capacity worked example in `goal-farming-estimates`
- **WHEN** Schedule renders Day 6 (Sat)
- **THEN** the "Shops" section lists the Guild offer twice — 0.25 Venerable Battle Mark for Ragnar and 0.25 for the Dreadnought — totalling its 0.5 daily expected capacity
