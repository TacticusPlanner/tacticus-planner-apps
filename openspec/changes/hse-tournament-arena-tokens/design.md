## Context

The projection's token modes were the synced buckets (`gameModeTokens.arena|onslaught|salvageRun`). Tournament Arena has no bucket in the Tacticus API, but HSE trackers can score in it (Faction Focus allows `["Arena", "TournamentArena"]`).

## Decisions

### D1. Tournament Arena is a token mode with manual tokens

`HSE_TOKEN_MODES` becomes Arena, TournamentArena, Onslaught, SalvageRun (catalog display order). A private `HSE_SYNCED_TOKEN_MODES` keeps the three bucket-backed modes; `HseTokenBuckets` and `hseTokenSupply` are keyed by those only. `isHseManualTokenMode` marks the rest. `projectionView` merges the synced supply with the entered tokens (`inputs.tokens.TournamentArena ?? 0`), so `projectHsePoints` stays one calculation over all modes and each `HseProjectionMode` carries `manualTokens`.

Defaulting to 0 rather than "not entered" keeps the projected points visible for players who never fight Tournament Arena; the note tells them the row counts nothing until they enter tokens. Tournament Arena is never "not unlocked" (there is no bucket to be null).

### D2. Entered tokens persist per instance

Tokens depend on one occurrence's dates, unlike averages (per definition). They live under their own key, `tp.dailies.hse.tokens.v1`, `{ [instanceKey]: { TournamentArena: n } }`, read and written through `safeStorage` like the other inputs, floored to whole non-negative numbers.

### D3. Desktop and mobile

Desktop: the tokens cell of the Tournament Arena table row is the input (inline, so the right-aligned column holds). Mobile: the input replaces the "n tokens" text in the row header. Both reuse `ProgressInput`, whose `aria-describedby` is now a prop (the progress inputs pass `hse-progress-hint`, the tokens input `hse-manual-tokens-hint`, the id of the new note). The tour target (`hse-projection`) is unchanged; only its copy changes.

### D4. Teams

`HseTeamMode` is `Exclude<HseTokenMode, "TournamentArena">` and `hseTeamModes` leaves Tournament Arena out: its line-up rules are Arena's, so the Arena team covers it and no duplicate card is shown.
