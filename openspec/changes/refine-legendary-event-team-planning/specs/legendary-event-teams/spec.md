# Spec Delta

## MODIFIED Requirements

### Requirement: Each lane tab has a Teams section with one card per team

A lane tab SHALL show a Teams section, between the lane overview and the synced progress grid, listing that lane's teams in their stored order as one card per team. A card SHALL show the team name, its members as unit portraits in position order with a count badge ("N/5") whenever fewer than five members, the reserve member marked as such when present, the covered objectives as chips (objective icon, label and points; a stored objective the current members no longer derive shows muted and does not count toward points, and one already cleared through the team's depth shows as already cleared), the team's **points left** (see the points-left requirement), the team's **total power**, the clear depth (or a "Set depth" prompt when null), and an actions menu with Edit, Delete and, on mobile, Move up / Move down. The same team SHALL never be rendered more than once, whatever the number of objectives it covers. The section SHALL carry an explicit **Add team** button; no scroll, swipe or other gesture SHALL create or open a team.

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

### Requirement: Team editor derives covered objectives from members

The team editor SHALL open from Add team (empty) or Edit (prefilled) as a dialog on desktop and a bottom sheet on mobile. It SHALL offer only the lane's allowed units in a picker where each unit shows its name, portrait, the objective icons it satisfies (muted when not), its remaining points, its rarity, rank and estimated clears when owned (`legendary-event-team-editor-workflow`) and locked styling when not owned; the picker SHALL be searchable by name, SHALL have an "only unlocked" filter defaulting to the page's shared value and SHALL carry objective chips that reorder the grid (`legendary-event-team-editor-workflow`). The user SHALL select up to five members, kept in the order they were selected (the editor offers no drag reorder of members), and may mark one further unit as reserve. The covered objectives SHALL be derived as the objectives every non-reserve member satisfies, shown as checked chips the user can untick. On every member change the set SHALL be reconciled against the previous derivation: an objective that still derives keeps the user's tick or untick, an objective that newly derives (it did not derive from the previous members) is ticked, and an objective that no longer derives is removed. On opening a saved team the previous derivation is that of the stored members, so an objective that derives but is not stored stays unticked. A team MAY be saved with zero covered objectives. The name SHALL default to the covered objective labels joined by " · " (or "Team N") and be editable, 1–60 characters. Save SHALL be unavailable with fewer than three non-reserve members (see `legendary-event-team-size`) and while a save is in progress. The editor SHALL close only once the save succeeded, unless the user chose Save and add another (`legendary-event-team-editor-workflow`), which keeps it open for the next team; after a conflict or any other failure it SHALL stay open with the draft, and after a conflict it SHALL say in the dialog that this save was not applied because the plan was reloaded.

#### Scenario: Coverage follows the members

- **GIVEN** units A and B both satisfy Melee and Min 5 Hits and only A satisfies No Resilient
- **WHEN** the user selects A then B
- **THEN** after A the chips Melee, Min 5 Hits and No Resilient are checked; after B only Melee and Min 5 Hits remain checked

#### Scenario: Untick survives a save and an edit

- **GIVEN** the user unticks Min 5 Hits and saves
- **WHEN** the team is edited again with the same members
- **THEN** Melee is checked and Min 5 Hits is shown unchecked

#### Scenario: Newly derived objective is ticked again

- **GIVEN** units A and B both satisfy Min 5 Hits and only A satisfies No Resilient, the user selected A then B (so No Resilient dropped) and unticked Min 5 Hits
- **WHEN** the user removes B
- **THEN** No Resilient is ticked again because it newly derives, and Min 5 Hits stays unticked because it still derives and the user's untick is kept

#### Scenario: Sixth member is refused

- **GIVEN** five members are selected
- **WHEN** the user taps a sixth unit
- **THEN** the selection is unchanged and the count badge draws attention

#### Scenario: Reserve does not affect coverage

- **GIVEN** members A and B cover Melee and the reserve unit does not satisfy Melee
- **WHEN** the reserve is set
- **THEN** Melee stays covered

#### Scenario: Picker respects the lane

- **WHEN** the editor opens on Beta
- **THEN** only units allowed on Beta are listed and the objective icons shown are Beta's

## ADDED Requirements

### Requirement: A team card shows the points it has left within its depth

A card's points figure SHALL be the lane reachable points (`legendary-event-upgrade-impact`) of that team alone over battles 1..its displayed depth on the synced progress, in event points, read as "N points left · battles 1–D". Other teams are not deducted. With no displayed depth it SHALL show "—" with "Set depth to see points left".

Assumptions:

- Each award is earned once per battle across the event.
- Loading or failed progress counts as nothing cleared.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha (battle points 32, 28, 33, 37, 44, 48, 45, 48, 44, 46, 48, 47, 48, 49, ...; defeat-all 32; Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 Hits 85, No Resilient 40) with synced progress where battles 1–13 have defeat-all and No Resilient cleared and full kill and high scores, Eviscerate cleared in battles 5 and 6, Flying cleared nowhere, and battle 14 onward untouched
- **AND** a team "Flying · No Resilient" covering Flying and No Resilient with an estimated depth of 11
- **WHEN** its card renders
- **THEN** each of battles 1–11 has kill score 0, high score 0, defeat-all 0, No Resilient 0 and Flying 80 left, so it shows "880 points left · battles 1–11" (previously "152 points per battle")
- **AND** the No Resilient chip shows as already cleared

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

- **GIVEN** an incomplete team, or a complete team with no manual depth and no estimate
- **WHEN** its card renders
- **THEN** the points figure shows "—" with "Set depth to see points left"

### Requirement: Covered objectives already cleared through the depth are marked

An objective is **cleared through depth D** when the synced progress has it cleared in every battle 1..D (D ≥ 1). On a team card (D = displayed depth) and in the editor (D = the draft's manual or estimated depth), such a covered objective SHALL show a cleared mark ("Already cleared through battle D" for screen readers), stay visible and tickable, and not count toward points. With no depth nothing is marked.

#### Scenario: Card marks a spent objective

- **GIVEN** the Lysander Alpha worked example and the "Flying · No Resilient" team at depth 11
- **WHEN** its card renders
- **THEN** the No Resilient chip shows the cleared mark and reads "Already cleared through battle 11" to screen readers, and the Flying chip does not

#### Scenario: Editor marks it while picking

- **GIVEN** the same progress and an editor draft with three Flying, non-Resilient members and an estimated depth of 12
- **WHEN** the coverage chips render
- **THEN** No Resilient is ticked and shows the cleared mark ("Already cleared through battle 12"), and Flying shows none

#### Scenario: Depth past the cleared battles

- **WHEN** the draft's depth changes from 12 to 14
- **THEN** the No Resilient mark disappears, because battle 14 has it open

### Requirement: The team editor shows its result above the picker

The team editor body SHALL be ordered Name, Covered objectives, Clear depth for the current run, then Members (count, selected chips, search, switches, objective chips and unit grid), on the desktop dialog and the mobile sheet. The footer (`legendary-event-team-editor-workflow`) is unchanged.

#### Scenario: Desktop order

- **WHEN** the editor opens at or above 768px
- **THEN** Covered objectives and Clear depth sit directly under Name, above the unit grid, with no scrolling needed to reach them

#### Scenario: Mobile order

- **WHEN** the editor opens below 768px
- **THEN** the sheet shows Name, Covered objectives and Clear depth before Members, and the unit grid scrolls underneath them within the sheet body

#### Scenario: Coverage updates in place

- **GIVEN** the editor is scrolled to the unit grid
- **WHEN** the user picks a unit
- **THEN** the covered objectives above update and the footer summary still shows them without scrolling
