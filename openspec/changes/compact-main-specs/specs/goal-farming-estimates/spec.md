## MODIFIED Requirements

### Requirement: A Machine-of-War Ability goal costs every advancing ability track

For a Machine-of-War Ability goal, the farming demand and resource-cost derivation SHALL
account for **every** ability track whose target is above its start, not only the first.
When both the primary and secondary tracks advance in one goal, the derived material needs,
farming stages, and any day-by-day estimate SHALL include the level transitions of both
tracks. A goal that advances only one track SHALL be costed for that track only.

#### Scenario: Both tracks advance

- **GIVEN** a Machine-of-War Ability goal whose primary track runs from level 3 to level 6
  and whose secondary track runs from level 2 to level 5
- **WHEN** the goal's material needs and farming stages are derived
- **THEN** the result includes the badge and component needs for the primary 3→6
  transitions and for the secondary 2→5 transitions

#### Scenario: Only one track advances

- **GIVEN** a Machine-of-War Ability goal whose primary track runs from level 3 to level 6
  and whose secondary track starts and ends at level 2
- **WHEN** the goal's material needs are derived
- **THEN** the result covers only the primary 3→6 transitions

#### Scenario: Estimate reflects both tracks

- **GIVEN** a Machine-of-War Ability goal advancing both tracks and a farming strategy that
  splits the range into stages
- **WHEN** the day-by-day completion estimate is computed
- **THEN** the estimate reflects the combined material demand of both tracks rather than a
  single track's demand

### Requirement: Resource need for an already-attained goal target is zero

Once the player's synced state already satisfies a goal's configured target, that goal's derived resource need SHALL be zero, regardless of any inventory amount that would otherwise be netted against a nonzero catalog cost. This applies starting with the Unlock goal type, whose resource need previously ignored whether the character was already owned and derived a need from shard inventory alone.

Assumptions:

- Unlock shard catalog cost is keyed by the character's initial rarity.
- "Already owned" for an Unlock goal means the character is present in the player's synced roster.

#### Scenario: Character is already unlocked

- **GIVEN** an Unlock goal for a character whose initial rarity carries a catalog cost of 40 unlock shards, the player owns 5 shards of that resource in inventory, and the character is already present in the player's owned roster
- **WHEN** the goal's resource need is derived
- **THEN** the derived shard need is 0, not the 35 shards that netting 40 against 5 owned would otherwise produce

#### Scenario: Character is not yet unlocked

- **GIVEN** the same Unlock goal, the same 40-shard catalog cost, and the same 5 owned shards, but the character is not present in the player's owned roster
- **WHEN** the goal's resource need is derived
- **THEN** the derived shard need is 35 (40 required minus 5 owned)

### Requirement: Within a goal's turn, the longest-to-finish material is farmed first

When a goal farms on a simulated day, the system SHALL spend that goal's share of the daily energy on its still-unfinished materials in descending order of time to finish, as V1 does (`sortLocationsForRaiding`). A material's time to finish SHALL be its remaining count divided by the items per day its selected farm nodes can yield, where each node yields at most the smaller of what the daily energy budget affords and what its daily attempt cap allows, times its drop rate. Ties SHALL keep the material's existing order. A material's nodes SHALL be spent in their existing node order. This ordering SHALL NOT change goal-priority order across goals, the per-battle daily attempt caps shared across every goal and material, inventory allocation, or the set of farm nodes selected.

Assumption: the daily energy budget used for time to finish is `planningSettings.dailyEnergy`, not the energy left after higher-priority goals.

#### Scenario: A capped bottleneck material is farmed before a cheap one

- **GIVEN** a 100-energy day and one goal needing material A (30 remaining) from a 5-energy node capped at 4 attempts (drop rate 1) and material B (30 remaining) from a 10-energy node with no binding cap
- **WHEN** Day 1 is simulated
- **THEN** the goal farms material A first (4 raids, 20 energy) and then material B with the remaining energy
- **AND** material A's time to finish (30 / 4 = 7.5 days) is longer than material B's (30 / 10 = 3 days)

#### Scenario: Bottleneck-first finishes a mixed goal sooner

- **GIVEN** a goal whose cheap materials are uncapped and whose expensive materials are capped per node, at 538 energy per day
- **WHEN** the goal is estimated
- **THEN** it completes no later than under cheapest-node-first ordering
- **AND** for the Neurothrope fixture it completes in 3 days rather than 5

#### Scenario: Equal time to finish keeps the existing order

- **GIVEN** two materials with equal time to finish
- **WHEN** a day is simulated
- **THEN** they are farmed in their existing material order

#### Scenario: Cross-goal order and shared caps are unchanged

- **GIVEN** two goals with different global priorities that farm the same node
- **WHEN** a day is simulated
- **THEN** the higher-priority goal is still spent first, and both goals draw on the same per-battle daily attempt cap

### Requirement: A shop offer's daily capacity is shared across goals in priority order

When several goals are estimated together (Goals/Insights plan figures, Today, Raids Plan), each
shop offer's supply on a simulated day SHALL be one pool shared by every goal that uses that
offer. Goals SHALL draw from it in canonical global priority order; each goal SHALL take at most
what it still needs and at most what higher-priority goals left that day. Unused capacity SHALL NOT
carry over to the next day. This SHALL apply to Mythic-material offers and to shard offers alike
(a shard offer is shared only by goals of its own unit, such as that unit's Unlock and Ascension
goals). A single-goal estimate such as the
goal-creation preview SHALL treat the goal as the only user of its offers.

Assumption: a shop's daily purchase cap is per account, not per goal.

#### Scenario: Two goals share Venerable Battle Mark offers (worked example)

- **GIVEN** the Ragnar goal from the worked example above at priority 1, and a Dreadnought
  (`ultraDreadnought`) Ability goal at priority 2 that needs 3 Venerable Battle Mark after
  inventory, with no eligible campaign node and the same default offers, reference date Monday
  2026-10-05
- **WHEN** the plan is computed
- **THEN** the shared pools are consumed:
  - Day 2 (Tue): Ragnar takes Crusade 3 and Guild 2 (remaining 1); both pools are empty, so
    Dreadnought gets 0 (remaining 3)
  - Day 6 (Sat): Ragnar takes Crusade 0.75 and Guild 0.25 (done); Dreadnought takes the Guild
    pool's remaining 0.25 (remaining 2.75)
  - Day 7 (Sun): Dreadnought takes Crusade 0.75, Guild 0.5, and Rogue Trader 1 (remaining 0.5)
  - Day 9 (Tue): Dreadnought takes 0.5 of Crusade's 3 (done)
- **AND** Ragnar's Venerable Battle Mark requirement is met on Day 6 (2026-10-10) and the
  Dreadnought's on Day 9 (2026-10-13), not on Day 2 as it would be if each goal had the offers to
  itself

#### Scenario: Single-goal preview ignores other goals

- **GIVEN** the same two goals exist and the user previews a new Dreadnought goal in the creation
  dialog
- **WHEN** the preview estimate is computed
- **THEN** it treats the Dreadnought as the only user of the offers

#### Scenario: Shard offers are unaffected

- **GIVEN** two goals for different units, each using its own unit's shard shop offer
- **WHEN** the plan is computed
- **THEN** each goal draws only on its own unit's shard offer, unreduced by the other goal
