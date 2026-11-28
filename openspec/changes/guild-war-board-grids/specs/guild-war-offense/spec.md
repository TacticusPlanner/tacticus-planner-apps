## ADDED Requirements

### Requirement: Map-pool board pictures show their battle grid

Wherever a map-pool board's picture shows (the map picker's tiles and the large viewer), it SHALL be cropped to the board's battle grid, with half a hex of margin, and SHALL draw every hex of the grid over the art, filling the attacker's deployment hexes of the map's spawn set blue, the defender's red and the blocked hexes dark. A hex above ground elevation SHALL be drawn higher, as the game's angled camera shows it. The large viewer SHALL show a legend naming the three fills. A map served without a board grid, or a board whose art size has no fitted placement, SHALL show the plain picture.

#### Scenario: A board as the deploy screen shows it

- **GIVEN** the season's map pool includes `EC1_09` with spawn set 2
- **WHEN** the player opens it in the large viewer
- **THEN** its picture is cropped to its 7 x 9 grid, five hexes are filled as the player's deployment and a legend explains the fills

#### Scenario: No board grid

- **GIVEN** a map served without a board grid
- **WHEN** the map picker shows it
- **THEN** it shows the board's plain picture
