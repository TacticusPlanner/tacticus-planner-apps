# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Team editor derives covered objectives from members

**Reason**: Covered objectives can no longer be unticked, so the reconciliation of user ticks against the previous derivation goes away.

**Migration**: Replaced by "Team editor covers the objectives its members derive", which keeps the rest of this requirement unchanged.
