# legendary-event-teams Specification

## Purpose

Defines the per-lane Teams section of a Legendary Event page: the team card, the team editor and how covered objectives are derived, the clear-depth input, ordering, and how the client persists the plan through the API with its single-revision conflict contract.

## Requirements

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

### Requirement: Clear depth is a manual stepper per run

Each card and the editor SHALL expose the clear depth of the current run as a stepper bounded 1..(lane battle count) with a clear control that sets it to null. The current run SHALL be the event's resolved run (`legendary-event-run-resolution`): the run in progress, else the next run to start, and run 1 when the run is unknown. Every depth write SHALL carry that run, so a depth set during another run is kept. Any value set by the user SHALL be stored with source `manual`. On the card, each stepper change SHALL show at once, and a rapid run of changes SHALL be sent as one write carrying the final value once the changes settle; a run that ends on the starting value SHALL send nothing. When the current run has no manual depth and a clear estimate exists (see `legendary-event-clear-estimates`), the stepper SHALL show the estimate marked "estimated" with its margin line ("N% above battle n · M% short of battle n+1"), and − or + SHALL start from the estimate and store a manual depth. When a manual depth exists and an estimate exists, the card SHALL show a muted "estimate ~n" hint and a **Use estimate** control that clears the current run's manual depth. An estimated depth of 0 SHALL read "Not enough for battle 1 yet". Members that are not owned SHALL be noted as not counted. The estimate SHALL never be written to the API; the `estimate` source is not used by this client. Every depth write SHALL report the estimate shown at the time (or none) with the analytics event.

#### Scenario: Depth set from the card

- **GIVEN** a team with no depth on an 18-battle lane and no estimate available
- **WHEN** the user presses + three times in quick succession
- **THEN** the card shows 1, 2 then 3 as they are pressed, and once the presses settle one write saves the team with `run` 1, `expectedBattleClears` 3 and source `manual`

#### Scenario: Depth is per run

- **GIVEN** a team with a run-1 depth of 7, the synced progress says the event is in run 2, and no estimate is available
- **WHEN** the card renders
- **THEN** it shows "Set depth", and setting 9 saves `run` 2 while the run-1 depth of 7 is still in the plan

#### Scenario: Depth cleared

- **WHEN** the user clears the depth and no estimate is available
- **THEN** the card shows "Set depth" and the team is saved with a null depth and null source for the current run

#### Scenario: Estimate shown without a manual depth

- **GIVEN** the worked Uthar Alpha team with an estimated depth of 6 and no manual depth for the current run
- **WHEN** the card renders
- **THEN** the stepper shows 6 marked "estimated" with "12% above battle 6 · 37% short of battle 7", and nothing is written

#### Scenario: Override from the estimate

- **GIVEN** that card
- **WHEN** the user presses + once
- **THEN** the card shows 7 without the "estimated" mark, one write saves `expectedBattleClears` 7 with source `manual`, and the analytics event carries `estimate` 6

#### Scenario: Use estimate

- **GIVEN** a team with a manual depth of 9 for the current run and an estimate of 6
- **WHEN** the user presses Use estimate
- **THEN** the current run's depth is saved as null and the card shows 6 marked "estimated"

#### Scenario: Roster change moves the estimate, not the manual value

- **GIVEN** a team with a manual depth of 7 and an estimate of 6
- **WHEN** a sync raises a member's rank so the estimate becomes 8
- **THEN** the card still shows 7, with the hint "estimate ~8", and no write happens

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

### Requirement: A team card shows what the same team cleared last run

When the event has a previous run (see `legendary-event-run-history`) whose teams snapshot contains a team with the same id on this lane, that team's card SHALL show "Last run: cleared up to battle N" beside its clear depth, with N the team cleared battle derived from the previous record. A team absent from the snapshot (created since) SHALL show no line. The line SHALL NOT change the depth stepper's value or default, and SHALL be absent while records load or when their read failed.

#### Scenario: Same team as last run

- **GIVEN** the previous run's snapshot has Alpha team "Melee" (same id) cleared up to battle 3
- **WHEN** the Alpha tab renders Melee's card
- **THEN** the card reads "Last run: cleared up to battle 3" beside the depth stepper, and the stepper still shows the current run's depth

#### Scenario: New team

- **GIVEN** a team created after the previous run
- **WHEN** its card renders
- **THEN** no last-run line is shown

#### Scenario: Mobile card

- **WHEN** the card renders below 768px
- **THEN** the last-run line wraps under the depth stepper instead of beside it

### Requirement: A team shows a readable name wherever it is named

A team whose stored name is empty or equals its lane id (case-insensitive, such as the "alpha" a V1 import stored) SHALL be shown by its covered objective labels joined by " · ", or "Team N" (its 1-based position in the lane) when it covers none; any other stored name is shown as stored. This display name SHALL be used on the team card, the token plan, the Next token card and its prompts, upgrade-impact rows and the last-run team lines.

#### Scenario: Imported team named after its lane

- **GIVEN** Uthar Alpha holds a team stored as "alpha" covering Max 2 Hits and Melee
- **WHEN** its card renders and a depth prompt names it
- **THEN** the card title reads "Max 2 hits · Melee" and the prompt reads "Set how far Max 2 hits · Melee clears"

#### Scenario: A chosen name is kept

- **GIVEN** a team stored as "Melee rush"
- **WHEN** it is shown anywhere
- **THEN** it reads "Melee rush"

#### Scenario: No objectives

- **GIVEN** the second Alpha team is stored as "alpha" and covers no objective
- **WHEN** it is shown
- **THEN** it reads "Team 2"

### Requirement: Editing a team named after its lane offers the readable name

Opening the editor on a team whose stored name is empty or equals its lane id SHALL prefill the name field with its display name. Saving then stores that name; the stored name is never changed by display alone.

#### Scenario: Edit and save

- **GIVEN** Uthar Alpha's team stored as "alpha" covering Max 2 Hits and Melee
- **WHEN** the user opens it in the editor and saves without touching the name
- **THEN** the name field showed "Max 2 hits · Melee" and the team is saved with that name

#### Scenario: Display alone changes nothing stored

- **WHEN** the team card renders the display name
- **THEN** no write is sent and the stored name stays "alpha"

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

### Requirement: Covered objectives already cleared through the depth are marked

An objective is **cleared through depth D** when the synced progress has it cleared in every battle 1..D (D ≥ 1). On a team card (D = displayed depth) and in the editor footer (D = the draft's manual or estimated depth), such a covered objective SHALL show a cleared mark ("Already cleared through battle D" for screen readers), stay visible, and not count toward points. With no depth nothing is marked.

#### Scenario: Card marks a spent objective

- **GIVEN** the Lysander Alpha worked example and the "Flying · No Resilient" team at depth 11
- **WHEN** its card renders
- **THEN** the No Resilient chip shows the cleared mark and reads "Already cleared through battle 11" to screen readers, and the Flying chip does not

#### Scenario: Editor marks it while picking

- **GIVEN** the same progress and an editor draft with three Flying, non-Resilient members and an estimated depth of 12
- **WHEN** the footer chips render
- **THEN** No Resilient is covered and shows the cleared mark ("Already cleared through battle 12"), and Flying shows none

#### Scenario: Depth past the cleared battles

- **WHEN** the draft's depth changes from 12 to 14
- **THEN** the No Resilient mark disappears, because battle 14 has it open

### Requirement: The team editor shows its result above the picker

The team editor body SHALL be ordered Name, then one row holding the Members heading with its count on the left and Clear depth for the current run on the right, then the selected chips, search, switches, objective chips and unit grid, on the desktop dialog and the mobile sheet. The body has no Covered objectives section: the footer (`legendary-event-team-editor-workflow`) shows them.

#### Scenario: Desktop order

- **WHEN** the editor opens at or above 768px
- **THEN** the Members row with Clear depth sits directly under Name, above the unit grid, with no scrolling needed to reach it

#### Scenario: Mobile order

- **WHEN** the editor opens below 768px
- **THEN** the sheet shows Name, then Members and Clear depth on one row at 375px, and the unit grid scrolls underneath within the sheet body

#### Scenario: Coverage updates in place

- **GIVEN** the editor is scrolled to the unit grid
- **WHEN** the user picks a unit
- **THEN** the footer summary's covered objectives update without scrolling

### Requirement: Team editor covers the objectives its members derive

The team editor (Add team or Edit; dialog on desktop, sheet on mobile) SHALL offer the lane's allowed units (`legendary-event-team-editor-workflow`) for up to five members in selection order plus one reserve. Covered objectives SHALL be those every non-reserve member satisfies, read-only, and SHALL be what is saved.

#### Scenario: Coverage follows the members

- **GIVEN** units A and B both satisfy Melee and Min 5 Hits and only A satisfies No Resilient
- **WHEN** the user selects A then B
- **THEN** after A the footer shows Melee, Min 5 Hits and No Resilient; after B only Melee and Min 5 Hits

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

#### Scenario: Name, Save and failures are unchanged

- **WHEN** the user edits a team
- **THEN** the name defaults to the covered labels joined by " · " (or "Team N") and is editable, 1–60 characters
- **AND** Save is unavailable below three non-reserve members (`legendary-event-team-size`) and while saving
- **AND** the editor closes only once a save succeeds (or stays open for Save and add another), keeps the draft after a failure, and after a conflict says the save was not applied because the plan was reloaded

#### Scenario: Saved team with an objective it no longer stores

- **GIVEN** a saved team whose members derive Melee and Min 5 Hits but whose stored objectives are only Melee
- **WHEN** it is edited and saved without changes
- **THEN** the editor shows Melee and Min 5 Hits covered, and the saved team stores both

### Requirement: A lane holds at most 50 teams

When a lane already holds 50 teams, Add team SHALL be disabled with a translated note beside it. Every path that creates a team (Add team, an accepted suggestion, adding a unit from the leaderboard) SHALL check the plan's confirmed teams for that lane and SHALL NOT send the request at the cap; it shows a translated toast instead. A `legendaryEventTeamLimitReached` from the API SHALL show the same toast. The plan stays as it was.

#### Scenario: The lane is full

- **WHEN** the Alpha lane holds 50 teams
- **THEN** Add team is disabled and the note says the lane holds the maximum of 50 teams
- **AND** saving a team from a suggestion sends nothing and toasts the cap
