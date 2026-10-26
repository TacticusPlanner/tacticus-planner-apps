## 1. Projection

- [x] 1.1 Add `TournamentArena` to `HSE_TOKEN_MODES`, keep the synced buckets on `HSE_SYNCED_TOKEN_MODES`, add `isHseManualTokenMode`; verify `hse-token-supply` tests pass unchanged.
- [x] 1.2 Add `manualTokens` and the Tournament Arena default average (5 kills) to `projectHsePoints`; verify the Faction Focus worked example (58 / 20 / 15 / 14 tokens -> 1,126 points, 11.5 points per token).
- [x] 1.3 Persist entered tokens per instance in `useHseProjectionInputs` (`tp.dailies.hse.tokens.v1`) and merge them in `projectionView`; verify with a reload test.

## 2. UI and copy

- [x] 2.1 Render a tokens input for manual-token modes on desktop (table cell) and mobile (row header), with the "not synced" note as its description.
- [x] 2.2 Add `hse.projection.tokensLabel`, `hse.projection.notes.manualTokens` and the updated `tour.*.projection.content` in en, de, es and fr.
- [x] 2.3 Leave Tournament Arena out of the HSE event teams; verify team-recommendation tests pass.

## 3. Faction Focus scoring and details

- [x] 3.1 Count `DeployedUnitsOfFactionMajority` once per character of a five-character line-up in `hseModeScoring`; verify Faction Focus shows 7 and 20 per battle and 58 / 20 / 15 / 14 tokens project 1126 points.
- [x] 3.2 Reword the faction-majority, full line-up and same-faction XP description lines in en, de, es and fr, and the "battles" note; verify the event-details tests.

## 4. Verification

- [x] 4.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
- [x] 4.2 Desktop verification (≥768px), upcoming Faction Focus (Oct 26 – Nov 1, 2026) on a synced account: the Tournament Arena row sits between Arena and Onslaught with an empty tokens input and 0 pts; Arena shows 7 per battle and Onslaught / Salvage Run 20; entering 20 adds 140 pts to the projection and lowers the required points per token; the value survives a reload. Verified on 2026-10-26 with Faction Focus running (synced 63 / 9 / 12, so 861 pts; 20 tokens -> 1,001 pts and 14.6 -> 11.8 per token); Training Rush, which also scores in Tournament Arena, kept its own empty input.
- [x] 4.3 Mobile verification (<768px, same-origin 420px iframe), same data: the Tournament Arena row shows the tokens input in its header; entering tokens updates the totals above the rows.
- [x] 4.4 Psyker Boost (scores in Arena, Onslaught and Salvage Run only, no Tournament Arena tracker): no Tournament Arena row and no "not synced" note. Verified with upcoming Warp Surge (Arena only), since Psyker Boost had ended and past events show no projection; its projection and teams match `main`.
