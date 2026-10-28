## MODIFIED Requirements

### Requirement: Next upgrade steps of a team member

For a unit, the planner SHALL list its **next steps**:

- **Unlock**, when the synced roster lacks the unit, to its base state (`legendary-event-goals-preview`);
- **Rank**, when owned, to the next rank on the ladder with 0 applied upgrades, only when that rank is at most `maxRankForProgression` of the unit's current progression;
- **Ascension**, when owned, to the next step of `progressionOrder`, unless the unit is at the last step.

Ability levels and equipment are unchanged by every step.

Assumptions:

- A rank-up starts the new rank with no applied upgrades.
- The highest rank a rarity allows is Iron1 for Common, Bronze1 for Uncommon, Silver1 for Rare, Gold1 for Epic, Diamond3 for Legendary and Adamantine2 for Mythic.
- Ascension advances one step of the 20-step progression path (a star or a rarity).

#### Scenario: Rarity-capped rank

- **GIVEN** Tigurius owned at Gold1, Epic:RedTwoStars
- **WHEN** his next steps are listed
- **THEN** they are Ascension to Epic:RedThreeStars only, because Gold1 is the highest rank Epic allows

#### Scenario: Locked unit

- **GIVEN** Certus is not in the roster
- **WHEN** his next steps are listed
- **THEN** the only step is Unlock, to Stone1, Common:None
