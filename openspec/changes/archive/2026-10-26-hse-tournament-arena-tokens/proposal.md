## Why

Faction Focus gives 2x XP and event points in Arena, Tournament Arena, Onslaught and Salvage Run, and its served trackers already allow `TournamentArena` (1 + 2 = 3 points per battle, the same as Arena). The HSE points projection only covers the three synced token modes, so every Tournament Arena battle the player plans to fight is missing from the projected points and the required average per token. The Tacticus player API does not expose a Tournament Arena token bucket (`progress` has `arena`, `guildRaid`, `onslaught` and `salvageRun` only), so the tokens cannot come from the sync.

Faction Focus was also scored wrong: its faction-majority trackers score **per deployed character** of the line-up's largest faction, not once per battle. The game's maximums are 5 x 1 + 2 = 7 points per Arena / Tournament Arena battle and 5 x 3 + 5 = 20 per Onslaught / Salvage Run battle; the planner showed 3 and 8. Its event details also described the points and the XP bonus differently from the game.

## What Changes

- Add Tournament Arena as an HSE projection token mode, shown between Arena and Onslaught whenever a scoring tracker's `gameModes` pass it.
- Its tokens are entered by the player (a whole-number input in the tokens column, default 0) instead of computed from a synced bucket; a note says those tokens are not synced and asks for the number the player will spend.
- Entered tokens persist per browser per instance (`tp.dailies.hse.tokens.v1`), like milestone progress.
- Its default average is 5 kills per token for kill-based events (the Arena estimate) and fixed at 1 for battle-based events.
- Count a `DeployedUnitsOfFactionMajority` tracker once per character of a full five-character line-up when summing points per battle, so Faction Focus projects 7 and 20 per battle.
- Event details word the faction-majority points per deployed character, the full line-up points as a bonus, and the same-faction XP as "+100% XP for each deployed friendly character of the same faction", as the game does.
- HSE event teams are unchanged: Tournament Arena gets no team of its own, the Arena team plays it.
- New strings (token input label, note, tour copy) in en, de, es and fr.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hse-points-projection`: Tournament Arena is projected from player-entered tokens; faction-majority trackers score per deployed character.

## Impact

`features/home-screen-event-points` (`lib/hse-token-supply.ts`, `lib/hse-projection.ts`, `lib/hse-description.ts`, `model/hse-event-points.ts`, `model/use-hse-projection-inputs.ts`, `ui/points-projection*.tsx`) and their tests; `features/team-recommendations` (team modes exclude Tournament Arena); `dailies.json` in every locale. No API, catalog or player-data change; no companion `tacticus-planner-api` change.
