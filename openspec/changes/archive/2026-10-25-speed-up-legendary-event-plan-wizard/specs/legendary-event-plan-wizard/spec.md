# Spec Delta

## ADDED Requirements

### Requirement: Run-input edits settle before they are planned

A run-input change on the Target step SHALL update its control at once, and SHALL reach the verdicts and the upgrade search only after 400 ms with no further run-input change.

Assumptions:

- 400 ms covers a burst of stepper clicks yet still feels immediate.

#### Scenario: Several stepper clicks restart the search once

- **GIVEN** Five stars shows "Needs upgrades · 2,100 points short with your roster"
- **WHEN** the user raises Plan to complete for run 3 by four clicks, 150 ms apart
- **THEN** the field shows each new value at once
- **AND** the search restarts once, 400 ms after the fourth click

### Requirement: Verdicts being rechecked keep their last value

While run inputs settle or the search runs again, each step that was not Reachable now SHALL keep its last verdict and points shown, dimmed, with the **Checking** badge, instead of dropping them. A Reachable now step SHALL show **Checking** too once new inputs lower the synced ceiling below its target.

#### Scenario: Last verdict stays visible

- **GIVEN** Five stars shows "Needs upgrades · 2,100 points short with your roster"
- **WHEN** the user changes a run input
- **THEN** Five stars keeps "2,100 points short" dimmed with **Checking** until its verdict settles on the new inputs

### Requirement: Create waits only for the chosen target

Create on the Review step SHALL be enabled as soon as the chosen target's recommendations are final (`legendary-event-plan-generation`), without waiting for the rest of the search, and the Upgrades step SHALL stop saying "Still looking for upgrades…" at that moment. The other steps' verdicts and the "highest step within reach" line SHALL keep **Checking** until the search has ended.

#### Scenario: Create available before the search ends

- **GIVEN** the chosen target is Unlock, and its recommendations are final while the search is still settling Blue star
- **WHEN** the user reaches Review
- **THEN** Create is enabled and pressing it files Unlock's goals
- **AND** the Target step still shows **Checking** for Blue star

#### Scenario: Reachable now needs no search

- **GIVEN** the chosen target is Reachable now with the synced roster
- **WHEN** the wizard opens
- **THEN** the Upgrades step shows "Your roster already reaches the target: no upgrades needed." and Create is enabled on Review without waiting for the search
