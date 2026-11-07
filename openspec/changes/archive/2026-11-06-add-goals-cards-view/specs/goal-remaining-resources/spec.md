## ADDED Requirements

### Requirement: Orbs and Character ability badges show available/needed

For a goal in the plan, ascension orbs (per rarity, on an Ascension goal) and ability badges (per rarity, on a Character Ability goal) SHALL each render as an "available/needed" chip, the way V1 showed them ("16/20") and with the same pool logic as "Machine of War materials show available/needed": "needed" is the goal's own requirement, and "available" is the player's stock of that resource at the goal's turn in global priority order, not capped at needed. The chip renders even when the need is fully held. A goal that needs none of a resource shows no chip for it. A paused Character Ability goal shows its standalone need against the full stock; a paused Ascension goal, which is outside the orb allocation, shows its orb need as a plain quantity. The plan-wide missing totals (Insights) are unchanged: they still count only the shortfall.

#### Scenario: Orbs fully held

- **GIVEN** an Ascension goal needs 10 Rare orbs and the player holds 35 that no higher-priority goal claims
- **WHEN** its chips render
- **THEN** the Rare orb chip reads 35/10

#### Scenario: Character badges partly held, in priority order

- **GIVEN** two Character Ability goals of Xenos units need 27 and 5 Epic ability badges, and the player holds 30 Xenos Epic badges
- **WHEN** both render
- **THEN** the higher-priority goal's badge chip reads 30/27 and the lower-priority goal's reads 3/5, and Insights counts 2 Epic badges missing

## MODIFIED Requirements

### Requirement: Owned inventory is subtracted in priority order

A chip's quantity SHALL be what the goal still needs after the player's full inventory of that resource has been applied to goals in global priority order, the same shared-pool model the XP-book figure uses: a higher-priority goal consumes the owned stock first, and a lower-priority goal only sees what is left. This applies to shards. A resource whose need is fully covered by the stock available to the goal SHALL show no chip. Ability badges, forge badges, Machine of War components and ascension orbs use the same priority-ordered pool but show available/needed instead (see "Machine of War materials show available/needed" and "Orbs and Character ability badges show available/needed"). Gold SHALL NOT be netted against inventory (V1 parity). A goal that is paused is not part of the allocation and shows its standalone need.

#### Scenario: Fully held resource shows no chip

- **GIVEN** an Unlock goal needs 300 shards and the player holds 300
- **WHEN** its Remaining display renders
- **THEN** no shards chip is shown

#### Scenario: Partially held resource shows the shortfall

- **GIVEN** an Ascension goal needs 161 shards and the player holds none of them
- **WHEN** its Remaining display renders
- **THEN** the shards chip reads 161

#### Scenario: Orbs are netted

- **GIVEN** an Ascension goal needs 10 orbs and the player holds 10
- **WHEN** the plan's missing totals and the goal's chips render
- **THEN** Insights counts no orbs missing for it, and its orb chip reads 10/10
