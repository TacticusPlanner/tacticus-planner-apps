# Proposal

## Why

Every Quest Event battle has hard lineup rules (the featured hero always deploys, only a few factions are allowed, and every unit is clamped to the tier's rarity cap) and bonus objectives that restrict the lineup further ("no Psyker", "at most 3 hits", "no summons"). V1 shows these rules but never applies them to the roster, so players work out by hand who they can bring and at what strength. V2 already has the pieces: synced roster, the shared unit power formula, the damage-profile exclusions and the HRE summoner set.

## What Changes

- **Team per battle** in the battle detail: the featured hero pinned, plus the strongest eligible owned characters up to the battle's deploy slots.
- **Hard rules**: only allowed factions; MoWs left out; every unit's power computed at the tier's cap, with stars and rank, ability levels and item levels clamped (items drop to the cap rarity's maximum item level). The featured hero is always at the cap with +20% health, armour and damage, owned or not.
- **Objective filters**: `NotTrait`, `NotFaction`, `NotDamageType`, `HasRangedAttack`, `MaxHits`, `MinHits`, `UseNoSummons` and `DoNoHealOrRepair` narrow the eligible units; `DamageType` makes sure one member deals that type. Damage types go through the damage-profile exclusions.
- **Objective badges**: each objective shows whether the team meets it, "unreachable" when the featured hero itself breaks it (the objective is then not used as a filter), or "depends on play" for `NoDamageTakenByAnyHero`.
- Short-roster notices when fewer eligible units exist than the slots need.

## Capabilities

### New Capabilities

- `quest-event-teams`: capped unit power, eligibility (hard rules and objectives), team selection with the pinned featured hero, objective badges and the notices.

### Modified Capabilities

None.

## Impact

- Apps only; no companion API change. It reads `quest-events`, the synced roster and the unit power inputs already served.
- Depends on `add-quest-event-tracker` (battle detail). The capped power and eligibility are reused by `add-quest-event-clear-estimates`.
- `features/quest-event/model` (capped power state, eligibility, selection in `.ts`), the team section in the battle detail. It reuses `shared/unit-power`, `game-domain` caps, `characterDealsDamageType` and its exclusions, and the summoner set from `features/team-recommendations` (moved to an entity so a sibling feature can read it; see design D3).
- `quest` locales in four languages; a tour step.
