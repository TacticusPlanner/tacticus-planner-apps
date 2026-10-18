## MODIFIED Requirements

### Requirement: Each lane tab has a Teams section with one card per team

A lane tab SHALL show a Teams section, between the lane overview and the synced progress grid, listing that lane's teams in their stored order as one card per team. A card SHALL show the team name, its members as unit portraits in position order with a count badge ("N/5") whenever fewer than five members, the reserve member marked as such when present, the covered objectives as chips (objective icon, label and points; a stored objective the current members no longer derive shows muted and does not count toward points), the team's points per battle, the team's **total power**, the clear depth (or a "Set depth" prompt when null), and an actions menu with Edit, Delete and, on mobile, Move up / Move down. The same team SHALL never be rendered more than once, whatever the number of objectives it covers. The section SHALL carry an explicit **Add team** button; no scroll, swipe or other gesture SHALL create or open a team.

#### Scenario: Teams render in order on a lane

- **GIVEN** Alpha has teams "Melee" (order 0) and "Flyers" (order 1) and Beta has one team
- **WHEN** the user opens the Alpha tab
- **THEN** the Teams section lists Melee then Flyers, each once, and nothing from Beta

#### Scenario: Partial team shows its count

- **GIVEN** a team with three members
- **WHEN** its card renders
- **THEN** three portraits and a "3/5" badge show, and the card is not styled as an error

#### Scenario: Points per battle on the card

- **GIVEN** Alpha's kill points are 30 and the team covers objectives worth 20 and 25
- **WHEN** its card renders
- **THEN** it shows 75 points per battle

The total power SHALL be the sum of the non-reserve members' power (the `character-combat-power` estimate at their synced state, items included), without horde-mode multipliers; a member the roster does not hold adds 0 and is covered by the card's "not counted" note. It SHALL be labelled "Team power" with locale digit grouping, and it SHALL update when the roster syncs or the members change. While the roster or the `unit-power` dataset is loading it SHALL show a placeholder dash. When the roster could not be read, or power data is unavailable for any owned member, it SHALL show "—" with an accessible reason rather than a partial sum. On mobile the total power SHALL sit on the same line as the points per battle.

#### Scenario: Total team power on the card

- **GIVEN** a team on Uthar Alpha of `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` and `ultraEliminatorSgt`, owned as in the `legendary-event-clear-estimates` worked example (21,675; 16,672; 21,883; 24,753; 13,912), with Tigurius in a horde-mode tier of 1.2
- **WHEN** its card renders
- **THEN** it shows "Team power 98,895": the plain sum, without the 1.2 multiplier the estimate uses

#### Scenario: Reserve and locked members

- **GIVEN** the same team where `ultraTitus` is not owned and one further unit is the reserve
- **WHEN** its card renders
- **THEN** it shows "Team power 77,012", and neither the reserve nor Titus is counted

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** a team card renders
- **THEN** Team power shows "—" with the reason "Power data unavailable" for screen readers, and the rest of the card is unchanged
