## MODIFIED Requirements

### Requirement: Collection quick filters follow defined progression rules

The quick filters SHALL be Ready to rank up, Need to ascend, Can promote, Can ascend, Need to level, Blue star ready, Missing equipment and Abilities behind level. A quick filter SHALL match only owned units and SHALL be evaluated for each unit on its own, against the player's whole synced inventory (the same items count toward every unit). Each SHALL follow exactly the rule below; "maximum rank for its rarity" is Iron 1 for Common, Bronze 1 for Uncommon, Silver 1 for Rare, Gold 1 for Epic, Diamond 3 for Legendary and Adamantine 2 for Mythic, and "level cap for its rarity" is 8, 17, 26, 35, 50 and 60 respectively.

- **Need to ascend** (V1 rule extended to Mythic): an owned character whose rank equals the maximum rank for its rarity and that still has an ascension step ahead (every unit except one at Mythic wings). A Mythic character at Adamantine 2 below Mythic wings matches. Machines of War never match.
- **Need to level** (V1 rule, with V2's caps): an owned character that does not need to ascend and whose XP level is below the level cap for its rarity. Machines of War never match.
- **Can promote** (new in V2; V1 has no such filter): an owned character or Machine of War whose next step on the ascension ladder stays within its current rarity (one more star, or the next Mythic step) and whose held shards, mythic shards and ascension orbs cover that one step's cost. A unit on its rarity's last step (Common two stars, Uncommon four stars, Rare red one star, Epic red three stars, Legendary one blue star) never matches, since its next step is an ascension (see Can ascend); a unit at Mythic wings never matches.
- **Can ascend** (V1 rule extended to Mythic, with orbs): an owned character or Machine of War with an ascension step ahead whose held shards, mythic shards and ascension orbs all cover the ascension cost from its current step up to and including the target step. Below Mythic the target is the first step of the next rarity; for a Mythic unit it is the next Mythic step (two blue stars, three blue stars, then Mythic wings). A unit at Mythic wings never matches.
- **Blue star ready** (V1 rule, with orbs): an owned character or Machine of War below Legendary one blue star (and not Mythic) whose held shards and ascension orbs cover the ascension cost from its current step up to and including Legendary one blue star.
- **Missing equipment** (new in V2): an owned character with fewer equipped items than the equipment slots the catalog gives it. Machines of War never match.
- **Abilities behind level** (new in V2): an owned character with an active or passive ability level below its XP level, which is the cap on ability levels. Machines of War never match.
- **Ready to rank up** (new in V2; V1 has no such filter): an owned character below the maximum rank for its rarity, for which the player's upgrade inventory covers every base material needed by the upgrades of its current rank that are not applied yet. Each needed upgrade and each owned upgrade is broken down through its crafting recipe (recursively) into base materials before they are compared, so an already-crafted upgrade counts toward its materials. A character with all six slots of its current rank applied matches; a character whose current rank has no upgrade list in the catalog does not, since nothing could be checked. XP level is not checked.

Assumptions:

- Ascension cost per step is the catalog's ascension cost ladder (the shards, mythic shards and ascension orbs, with the orbs' rarity, needed to reach each step from the previous one); the cost of a path is the sum over the steps after the current one up to and including the target step, with orbs summed separately per orb rarity. At the time of writing that ladder is: Epic red two stars 65 shards; Epic red three stars 85 shards; Legendary red three stars 100 shards and 10 Legendary orbs; Legendary red four stars 150 shards and 10 Legendary orbs; Legendary red five stars 250 shards and 15 Legendary orbs; Legendary one blue star 500 shards and 20 Legendary orbs; Mythic one blue star 20 mythic shards and 10 Mythic orbs; Mythic two blue stars 30 mythic shards and 10 Mythic orbs; Mythic three blue stars 50 mythic shards and 15 Mythic orbs; Mythic wings 100 mythic shards and 25 Mythic orbs.
- Ascension orbs are spent from the player's synced orb inventory of the unit's own alliance (Imperial, Chaos or Xenos), at the rarity each step names.
- Machines of War ascend along the same ladder as characters and spend orbs of their alliance (as in V1).
- A Mythic character's maximum rank (Adamantine 2) does not change between Mythic steps; a Mythic character at Adamantine 2 is still listed by Need to ascend until it reaches Mythic wings.
- Applied upgrades of the current rank come from the synced roster's applied upgrade slots; the upgrades of every rank below the current one are applied.

#### Scenario: Can promote — worked example

- **GIVEN** an Imperial unit is owned at Legendary red three stars with 150 shards, and the player holds 10 Imperial Legendary orbs
- **WHEN** the Can promote quick filter is selected
- **THEN** the next step, Legendary red four stars, costs 150 shards and 10 Legendary orbs; both are covered and the unit is listed; with 9 Imperial Legendary orbs it is not; a unit at Epic red three stars is never listed, however many shards it holds

#### Scenario: Can ascend — worked example

- **GIVEN** Titus (Imperial) is owned at Epic red one star with 260 shards, and the player holds 10 Imperial Legendary orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the cost to Legendary red three stars is 65 (Epic red two stars) + 85 (Epic red three stars) + 100 (Legendary red three stars) = 250 shards and 0 + 0 + 10 = 10 Imperial Legendary orbs; 260 ≥ 250 and 10 ≥ 10, so Titus is listed; with 240 shards, or with 9 Imperial Legendary orbs, he is not

#### Scenario: Can ascend from Legendary needs mythic shards and both orb rarities

- **GIVEN** an Imperial unit is owned at Legendary red four stars with 800 shards and 15 mythic shards, and the player holds 40 Imperial Legendary orbs and 10 Imperial Mythic orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the path to Mythic one blue star costs 250 + 500 = 750 shards, 20 mythic shards, 15 + 20 = 35 Legendary orbs and 10 Mythic orbs; shards (800 ≥ 750) and orbs (40 ≥ 35, 10 ≥ 10) are covered but 15 < 20 mythic shards, so the unit is not listed

#### Scenario: Can ascend within Mythic

- **GIVEN** a Xenos unit is owned at Mythic one blue star with 35 mythic shards, and the player holds 10 Xenos Mythic orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the next step, Mythic two blue stars, costs 30 mythic shards and 10 Mythic orbs; 35 ≥ 30 and 10 ≥ 10, so the unit is listed; a unit at Mythic wings is never listed

#### Scenario: Orbs of another alliance do not count

- **GIVEN** an Imperial unit at Epic red one star with 260 shards, and the player holds 50 Chaos Legendary orbs and no Imperial Legendary orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the unit is not listed

#### Scenario: Blue star ready — worked example

- **GIVEN** a Chaos unit is owned at Legendary red three stars with 900 shards, and the player holds 45 Chaos Legendary orbs
- **WHEN** the Blue star ready quick filter is selected
- **THEN** the cost to Legendary one blue star is 150 + 250 + 500 = 900 shards and 10 + 15 + 20 = 45 Legendary orbs; both are covered and the unit is listed; with 44 Chaos Legendary orbs it is not; a unit already at Legendary one blue star or Mythic is never listed

#### Scenario: Need to ascend and Need to level

- **GIVEN** two owned Epic characters: one at Gold 1 with XP level 35, one at Silver 3 with XP level 30
- **WHEN** Need to ascend is selected, then Need to level
- **THEN** Need to ascend lists the Gold 1 character (Gold 1 is the Epic maximum) and not the other; Need to level lists the Silver 3 character (30 < 35, the Epic level cap) and not the Gold 1 one, which needs to ascend

#### Scenario: Need to ascend at Mythic

- **GIVEN** two owned Mythic characters at Adamantine 2: one at two blue stars, one at Mythic wings
- **WHEN** Need to ascend is selected
- **THEN** the two-blue-star character is listed and the Mythic wings character is not

#### Scenario: Ready to rank up — worked example

- **GIVEN** Arjac is owned at Legendary red three stars and Silver 1 (below Diamond 3, the Legendary maximum) with slots 1–4 of Silver 1 applied, so the unapplied upgrades are Ice Troll Hide (crafted from 9 Beast Hide) and Ceramite Sheet (crafted from 6 Subdermal Plating, 6 Ceramite Lump and 1 crafted upgrade made of 6 Fine Purity Seal)
- **AND** the player's inventory holds 1 Ice Troll Hide, 6 Subdermal Plating, 6 Ceramite Lump and 6 Fine Purity Seal
- **WHEN** the Ready to rank up quick filter is selected
- **THEN** the needed base materials are 9 Beast Hide, 6 Subdermal Plating, 6 Ceramite Lump and 6 Fine Purity Seal; the owned base materials are 9 Beast Hide (from the crafted Ice Troll Hide), 6, 6 and 6; every need is covered and Arjac is listed; with 5 Fine Purity Seal he is not

#### Scenario: Missing equipment and Abilities behind level

- **GIVEN** owned character A at XP level 45 with abilities 45 and 40 and two of its three equipment slots filled, and owned character B at XP level 30 with abilities 30 and 30 and every slot filled
- **WHEN** Missing equipment is selected, then Abilities behind level
- **THEN** both times only A is listed

#### Scenario: Quick filters skip unowned units

- **GIVEN** the player does not own Calgar but holds enough Calgar shards to cover the ascension cost from his starting step
- **WHEN** the Can ascend quick filter is selected
- **THEN** Calgar is not listed
