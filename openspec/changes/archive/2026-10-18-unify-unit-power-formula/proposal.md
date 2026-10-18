## Why

V1 now computes a unit's power with the game's own formula, and it matches the in-game power score exactly (V1 commit `cdeea3a`, `4-entities/unit/character-power`). V2 still uses V1's older heuristic (`characterCombatPower` in `@workspace/game-domain`). That heuristic ignores equipment, real upgrade stat values, weapons, traits and movement, and it is on a different scale from the game. So V2's power figures don't match the game, the Legendary Event clear-depth estimate compares two different units (heuristic team power against the game's battle power), and the Library pages show no power at all.

## What Changes

- Port V1's formula 1:1 into `@workspace/game-domain` as the single power calculation for characters, Machines of War and NPCs. It reads the catalog's unit, equipment and upgrade datasets plus the new `unit-power` dataset. **BREAKING** (V2 only): `characterCombatPower` and its V1-heuristic coefficients are removed, and every caller moves to the new functions.
- Character stats (Health, Damage, Armour) come from the same calculation: base stats plus the stat increases of every completed rank's upgrades and the applied current-rank upgrades, scaled by the progression multiplier. This replaces V2's rank and star growth approximation (`statAtRank`) on the character unit page. Equipment is counted in power, not in the shown stats.
- Library character unit page: shows the unit's **power** in the header at the shown values (Your unit, Starting or Custom rarity, stars and rank, the ability panel levels and the relic level). At a glance and Stats by rank use the exact stats.
- Library MoW unit page: shows **power** at the shown rarity and stars and the Primary and Secondary panel levels.
- NPC library: shows **power** for the selected level row, computed with the same formula.
- Legendary Events: unit and team power for the clear-depth estimate, Goals Preview, Upgrade impact and Team suggestions use the new formula. Battle power stays the catalog value, which is the game's own number. This was the user's decision on the card: "Catalog power". The power ratio stays 1, still marked uncalibrated, because both sides are now in-game power.
- Legendary Event team cards show the **total team power**: the sum of the non-reserve members' power.
- Dailies team recommendations (strength ordering, Arena, Onslaught) rank by the new power, including equipment.

Companion change: **`unify-unit-power-formula`** in `tacticus-planner-api`. It serves the `unit-power` dataset and applies first.

## Capabilities

### New Capabilities

- `unit-power`: power of a Machine of War and of an NPC level row from the shared in-game formula, character stats from that formula, and the rule that every power figure in the app comes from it.

### Modified Capabilities

- `character-combat-power`: the character estimate becomes the game's own power formula (stats, weapons, crit/block, abilities, relic, traits, movement, unit multiplier), including equipment, instead of V1's rank, star and ability heuristic.
- `legendary-event-clear-estimates`: effective power is built on the new character power. The worked examples and the equipment assumption change.
- `legendary-event-goals-preview`: preview power uses the new formula. The worked examples change.
- `legendary-event-upgrade-impact`: step power uses the new formula. The worked example changes.
- `legendary-event-teams`: the team card shows total team power.
- `character-unit-details`: the page shows power at the shown values, and stats use the exact game calculation. The worked examples change.
- `mow-unit-details`: the page shows power at the shown values.
- `npc-library`: the detail view shows power for the selected level.

## Impact

- `packages/game-domain`: new `unit-power` module replacing `combat-power.ts`, plus the V1 parity tests.
- `packages/game-catalog`: schema, payload type and IndexedDB sync for the `unit-power` dataset.
- `apps/web`: a shared `entities/unit-power` slice that loads the catalog inputs and adapts roster, catalog and NPC records. Consumers: `entities/legendary-event` (`unit-combat-power.ts`, `clear-estimate.ts`), `pages/dailies` (`team-eligibility.ts`), `pages/library` (character unit, MoW unit, NPC detail), and the LE team card.
- i18n: new keys for the power labels in every locale (en, de, es, fr).
- Depends on the API companion being deployed: until the `unit-power` dataset is present, power figures show as unavailable and clear-depth estimates behave as when their inputs are missing.
