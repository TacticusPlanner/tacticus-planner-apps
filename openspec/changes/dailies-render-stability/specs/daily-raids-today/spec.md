# Spec Delta

## ADDED Requirements

### Requirement: Opening a raids page paints before the plan is calculated

Every page that shows daily raids (Dailies › Raids, HSE, HRE and Quests, Home's raids widget, Plan › Schedule) SHALL first render its loading state when it mounts, even when all of its data is already available, and SHALL calculate the plan in a lower-priority render right after that. The tap or click that opened the page SHALL be followed by a paint without waiting for the plan calculation.

#### Scenario: Opening Dailies with every dataset already loaded

- **GIVEN** the player's data and the game catalog are already loaded
- **WHEN** the player taps Dailies
- **THEN** the Raids page is painted in its loading state first, and Today's plan appears once it has been calculated

## MODIFIED Requirements

### Requirement: Today shows glance tiles

Today SHALL show its glance tiles above the card grid, as a labelled region ("Today at a glance"). Each tile SHALL show a short label and its value, and tiles SHALL be static text, not controls. In order:

1. **Daily energy used**: a progress bar and "used / daily" energy from "Today shows real daily energy usage". Once the daily energy limit is reached (the same test Bonus raids uses), the label SHALL read "Energy limit reached" and the bar and tile border SHALL switch to a distinct over-limit colour.
2. **Onslaught**: today's whole tokens to spend, from "Today lists today's Onslaught runs". It SHALL be hidden when no goal needs an Onslaught run today.
3. **Campaign event**: the status from "Today states the detected campaign event and its remaining time".

There SHALL be no tile for the plan's energy and raid totals: without the daily energy beside them they say nothing on their own.

The layout SHALL follow the width of Today's content (a container query), not the viewport:

- From 42rem: each tile is a card of its own with its label above its value. Tiles SHALL take at least 12rem each and wrap onto further rows when there is not room for all of them on one.
- Below 42rem (one dashboard track, as on a phone): the tiles SHALL fold into one card, one row per tile with its label at the start and its value at the end, rows split by dividers, so Today's plan starts as high as possible.

Tile values SHALL wrap rather than truncate. Tiles 1–2 SHALL render only once Today's raid data is ready; while it loads, a placeholder SHALL hold the Daily energy used tile's place, with its label and a loading value, so the tile does not push the tiles and cards below it down when it arrives. The Campaign event tile SHALL render regardless.

Worked example: daily energy 638, real spend today 663 energy, and two Onslaught runs planned at 1.2 and 0.5 runs. Tile 1 reads "Energy limit reached" with "663 / 638" and a full bar in the over-limit colour (663 ÷ 638 = 103.9%, so the bar's value text says 104%). Tile 2 shows 1.2 + 0.5 = 1.7, rounded up to "2 tokens". Below the limit, at a real spend of 410 energy, tile 1 reads "Daily energy used" with "410 / 638" and a bar 64% full; tile 2 still shows "2 tokens".

#### Scenario: Tiles in order

- **GIVEN** a goal needs an Onslaught run
- **WHEN** Today renders
- **THEN** the tiles read Daily energy used, Onslaught, Campaign event, in that order

#### Scenario: Over the limit

- **GIVEN** today's real energy spend has reached the daily energy limit
- **WHEN** Today renders
- **THEN** the first tile is labelled "Energy limit reached" with a full bar in the over-limit colour, and the Onslaught tile still follows it

#### Scenario: One dense card on a narrow page

- **GIVEN** Today's content is narrower than 42rem
- **WHEN** Today renders its glance tiles
- **THEN** they form one card of label / value rows split by dividers, not separate tiles

#### Scenario: Raids still loading

- **GIVEN** Today's raid data is still loading
- **WHEN** Today renders
- **THEN** a Daily energy used placeholder with a loading value holds the first tile's place, followed by the Campaign event tile, and no Onslaught tile is shown
