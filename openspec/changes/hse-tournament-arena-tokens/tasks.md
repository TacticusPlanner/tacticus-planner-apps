## 1. Projection

- [x] 1.1 Add `TournamentArena` to `HSE_TOKEN_MODES`, keep the synced buckets on `HSE_SYNCED_TOKEN_MODES`, add `isHseManualTokenMode`; verify `hse-token-supply` tests pass unchanged.
- [x] 1.2 Add `manualTokens` and the Tournament Arena default average (5 kills) to `projectHsePoints`; verify the Faction Focus worked example (58 / 20 / 15 / 14 tokens -> 466 points, 11.5 points per token).
- [x] 1.3 Persist entered tokens per instance in `useHseProjectionInputs` (`tp.dailies.hse.tokens.v1`) and merge them in `projectionView`; verify with a reload test.

## 2. UI and copy

- [x] 2.1 Render a tokens input for manual-token modes on desktop (table cell) and mobile (row header), with the "not synced" note as its description.
- [x] 2.2 Add `hse.projection.tokensLabel`, `hse.projection.notes.manualTokens` and the updated `tour.*.projection.content` in en, de, es and fr.
- [x] 2.3 Leave Tournament Arena out of the HSE event teams; verify team-recommendation tests pass.

## 3. Verification

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
- [ ] 3.2 Desktop verification (≥768px), upcoming Faction Focus (Oct 26 – Nov 1, 2026) on a synced account: the Tournament Arena row sits between Arena and Onslaught with an empty tokens input and 0 pts; entering 20 adds 60 pts to the projection and lowers the required points per token; the value survives a reload.
- [ ] 3.3 Mobile verification (<768px, same-origin 420px iframe), same data: the Tournament Arena row shows the tokens input in its header; entering tokens updates the totals above the rows.
- [ ] 3.4 Psyker Boost (scores in Arena, Onslaught and Salvage Run only, no Tournament Arena tracker): no Tournament Arena row and no "not synced" note.
