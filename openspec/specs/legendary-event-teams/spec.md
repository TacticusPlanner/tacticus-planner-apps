# legendary-event-teams Specification

## Purpose

Defines the per-lane Teams section of a Legendary Event page: the team card, the team editor and how covered objectives are derived, the clear-depth input, ordering, and how the client persists the plan through the API with its single-revision conflict contract.

## Requirements

### Requirement: Each lane tab has a Teams section with one card per team

A lane tab SHALL show a Teams section, between the lane overview and the synced progress grid, listing that lane's teams in their stored order as one card per team. A card SHALL show the team name, its members as unit portraits in position order with a count badge ("N/5") whenever fewer than five members, the reserve member marked as such when present, the covered objectives as chips (objective icon, label and points; a stored objective the current members no longer derive shows muted and does not count toward points), the team's points per battle, the clear depth (or a "Set depth" prompt when null), and an actions menu with Edit, Delete and, on mobile, Move up / Move down. The same team SHALL never be rendered more than once, whatever the number of objectives it covers. The section SHALL carry an explicit **Add team** button; no scroll, swipe or other gesture SHALL create or open a team.

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

The team editor SHALL open from Add team (empty) or Edit (prefilled) as a dialog on desktop and a bottom sheet on mobile. It SHALL offer only the lane's allowed units in a picker where each unit shows its name, portrait, the objective icons it satisfies (muted when not), its points per battle and locked styling when not owned; the picker SHALL be searchable by name and SHALL have an "only unlocked" filter defaulting to the page's shared value. The user SHALL select up to five members, kept in the order they were selected (the editor offers no drag reorder of members), and may mark one further unit as reserve. The covered objectives SHALL be derived as the objectives every non-reserve member satisfies, shown as checked chips the user can untick. On every member change the set SHALL be reconciled against the previous derivation: an objective that still derives keeps the user's tick or untick, an objective that newly derives (it did not derive from the previous members) is ticked, and an objective that no longer derives is removed. On opening a saved team the previous derivation is that of the stored members, so an objective that derives but is not stored stays unticked. A team MAY be saved with zero covered objectives. The name SHALL default to the covered objective labels joined by " · " (or "Team N") and be editable, 1–60 characters. Save SHALL be unavailable with zero members and while a save is in progress. The editor SHALL close only once the save succeeded; after a conflict or any other failure it SHALL stay open with the draft, and after a conflict it SHALL say in the dialog that this save was not applied because the plan was reloaded.

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

### Requirement: Clear depth is a manual stepper per run

Each card and the editor SHALL expose the clear depth of the current run as a stepper bounded 1..(lane battle count) with a clear control that sets it to null. The current run SHALL be the synced `currentEventRun` for the event, or 1 when the account has no synced entry for it. Every depth write SHALL carry that run, so a depth set during another run is kept. Any value set by the user SHALL be stored with source `manual`. On the card, each stepper change SHALL show at once, and a rapid run of changes SHALL be sent as one write carrying the final value once the changes settle; a run that ends on the starting value SHALL send nothing. No estimate SHALL be shown or stored by this capability.

#### Scenario: Depth set from the card

- **GIVEN** a team with no depth on an 18-battle lane
- **WHEN** the user presses + three times in quick succession
- **THEN** the card shows 1, 2 then 3 as they are pressed, and once the presses settle one write saves the team with `run` 1, `expectedBattleClears` 3 and source `manual`

#### Scenario: Depth is per run

- **GIVEN** a team with a run-1 depth of 7 and the synced progress says the event is in run 2
- **WHEN** the card renders
- **THEN** it shows "Set depth", and setting 9 saves `run` 2 while the run-1 depth of 7 is still in the plan

#### Scenario: Depth cleared

- **WHEN** the user clears the depth
- **THEN** the card shows "Set depth" and the team is saved with a null depth and null source for the current run

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

### Requirement: The plan is persisted through the API with one revision

The client SHALL read the plan for the current event once per page through a query. Writes SHALL go out one at a time, each sending `expectedRevision` (the revision of the last plan the server returned) and adopting the plan the server returns; a plan read that is older than the plan already shown SHALL NOT replace it. Reorder, delete and depth changes SHALL apply optimistically; create and edit SHALL wait for the server. When the server answers 409 with `issueCode` `legendaryEventPlanStale` or `legendaryEventOrderSetMismatch`, the client SHALL adopt the plan from the response body, show one message saying the plan was reloaded, discard writes queued behind the conflicting one without sending them (they count as not applied), keep any open editor draft, and make no retry on its own. Any other failure SHALL roll back optimistic state and show a translated error message, never the server's raw message. A team SHALL survive a page reload and a Tacticus sync.

#### Scenario: Stale revision during edit

- **GIVEN** the editor is open on a plan at revision 3 and another device moved it to revision 4
- **WHEN** the user saves
- **THEN** the card list reflects revision 4, a message says the plan was reloaded, and the editor is still open with the user's draft and says this save was not applied

#### Scenario: Reload keeps the team

- **GIVEN** the user created a team
- **WHEN** they reload the page
- **THEN** the team is listed with the same members, objectives and depth

### Requirement: Teams section states are distinct

The section SHALL not render when the user is signed out. While the plan, the catalog units or the synced progress (which decides the current run) are loading, the section SHALL show a skeleton card, so no depth edit or editor opens against the default run before the synced run is known. When the plan or the catalog units fail to load the section SHALL show an inline error with a Retry action that re-reads whichever failed, while the rest of the lane tab renders normally. When the plan loads with no team on the lane the section SHALL show an empty line naming the lane plus Add team.

#### Scenario: Plan load failure

- **WHEN** the plan request fails
- **THEN** the Teams section shows an error with Retry and the progress grid and leaderboard below it still render

#### Scenario: Retry re-reads what failed

- **GIVEN** the plan loaded but the catalog units failed
- **WHEN** the user presses Retry
- **THEN** the catalog units are read again and the section renders the teams once they load

#### Scenario: Waiting for the current run

- **GIVEN** the plan has loaded and the synced progress is still loading
- **WHEN** the lane tab renders
- **THEN** the Teams section shows its skeleton and no depth stepper until the synced progress has loaded

#### Scenario: Empty lane

- **GIVEN** the plan loaded and Gamma has no team
- **WHEN** the user opens Gamma
- **THEN** the section says no teams are on Gamma yet and shows Add team
