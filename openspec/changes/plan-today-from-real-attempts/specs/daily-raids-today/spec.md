# Spec Delta

## ADDED Requirements

### Requirement: Today's plan is what is left to raid today

Today's plan SHALL be planned from the player's real state today: each node's raids SHALL be capped at its real attempts left today (a node with no synced attempt data keeps its full daily cap), and the plan SHALL spend only the daily energy limit less the real energy spent today (floored at 0). A material whose every node has no attempts left today SHALL NOT be planned today; its energy SHALL go to the next materials in goal-priority order. With no synced attempts Today SHALL plan as before.

#### Scenario: Top goal's node is raided out today

- **GIVEN** the priority 1 goal needs a material whose only node has 0 attempts left today, the priority 2 goal has nodes with attempts left, and energy is left today
- **WHEN** Today renders
- **THEN** Today's plan lists the priority 2 goal's raids within the energy left, and the Raids Plan schedules the priority 1 goal's material on Day 2
