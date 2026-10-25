# Design

## Context

- `character-combat-power` (`game-domain` `characterPower`, `shared/unit-power`) takes rank, progression, slots, ability levels and items, so a capped state is just a clamped input.
- `game-domain` has `abilityCapByRarity`, `maxRankForProgression` and the progression steps; the served equipment items carry their per-rarity level ladder.
- `characterDealsDamageType` and the damage-profile exclusions live in `entities/legendary-event/lib`. The HRE summoner set lives in `features/team-recommendations/model/hre-summoners.ts`.
- The shared team engine (`features/team-recommendations`) has XP mode, random teams, locks and pool widening. Quests need none of these.

## Goals / Non-Goals

**Goals:** a believable team per battle, with the rules visible, and the same capped power the clear estimates will use.

**Non-Goals:** clear estimates (next change), MoWs, a Random team, editing or saving quest teams.

## Decisions

### D1. Capped power is a state transform, not a new formula

`capUnitState(state, rarity, equipment)` returns a clamped `CharacterPowerState`, and `featuredHeroState(unit, rarity)` returns the loaner state with the 1.2 stat factor. Both feed the existing `characterPower`. One formula serves the whole app, as `character-combat-power` requires.

### D2. A small selector instead of the shared engine

Selection is "pinned hero, then top N by capped power, then one `DamageType` swap", a pure function over eligible units. The shared engine's XP mode, random team, locks and pool widening do not apply, and adding a "pinned unit" and "power override" to it would widen a spec for one caller.

- _Alternative:_ extend `dailies-team-recommendations` with pinned units. That was rejected for now. If a second caller needs pinning, the selector can move into the engine.

### D3. Shared predicates move to entities

`features/quest-event` cannot import a sibling feature. The summoner set moves from `features/team-recommendations` to `entities/character` (HRE keeps reading it from there), and `characterDealsDamageType` with its exclusions is exported through the `entities/legendary-event` public API or moved to `entities/character`, whichever `rehome-feature-logic` leaves cleaner. No behaviour changes for HRE or LE.

### D4. An unreachable objective stops filtering

If the featured hero breaks a restriction, no team can meet it, so filtering the other units would only weaken the team for nothing. The badge tells the player to skip those points.

## Risks / Trade-offs

- [Weapon or trait reads misjudge a unit] → unit tests pin known cases per objective type, and the badge shows the result so a player can see it.
- [The cap clamp differs in game] → the clamp is one function and the spec states the assumption.
- [Power ignores synergy] → the same limit as LE estimates; the next change labels estimates uncalibrated.
