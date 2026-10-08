# legendary-event-teams Specification

## Purpose

Defines the per-lane Teams section of a Legendary Event page: the team card, the team editor and how covered objectives are derived, the clear-depth input, ordering, copying teams from another event, and how the client persists the plan through the API with its single-revision conflict contract.

## ADDED Requirements

### Requirement: Each lane tab has a Teams section with one card per team

A lane tab SHALL show a Teams section, between the lane overview and the synced progress grid, listing that lane's teams in their stored order as one card per team. A card SHALL show the team name, its members as unit portraits in position order with a count badge ("N/5") whenever fewer than five members, the reserve member marked as such when present, the covered objectives as chips (objective icon, label and points), the team's points per battle, the clear depth (or a "Set depth" prompt when null), and an actions menu with Edit, Delete and, on mobile, Move up / Move down. The same team SHALL never be rendered more than once, whatever the number of objectives it covers. The section SHALL carry an explicit **Add team** button; no scroll, swipe or other gesture SHALL create or open a team.

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

### Requirement: Team editor derives covered objectives from members

The team editor SHALL open from Add team (empty) or Edit (prefilled) as a dialog on desktop and a bottom sheet on mobile. It SHALL offer only the lane's allowed units in a picker where each unit shows its name, portrait, the objective icons it satisfies (muted when not), its points per battle and locked styling when not owned; the picker SHALL be searchable by name and SHALL have an "only unlocked" filter defaulting to the page's shared value. The user SHALL select up to five members and may mark one further unit as reserve. The covered objectives SHALL be derived as the objectives every non-reserve member satisfies, shown as checked chips the user can untick. On every member change the set SHALL be reconciled against the previous derivation: an objective that still derives keeps the user's tick or untick, an objective that newly derives (it did not derive from the previous members) is ticked, and an objective that no longer derives is removed. On opening a saved team the previous derivation is that of the stored members, so an objective that derives but is not stored stays unticked. A team MAY be saved with zero covered objectives. The name SHALL default to the covered objective labels joined by " · " (or "Team N") and be editable, 1–60 characters. Save SHALL be unavailable with zero members.

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

### Requirement: Clear depth is a manual stepper

Each card and the editor SHALL expose the clear depth as a stepper bounded 1..(lane battle count) with a clear control that sets it to null. Any value set by the user SHALL be stored with source `manual`. No estimate SHALL be shown or stored by this capability.

#### Scenario: Depth set from the card

- **GIVEN** a team with no depth on an 18-battle lane
- **WHEN** the user presses + three times
- **THEN** the card shows 3 and the team is saved with `expectedBattleClears` 3 and source `manual`

#### Scenario: Depth cleared

- **WHEN** the user clears the depth
- **THEN** the card shows "Set depth" and the team is saved with a null depth and null source

### Requirement: Teams are reordered within their lane

On desktop the user SHALL reorder a lane's teams by dragging a card's handle (and by keyboard through the same list); on mobile through Move up / Move down in the card menu. A reorder SHALL send the lane's complete team id list in the new order and SHALL apply optimistically, rolling back on failure.

#### Scenario: Desktop drag reorder

- **GIVEN** Alpha has A, B, C
- **WHEN** the user drags C above A at or above 768px
- **THEN** the list shows C, A, B immediately and the stored order is C, A, B after the request completes

#### Scenario: Mobile move down

- **GIVEN** Alpha has A, B, C
- **WHEN** the user picks Move down on A below 768px
- **THEN** the list shows B, A, C and Move up is hidden for the first card and Move down for the last

### Requirement: Copy teams from another event

The Teams section SHALL offer **Copy from event** when any other catalog event has a plan with at least one team. The copy dialog SHALL list the source events, then each source team (any lane) with a preview against the current lane: the members kept, the members dropped because the current lane does not allow them, and the number of objectives the kept members cover. Confirming SHALL create the selected teams on the current lane with their names, coverage derived from the kept members and no clear depth, and SHALL report in one toast how many teams were copied and how many units were dropped. A source team with no kept member SHALL be listed disabled.

#### Scenario: Copy with a dropped unit

- **GIVEN** Uthar's Alpha team "Melee" has units A, B, C and C is not allowed on Lysander's Alpha
- **WHEN** the user copies it onto Lysander's Alpha
- **THEN** a team "Melee" with members A, B is created, its coverage is derived from A and B, and the toast reports 1 team copied and 1 unit dropped

#### Scenario: No source events

- **GIVEN** no other event has teams
- **WHEN** the Teams section renders
- **THEN** Copy from event is not shown

### Requirement: The plan is persisted through the API with one revision

The client SHALL read the plan for the current event once per page through a query and SHALL send `expectedRevision` (the cached plan's revision) with every mutation, adopting the plan the server returns. When the server answers 409 with `issueCode` `legendaryEventPlanStale` or `legendaryEventOrderSetMismatch`, the client SHALL adopt the plan from the response body, show one message saying the plan was reloaded, keep any open editor draft, and make no retry on its own. Any other failure SHALL roll back optimistic state and show the error. A team SHALL survive a page reload and a Tacticus sync.

#### Scenario: Stale revision during edit

- **GIVEN** the editor is open on a plan at revision 3 and another device moved it to revision 4
- **WHEN** the user saves
- **THEN** the card list reflects revision 4, a message says the plan was reloaded, and the editor is still open with the user's draft

#### Scenario: Reload keeps the team

- **GIVEN** the user created a team
- **WHEN** they reload the page
- **THEN** the team is listed with the same members, objectives and depth

### Requirement: Teams section states are distinct

While the plan query is pending the section SHALL show a skeleton card. When the query fails the section SHALL show an inline error with a Retry action while the rest of the lane tab renders normally. When the plan loads with no team on the lane the section SHALL show an empty line naming the lane plus Add team (and Copy from event when available).

#### Scenario: Plan load failure

- **WHEN** the plan request fails
- **THEN** the Teams section shows an error with Retry and the progress grid and leaderboard below it still render

#### Scenario: Empty lane

- **GIVEN** the plan loaded and Gamma has no team
- **WHEN** the user opens Gamma
- **THEN** the section says no teams are on Gamma yet and shows Add team
