## Purpose

Shows independently ordered Rank milestones for one character while deriving material, XP, and raid needs without charging overlapping progression twice.

## ADDED Requirements

### Requirement: Distinct Rank milestones remain separate goals

Goals and project views SHALL show each in-flight Rank target for a character with its target label, own id, status, memberships, and actions. A user SHALL be able to reorder, pause/resume, and delete each independently. An exact active target conflict SHALL identify and open the existing goal; deleting it SHALL permit a fresh creation after server confirmation.

#### Scenario: Two targets in one project

- **GIVEN** Bellator has Silver3 and Gold1 Rank goals in one project
- **WHEN** the project list renders
- **THEN** both target labels and independent reorder/status/delete actions are present

#### Scenario: Recreate after delete

- **WHEN** the user deletes Bellator Silver3 and creates Silver3 again
- **THEN** the new goal appears with a new identity and no stale membership or status from the deleted goal

#### Scenario: Concurrent duplicate feedback

- **WHEN** two sessions submit Bellator Silver3 into the same project
- **THEN** one succeeds and the other shows a conflict naming the existing Silver3 goal without discarding its creation draft

### Requirement: Overlapping Rank progression is allocated once

For each unit in the effective plan, the planner SHALL derive progression intervals from synced current rank/slots/level to each ordered Rank end target. Each material occurrence, level-XP interval, and owned resource SHALL be assigned to at most one milestone, in effective priority order. A later target that is wholly covered by earlier allocated work SHALL remain a distinct goal but have no additional farmable demand; it SHALL not be marked actually completed until synced progression reaches its own target. Detailed rows and aggregate totals SHALL use the same interval allocation.

Assumptions:

- Rank upgrade-slot recipes and character level thresholds come from the current catalog/domain ladder; crafting/inventory netting and daily energy/attempt caps follow `goal-farming-estimates`.
- A raid's expected yield and energy are calculated by the existing estimator, not by a new Rank-specific formula.

#### Scenario: Worked overlapping Bellator intervals

- **GIVEN** Bellator is at Silver2, a priority-1 Silver3 milestone needs 2 occurrences of material A and 12,200 XP, and a priority-2 Gold1 milestone spans those same 2 occurrences plus 3 later occurrences of A and 20,000 further XP; no inventory is owned
- **WHEN** the plan demand is calculated
- **THEN** Silver3 is assigned 2 A and 12,200 XP, Gold1 is assigned only 3 additional A and 20,000 additional XP, and the aggregate is 5 A and 32,200 XP rather than 7 A and 44,400 XP

#### Scenario: Higher target ordered first covers lower target need

- **GIVEN** Gold1 precedes Silver3 for the same character
- **WHEN** the plan is calculated
- **THEN** Gold1 claims the progression through Gold1 once, Silver3 has zero additional demand, and Silver3 remains uncompleted until actual synced rank reaches Silver3

#### Scenario: Shared project membership is not duplicate work

- **GIVEN** the same canonical Silver3 goal belongs to two projects
- **WHEN** a plan is built
- **THEN** its material/XP demand is counted once, not once per project label
