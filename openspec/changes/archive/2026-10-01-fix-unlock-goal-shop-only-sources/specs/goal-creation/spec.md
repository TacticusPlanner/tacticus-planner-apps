## ADDED Requirements

### Requirement: Unlock is offered when a Character has any shard source

The Unlock goal type SHALL be selectable for a Character that is not already owned when the
unit has at least one campaign shard-farm node OR at least one regular (non-mythic) shop shard
offer. A shop-only unit (no campaign nodes) SHALL NOT have Unlock disabled. The "no catalog
shard locations" explanation SHALL be shown only when the unit has neither a campaign node nor
a regular shop shard offer. A Machine of War not already owned SHALL keep its existing
behaviour: Unlock is offered.

#### Scenario: Shop-only character

- **GIVEN** an unowned Character with no campaign shard-farm nodes and a regular shard offer in a daily shop
- **WHEN** the goal creation form is opened for that Character
- **THEN** the Unlock goal type is selectable and no "no catalog shard locations" message is shown

#### Scenario: Shop-only offers appear as Unlock sources

- **GIVEN** the same shop-only Character with Unlock selected
- **WHEN** the acquisition-source control renders
- **THEN** the Shops group lists the unit's regular shard offers and the Campaigns group is not rendered

#### Scenario: No source at all

- **GIVEN** an unowned Character with no campaign shard-farm nodes and no regular shop shard offers
- **WHEN** the goal creation form is opened for that Character
- **THEN** Unlock is disabled and the "no catalog shard locations" message is shown

#### Scenario: Mythic-only shop offers do not enable Unlock

- **GIVEN** an unowned Character with no campaign nodes whose only shop offers are mythic shards
- **WHEN** the goal creation form is opened
- **THEN** Unlock is disabled, since unlocking always consumes regular shards
