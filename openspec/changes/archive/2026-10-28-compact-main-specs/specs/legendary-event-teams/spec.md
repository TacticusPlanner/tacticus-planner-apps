## MODIFIED Requirements

### Requirement: Each lane tab has a Teams section with one card per team

A lane tab SHALL show a Teams section, between the lane overview and the synced progress grid, listing that lane's teams in their stored order as one card per team. A card SHALL show the team name, its members as unit portraits in position order with a count badge ("N/5") whenever fewer than five members, the reserve member marked as such when present, the covered objectives as chips (objective icon, label and points; a stored objective the current members no longer derive shows muted and does not count toward points), the team's **points left** (see the points-left requirement), the team's **total power**, the clear depth (or a "Set depth" prompt when null), and an actions menu with Edit, Delete and, on mobile, Move up / Move down. The same team SHALL never be rendered more than once, whatever the number of objectives it covers. The section SHALL carry an explicit **Add team** button; no scroll, swipe or other gesture SHALL create or open a team.

#### Scenario: Teams render in order on a lane

- **GIVEN** Alpha has teams "Melee" (order 0) and "Flyers" (order 1) and Beta has one team
- **WHEN** the user opens the Alpha tab
- **THEN** the Teams section lists Melee then Flyers, each once, and nothing from Beta

#### Scenario: Partial team shows its count

- **GIVEN** a team with three members
- **WHEN** its card renders
- **THEN** three portraits and a "3/5" badge show, and the card is not styled as an error

#### Scenario: Points per battle on the card

- **GIVEN** an Alpha team covering objectives worth 20 and 25, with a displayed depth of 2, on a lane whose first two battles have battle points 32 and 28 and defeat-all 32, and no synced progress
- **WHEN** its card renders
- **THEN** it shows 274 points left in battles 1–2: battle 1 is 32 + 32 + 32 + 20 + 25 = 141 and battle 2 is 28 + 28 + 32 + 20 + 25 = 133

The total power SHALL be the sum of the non-reserve members' power (the `character-combat-power` estimate at their synced state, items included), without horde-mode multipliers; a member the roster does not hold adds 0 and is covered by the card's "not counted" note. It SHALL be labelled "Team power" with locale digit grouping, and it SHALL update when the roster syncs or the members change. While the roster or the `unit-power` dataset is loading it SHALL show a placeholder dash. When the roster could not be read, or power data is unavailable for any owned member, it SHALL show "—" with an accessible reason rather than a partial sum. On mobile the total power SHALL sit on the same line as the points left.

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

### Requirement: A team card shows the points it has left within its depth

A card's points figure SHALL be the lane reachable points (`legendary-event-upgrade-impact`) of that team alone over battles 1..its displayed depth on the synced progress, read as "N points left · battles 1–D". Other teams are not deducted. Without a usable depth it SHALL show "—" with a reason, or "Can't clear battle 1 yet" at depth 0 (see scenarios).

Assumptions:

- Each award is earned once per battle across the event.
- Loading or failed progress counts as nothing cleared.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha (battle points 32, 28, 33, 37, 44, 48, 45, 48, 44, 46, 48, 47, 48, 49, ...; defeat-all 32; Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 Hits 85, No Resilient 40) with synced progress where battles 1–13 have defeat-all and No Resilient cleared and full kill and high scores, Eviscerate cleared in battles 5 and 6, Flying cleared nowhere, and battle 14 onward untouched
- **AND** a team "Flying · No Resilient" covering Flying and No Resilient with an estimated depth of 11
- **WHEN** its card renders
- **THEN** each of battles 1–11 has kill score 0, high score 0, defeat-all 0, No Resilient 0 and Flying 80 left, so it shows "880 points left · battles 1–11"

#### Scenario: A deeper team earns from the battles past the cleared ones

- **GIVEN** the same progress and a team covering No Resilient with an estimated depth of 14
- **WHEN** its card renders
- **THEN** battles 1–13 add 0 and battle 14 adds 49 + 49 + 32 + 40 = 170, so it shows "170 points left · battles 1–14"
- **AND** the No Resilient chip is not marked cleared, because battle 14 has it open

#### Scenario: Partially cleared objective

- **GIVEN** the same progress and a team covering Eviscerate with an estimated depth of 11
- **WHEN** its card renders
- **THEN** Eviscerate is open in battles 1–4 and 7–11, so it shows 9 × 75 = "675 points left · battles 1–11", and the Eviscerate chip is not marked cleared

#### Scenario: No depth

- **GIVEN** a complete team with no manual depth and no estimate
- **WHEN** its card renders
- **THEN** the points figure shows "—" with "Set depth to see points left"

#### Scenario: Depth 0

- **GIVEN** a complete team whose estimate is 0 clears
- **WHEN** its card renders
- **THEN** the points figure reads "Can't clear battle 1 yet", not "0 points left · battles 1–0"

#### Scenario: Incomplete team

- **GIVEN** a team with fewer than three members
- **WHEN** its card renders
- **THEN** the points figure shows a plain "—" without the "Set depth" reason
