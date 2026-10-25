## Why

Faction Focus gives 2x XP and event points in Arena, Tournament Arena, Onslaught and Salvage Run, and its served trackers already allow `TournamentArena` (1 + 2 = 3 points per battle, the same as Arena). The HSE points projection only covers the three synced token modes, so every Tournament Arena battle the player plans to fight is missing from the projected points and the required average per token. The Tacticus player API does not expose a Tournament Arena token bucket (`progress` has `arena`, `guildRaid`, `onslaught` and `salvageRun` only), so the tokens cannot come from the sync.

## What Changes

- Add Tournament Arena as an HSE projection token mode, shown between Arena and Onslaught whenever a scoring tracker's `gameModes` pass it.
- Its tokens are entered by the player (a whole-number input in the tokens column, default 0) instead of computed from a synced bucket; a note says those tokens are not synced and asks for the number the player will spend.
- Entered tokens persist per browser per instance (`tp.dailies.hse.tokens.v1`), like milestone progress.
- Its default average is 5 kills per token for kill-based events (the Arena estimate) and fixed at 1 for battle-based events.
- HSE event teams are unchanged: Tournament Arena gets no team of its own, the Arena team plays it.
- New strings (token input label, note, tour copy) in en, de, es and fr.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hse-points-projection`: Tournament Arena is projected from player-entered tokens.

## Impact

`features/home-screen-event-points` (`lib/hse-token-supply.ts`, `lib/hse-projection.ts`, `model/hse-event-points.ts`, `model/use-hse-projection-inputs.ts`, `ui/points-projection*.tsx`) and their tests; `features/team-recommendations` (team modes exclude Tournament Arena); `dailies.json` in every locale. No API, catalog or player-data change; no companion `tacticus-planner-api` change.
