# Spec Delta

## MODIFIED Requirements

### Requirement: Team editor derives covered objectives from members

The team editor SHALL open from Add team (empty) or Edit (prefilled) as a dialog on desktop and a bottom sheet on mobile. It SHALL offer only the lane's allowed units in a picker where each unit shows its name, portrait, the objective icons it satisfies (muted when not), its points per battle and locked styling when not owned; the picker SHALL be searchable by name, SHALL have an "only unlocked" filter defaulting to the page's shared value and SHALL carry objective chips that reorder the grid (`legendary-event-team-editor-workflow`). The user SHALL select up to five members, kept in the order they were selected (the editor offers no drag reorder of members), and may mark one further unit as reserve. The covered objectives SHALL be derived as the objectives every non-reserve member satisfies, shown as checked chips the user can untick. On every member change the set SHALL be reconciled against the previous derivation: an objective that still derives keeps the user's tick or untick, an objective that newly derives (it did not derive from the previous members) is ticked, and an objective that no longer derives is removed. On opening a saved team the previous derivation is that of the stored members, so an objective that derives but is not stored stays unticked. A team MAY be saved with zero covered objectives. The name SHALL default to the covered objective labels joined by " · " (or "Team N") and be editable, 1–60 characters. Save SHALL be unavailable with fewer than three non-reserve members (see `legendary-event-team-size`) and while a save is in progress. The editor SHALL close only once the save succeeded, unless the user chose Save and add another (`legendary-event-team-editor-workflow`), which keeps it open for the next team; after a conflict or any other failure it SHALL stay open with the draft, and after a conflict it SHALL say in the dialog that this save was not applied because the plan was reloaded.

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
