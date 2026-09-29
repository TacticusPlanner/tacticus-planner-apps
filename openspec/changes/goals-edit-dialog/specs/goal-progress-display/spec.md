## MODIFIED Requirements

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation on every goal kind

Where Actual and Potential ratios render together, their explanation SHALL be reachable without hover. At or above 768px it SHALL use an explicit info-triggered popover; below 768px tapping the remaining-text line SHALL expand it inline. Actual SHALL describe synced/owned state and its remaining count. Potential SHALL describe applying owned resources after globally higher-priority Active goals reserve their share, state that it does not change actual status, and show its remaining count. The explanation SHALL not describe a selected project as a separate allocation pool. The same disclosure applies in goal list and project detail, at most once per ratio. With no Potential ratio, only Actual appears and no explanation trigger is required.

#### Scenario: Both bars render in the compact goals list

- **WHEN** a desktop goal row has Actual and Potential ratios
- **THEN** its stacked bar, percent, and info button render with explanations hidden until activation

#### Scenario: Both bars render on a project detail card

- **WHEN** a desktop project goal has both ratios
- **THEN** it uses the same info disclosure and global-priority explanation as Global Plan

#### Scenario: Both bars render in the goal-detail sheet

- **WHEN** the Edit goal dialog is open
- **THEN** it renders no progress bars and no progress explanation (the read-only goal detail no longer exists)

#### Scenario: Desktop — activating the info trigger reveals both lines

- **WHEN** the desktop info button is activated
- **THEN** a popover shows both explanations and remaining counts and closes on repeat activation, outside click, or Escape

#### Scenario: Mobile — both ratios present, explanation collapsed by default

- **WHEN** a mobile goal card has both ratios
- **THEN** its footer shows remaining text and an info affordance, collapsed initially

#### Scenario: Mobile — tapping the footer line expands the explanation inline

- **WHEN** the mobile footer is tapped
- **THEN** both explanation lines expand within the card and collapse on a second tap

#### Scenario: Only Actual Progress applies

- **WHEN** no Potential ratio is available because planning inputs are unavailable
- **THEN** only Actual fill and percent render, without an info trigger or invented Potential value

### Requirement: Remaining resource text uses a per-goal-kind formatter for Rank and Unlock goals with thousands separators

Wherever the goal progress display shows a still-needed resource text for a goal outside the list's Remaining column (the tooltip on the Progress column's percent readout or a screen-reader label), it SHALL use one formatter per goal kind: a Rank goal SHALL show "{{energy}} energy" when a farming energy estimate is available and no upgrade-slot count; an Unlock goal SHALL show "{{shards}} shards" (remaining shard need, per `goal-farming-estimates`' zero-once-owned rule). The Goals list's Remaining column itself renders chips per `goal-remaining-resources`. A level requirement's remaining text is defined by "A Rank or Ability goal's level requirement carries its own remaining text and explanation". Every number formatted by this requirement SHALL render with the locale's thousands separator.

Assumptions:

- This requirement only changes how an already-computed remaining count is formatted for display; it does not change any calculation in `goal-farming-estimates` or `computeGoalProgress`.
- A Rank goal with no farming energy estimate available (for example, no project context) SHALL show no remaining text from this requirement rather than a placeholder.

#### Scenario: Rank goal with both slots and energy available

- **GIVEN** a Rank goal has 9 upgrade slots remaining and a farming estimate of 1,674 remaining energy
- **WHEN** its remaining text renders in the progress tooltip
- **THEN** it reads "1,674 energy", with no slot count

#### Scenario: Unlock goal

- **GIVEN** an Unlock goal has 227 shards remaining
- **WHEN** its remaining text renders
- **THEN** it reads "227 shards"
