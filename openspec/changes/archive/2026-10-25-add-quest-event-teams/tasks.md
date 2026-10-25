# Tasks

Apps only; no companion API change. Depends on `add-quest-event-tracker`.

## 1. Shared predicates

- [x] 1.1 Move the summoner set to `entities/character` and expose `characterDealsDamageType` to `features/quest-event` per design D3, and verify that the HRE and LE tests pass unchanged

## 2. Capped power

- [x] 2.1 Implement `capUnitState` and `featuredHeroState`, and verify with unit tests for the ability clamp, the item level clamp, a rank lowered by the progression cap, the below-cap case and the 1.2 featured factor

## 3. Eligibility and selection

- [x] 3.1 Implement eligibility (factions, MoWs, every restriction, unreachable objectives) and verify with a unit test per objective type plus the no-Psyker and featured-breaks-restriction scenarios
- [x] 3.2 Implement the selector (top N, tie-break, `DamageType` swap) and objective badges, and verify with the five-slot, damage-type swap and nobody-eligible scenarios

## 4. UI

- [x] 4.1 Build the team section and badges in the battle detail (desktop) and the bottom sheet (mobile), the short-roster, unsynced and power-unavailable states, the tour step and the copy in en, de, es and fr; verify with component, tutorial and i18n parity tests

## 5. Verification and gates

- [ ] 5.1 Desktop (1280px) and mobile (420px) with a synced account and Nubari: check battles 4, 11 and 17 and an unreachable objective
- [ ] 5.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all clean

## Workflow follow-up

- Archive this change in the PR before merge.

## Implementation notes

- 1.1: there is no `entities/character` slice, so the summoner set moved to `entities/unit/model/summoners.ts`, and `unitDealtDamageTypes` (the damage-profile exclusions) is exported from `entities/legendary-event`.
- 2.1: the 1.2 featured factor is an optional `statFactor` on `game-domain`'s `CharacterPowerState`, applied to Health, Damage and Armour before items, so `characterPower` stays the one formula.
- 5.1 was not run (needs the Aspire stack and a synced account).
- 5.2: as for the tracker, only `pnpm lint:fsd` is open.
