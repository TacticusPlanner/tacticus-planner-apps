## ADDED Requirements

### Requirement: Selected Mythic-material shop offers supply that material's need

For a Rank, Upgrade, or Machine-of-War Ability goal, each Mythic-material shop offer the goal uses
(its explicit selection, or every available offer when it has none — see
`goal-mythic-material-sources`) SHALL be simulated as an energy-free per-day supplier of that
material, with the same expected-value rule as a shard shop offer: on each weekday the offer can
appear it supplies amount-per-purchase × maximum purchases per day × the chance its slot resolves to
this material that weekday, and zero on other weekdays. It SHALL be applied to the goal's current
farming stage before that day's campaign energy, alongside any campaign farming of the same
material, SHALL NOT consume energy or add raids, and its currency cost SHALL NOT block or alter
the estimate. A Mythic material with no eligible campaign node SHALL NOT be reported as unavailable
while at least one used offer supplies it. Contributions SHALL be attributed per offer as for shard
shop offers. Estimates SHALL be anchored to the goal's current progression and expressed in the
material's own item count.

Assumptions:

- Purchases are 1 item each for the four Mythic materials in the current catalog.
- Expected values may be fractional; the simulation treats them as continuous amounts.
- Within one day, offers are applied in a stable order by offer id.

#### Scenario: Ragnar's Venerable Battle Mark (worked example)

- **GIVEN** a Ragnar Rank goal whose current stage still needs 6 Venerable Battle Mark after
  inventory, no eligible campaign node for it, a roster owning a blue-star unit, no saved
  selection (so the Guild, Crusade, and Rogue Trader offers are used), no other goal using those
  offers, and the reference date Monday 2026-10-05
- **WHEN** the estimate is computed
- **THEN** the simulation proceeds:
  - Day 1 (Mon): no offer appears; remaining 6
  - Day 2 (Tue): Crusade supplies 3 × 1 × 1 = 3 (remaining 3), Guild supplies 2 × 1 × 1 = 2
    (remaining 1)
  - Days 3–5 (Wed–Fri): no offer appears; remaining 1
  - Day 6 (Sat): Crusade supplies 3 × 0.25 = 0.75 (remaining 0.25), Guild supplies the remaining
    0.25 of its 2 × 0.25 = 0.5
- **AND** the Venerable Battle Mark requirement is met on Day 6 (2026-10-10), attributed 3.75 to
  Crusade, 2.25 to Guild, and 0 to Rogue Trader, with no energy or raids spent on it

#### Scenario: Opt-out leaves the blocker

- **GIVEN** the same goal saved with an explicit empty Mythic-material selection
- **WHEN** the estimate is computed
- **THEN** Venerable Battle Mark ×6 is reported as unavailable and the goal has no finite
  completion date

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
- **THEN** each goal's shard supply is the same as before this change
