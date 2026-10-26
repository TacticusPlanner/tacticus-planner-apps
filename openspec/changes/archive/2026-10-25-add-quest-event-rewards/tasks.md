# Tasks

Apps only; no companion API change. Depends on `add-quest-event-tracker`.

## 1. Rewards

- [x] 1.1 Implement `questRewards` (crates opened, next crate, shards earned, max and reachable, bundle) and the shard walk, and verify with unit tests for the bundle-on and not-owned scenarios and an owned hero two stars from the next rarity
- [x] 1.2 Add `bundle` to the storage entry, and verify reload and the default off
- [x] 1.3 Build the rewards card (crate track, shards, meaning, Create or Open goal) with the desktop and mobile placement, and verify with component tests for the next-crate, crates-failed and existing-goal scenarios

## 2. Token plan

- [x] 2.1 Implement `questTokenPlan` (attempts left with and without an entry, battles to improve, spare or short, bank-full time) and verify with unit tests for the entered-tokens, no-entry, bank-fills and preview scenarios
- [x] 2.2 Add the tokens entry to storage and build the card, and verify with component tests for the claim-window and preview states

## 3. Page, tour and i18n

- [x] 3.1 Place both cards per the specs, add tour steps on both viewports, and add the copy in en, de, es and fr; verify with the tutorial test and the i18n key-parity test

## 4. Verification and gates

- [x] 4.1 Desktop (1280px) and mobile (420px) with Nubari running: bundle toggle, Create goal prefill, tokens entry and bank-full warning; no horizontal scroll
- [ ] 4.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all clean

## Workflow follow-up

- Archive this change in the PR before merge.

## Implementation notes

- 1.1: `questRewards` is split into `crateTrack`, `questShards` and `shardMeaning` in `features/quest-event/model/quest-rewards.ts`; the goal action (`questGoalAction`) lives in `pages/dailies/model` since it reads `entities/goal`.
- 4.1: passed 2026-10-26 at 1280 and 420 (same-origin iframe), synced account, Nubari made running with a temporary dev-only clock offset (removed): the bundle triples earned, max and projected shards, Create goal opens prefilled (Nubari, Ascension to the covered step), tokens give attempts, a full bank shows the warning.
- 4.2: as for the tracker's 6.1.
