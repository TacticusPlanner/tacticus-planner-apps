## MODIFIED Requirements

### Requirement: Each Event board lane column has a Teams section with one card per team

Each lane column of the Teams tab's Event board SHALL show a Teams section, under its unit table, listing that lane's teams in their stored order as one card per team. A card SHALL show the team name, its members in position order as unit chips (the `legendary-events-hub` unit chip, with rank shading per the Rank shading setting and the unit details) with a count badge ("N/5") whenever fewer than five members, the reserve member as a unit chip marked as the reserve when present, a **coverage strip** beside the team name when the card is at least 28rem wide, and on a line of its own under the name on narrower cards, never squeezing the name out (so five named member chips keep a line of their own), with one fixed slot per lane objective in objective order (a covered objective shows its icon and points; a stored objective the current members no longer derive shows muted and does not count toward points; an uncovered one shows faint, so teams scan down by column), the clear depth as a **depth bar** of one segment per lane battle filled through the depth with a "Battles 1–n" headline (toned: set by you, room to spare, or within 10% of the next battle; "No depth set" when null) and an edit button that reveals the depth stepper (shown at once when there is no depth), a **Details** fold with the team's **points left** (see the points-left requirement), its **total power** and the last-run line, and an actions menu with Edit, Delete and, on mobile, Move up / Move down. The same team SHALL never be rendered more than once, whatever the number of objectives it covers. The section SHALL carry an explicit **Add team** button; no scroll, swipe or other gesture SHALL create or open a team. A member chip SHALL be a button that opens the member's details (see the `legendary-events-hub` details requirement).

#### Scenario: Teams render in order on a lane

- **GIVEN** Alpha has teams "Melee" (order 0) and "Flyers" (order 1) and Beta has one team
- **WHEN** the user opens the Alpha tab
- **THEN** the Teams section lists Melee then Flyers, each once, and nothing from Beta

#### Scenario: Partial team shows its count

- **GIVEN** a team with three members
- **WHEN** its card renders
- **THEN** three member chips and a "3/5" badge show, and the card is not styled as an error

#### Scenario: Members show as named chips

- **GIVEN** a team whose members include `templHelbrecht`, owned at Legendary with 4 red stars, rank Diamond 1, active 8 and passive 8, and whose reserve is `templAncient`, not owned
- **WHEN** its card renders in English
- **THEN** Helbrecht's chip shows "Helbrecht" beside his portrait with an "L" badge and the Diamond 1 rank icon, and "A8" and "P8" side by side under the name
- **AND** the reserve shows as a locked "Thoread" chip marked as the reserve

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
