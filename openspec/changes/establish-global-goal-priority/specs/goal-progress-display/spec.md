## MODIFIED Requirements

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation

Where Actual and Potential ratios render together, their explanation SHALL be reachable without hover. At or above 768px it SHALL use an explicit info-triggered popover; below 768px tapping the remaining-text line SHALL expand it inline. Actual SHALL describe synced/owned state and its remaining count. Potential SHALL describe applying owned resources after globally higher-priority Active goals reserve their share, state that it does not change actual status, and show its remaining count. The explanation SHALL not describe a selected project as a separate allocation pool. The same disclosure applies in goal list, project detail, and goal detail, at most once per ratio. With no Potential ratio, only Actual appears and no explanation trigger is required.

#### Scenario: Both bars render in the compact goals list

- **WHEN** a desktop goal row has Actual and Potential ratios
- **THEN** its stacked bar, percent, and info button render with explanations hidden until activation

#### Scenario: Both bars render on a project detail card

- **WHEN** a desktop project goal has both ratios
- **THEN** it uses the same info disclosure and global-priority explanation as Global Plan

#### Scenario: Both bars render in the goal-detail sheet

- **WHEN** goal detail has both ratios
- **THEN** the breakpoint-appropriate disclosure appears once, without duplicate explanation lines

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

#### Scenario: A Level goal's explanation carries its own remaining-levels and remaining-XP figures

- **WHEN** the info disclosure opens for a Level goal
- **THEN** Actual notes remaining levels and Potential notes globally allocated remaining XP

### Requirement: Level goal Potential progress reflects owned XP books, shared by priority

A Level goal's Potential ratio SHALL use the highest level reachable with the account's owned XP books after globally higher-priority Active Level or Rank goals reserve books in the one account-wide plan. Books are indivisible and SHALL not be counted for another goal after use, even if their XP value exceeds the first goal's remaining need. Project membership and project filtering SHALL not restart the pool. Where the global plan is available, Potential SHALL be available on flat Goals surfaces too; where plan inputs are unavailable, it SHALL be absent rather than fabricated.

Assumptions:

- A Legendary XP book contributes 12,500 XP; books apply all-or-nothing.
- Rank goals' integrated XP need from `integrate-level-progression-into-rank-goals` competes for the same pool.

#### Scenario: Owned books fully cover a Level goal's own xp need

- **GIVEN** a Level goal needs 22,000 XP and two unreserved Legendary books supply 25,000 XP
- **WHEN** Potential is computed
- **THEN** two books cover the target and no 3,000 XP surplus is transferable

#### Scenario: Owned books partially cover a Level goal's own xp need

- **GIVEN** a Level goal needs more XP than unreserved books supply
- **WHEN** Potential is computed
- **THEN** it reflects the highest level actually reachable, never a negative value or the full target by assumption

#### Scenario: A higher-priority Level goal claims the shared pool first

- **GIVEN** two goals each need 22,000 XP and only two Legendary books exist
- **WHEN** the higher-priority goal receives both books globally
- **THEN** the lower-priority goal receives none and its Potential equals Actual, even if the goals are in different projects

#### Scenario: No books owned

- **WHEN** a Level goal needs XP and the account owns no XP books
- **THEN** its Potential equals its Actual ratio
