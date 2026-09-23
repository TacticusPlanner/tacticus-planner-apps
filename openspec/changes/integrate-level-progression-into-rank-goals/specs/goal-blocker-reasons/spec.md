## ADDED Requirements

### Requirement: Routine Rank leveling is not a separate restriction

A Rank goal SHALL NOT show a missing-Level or prerequisite-not-reached Restricted indicator solely because the character has not yet gained levels intrinsic to that Rank target. Its level gap SHALL be shown as remaining Rank progress. Real independent blockers, including absent player data, missing Unlock, insufficient Ascension, and an unreached non-level dependency, SHALL continue to appear under the existing blocker rules.

#### Scenario: Only routine level progress remains

- **GIVEN** Bellator's Rank target needs level 32 and Bellator is at level 31 with no other blocker
- **WHEN** the goal row renders
- **THEN** it shows remaining level/XP progress within Rank and no Restricted badge caused by missing Level

#### Scenario: Ascension blocker remains visible

- **GIVEN** the same Rank target also exceeds Bellator's current rarity cap
- **WHEN** the goal row renders
- **THEN** the Ascension-related restriction still appears
