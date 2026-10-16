# Design

## Context

Points for a battle come from one shared model (`lane-points-model.ts`: maximum `= 2 × battlesPoints + defeatAll + Σ objectives`) and one reader of synced progress (`synced-lane-progress.ts`: `pointsEarned = highScore + cleared scores`). Four more calculations restate the same award rule instead of reading it from the model: the token plan (`token-plan.ts`: token value, post-token state, earned total), lane reachable points (`reachable-points.ts`, which team suggestions and upgrade impact build on), run-history lane points (`run-history.ts`, through the same progress reader) and the leaderboard-side per-unit points (deliberately objective-only, unchanged here). See proposal.md for the evidence (Uthar lane totals, Fabius plan against V1).

Facts the design relies on, all observed on 2026-10-16:

- The sync schema requires both `highScore` and `encounterPoints` on every encounter (`packages/player-data/src/player-data.schema.ts`).
- On all 121 synced encounters of Lysander, Farsight and Uthar the two are equal, so the game exposes no separate kill score.
- V1 treats `encounterPoints` as the kill score and `highScore` as the high score, counts both, and its lane totals sum to the synced run points; the owner confirms V1 matches the game.
- Run records keep only `highScore` per encounter (`LegendaryEventRunRecordEncounter`).
- Battle progress carries across runs, so one token plan covers the rest of the event (existing assumption in `legendary-event-token-plan`).

## Goals / Non-Goals

**Goals:**

- Count the kill award and the high award wherever points are earned, planned or projected, from one definition.
- Make a fully cleared battle at full scores equal its maximum, and the three lane totals equal the synced run points.
- Make the Fabius plan equal V1's (8,615 over 55 tokens) and the first recommended token equal V1's.

**Non-Goals:**

- Per-unit points per battle on the leaderboards and the master table (objective points plus the lane's defeat-all base, V1 parity) and the "remaining" deduction rule.
- The catalog's `killPoints` field (it disagrees with `defeatAll` for `votanUthar`; a separate API data fix) and any rename of it.
- Reward projection and run-forecast mechanics (only their worked-example inputs move).
- The run-record API shape (no `encounterPoints` is stored).

## Decisions

**D1. One earned-points definition in the progress reader; every other calculation reuses its per-battle view.** `BattleProgressView` gains `killScore` next to `highScore`; `pointsEarned = killScore + highScore + defeat-all + cleared objectives`. `reachable-points.ts` and the token plan read `killScore` and `highScore` from the same view instead of reading raw encounters. Alternative: keep each calculation reading `highScore` and add a second term in each place. Rejected: that is how the second award was lost in the first place (four copies of the rule).

**D2. Kill score is read from `encounterPoints`, not derived as `highScore`.** Each is capped at `battlesPoints[i]`. Because the two are equal today, `2 × highScore` would give the same numbers; reading both keeps the model correct if the game ever separates them and matches V1's `syncPartialScores`. Alternative: count `highScore` twice. Rejected: it encodes today's data coincidence as a rule. Run records are the one exception (D5).

**D3. Token value is the unearned part of each award plus the unearned cells.** A token that wins a battle (clears defeat-all, or defeat-all is already cleared) is worth `(battlesPoints − killScore) + (battlesPoints − highScore)` (each not below 0), plus `defeatAll[b]` when it clears defeat-all, plus the objectives it clears. After a planned token both scores are `battlesPoints[b]`. The plan state therefore keeps two arrays (`killScore[]`, `highScore[]`) instead of one. Alternative: store one "award points left" number per battle. Rejected: the state is initialised from the progress view, which has the two scores; one number would need a second derivation. Effect on the plan order is intended: first-pass tokens grow by `battlesPoints[b]`, so the best-first order matches V1's (Alpha 1 to 6 at 249 to 269 before Gamma).

**D4. Reachable points follow the same rule, so gains and suggestions need no logic of their own.** `laneReachablePoints` adds the kill score left and the high score left per reached battle. Upgrade-impact gains and team-suggestion gains are differences of reachable points, so they move with it; their worked examples are recomputed (spec deltas) and their ranking can change (for example the Incisus-alone proposal drops from tied first to fourth).

**D5. Run history counts the stored high score twice.** The record adapter that builds a synced-lane shape from a record sets `encounterPoints = highScore`. Alternative: add `encounterPoints` to the record payload and the API. Rejected here: no API change is warranted by a field the game reports equal; revisit if the two ever differ (one record-schema version bump would then be needed and old records would fall back to this rule).

**D6. Copy says what is counted.** The "how points work" body (`progress.howPoints` and the lane-overview disclosure) names the kill score, the high score, the defeat-all bonus and the cleared objectives, in en, de, es and fr. No new UI element: rows still show earned of maximum and "High score N".

**D7. Reverse the earlier decision on record.** Stage 1 design D4 ("encounterPoints is never read") and Stage 4 design D3(a) ("V2 counts the kill score once") are superseded; the main specs carry the new rules, and this design is the record of why (the earlier evidence, `encounterPoints == highScore`, is the situation in which both awards are present).

## Risks / Trade-offs

- [Existing plan outputs change for every user: totals, the first recommended token, forecast and suggestion gains] → The old numbers were about 8% low on the Fabius plan (23 to 41 points per first-pass token) and the new ones equal V1 and the game's totals; the change is announced by the corrected lane totals themselves. No stored data is affected (everything is computed client side).
- [The game later reports a distinct kill score (so `encounterPoints != highScore`)] → Both fields are read independently and capped; one unit test per calculation uses differing values.
- [Run records lack `encounterPoints`, so history lane points assume equality] → Stated in the spec assumption; the Last run card is derived, not stored, so a later schema change can correct it.
- [Caps hide a game change in `battlesPoints`] → The caps exist only to keep a bad value from exceeding the maximum; the model's maximum is unchanged and a fixture asserts earned never exceeds it.
- [Spec deltas touch six capabilities and many worked examples] → Every figure was recomputed from the real `votanUthar` catalog values by script before writing, and the delta specs pass `openspec validate --strict`; the tasks re-derive each example in a test.

## Migration Plan

Pure client-side change, no data migration, no flag. Ship with the next web release; roll back by reverting the commit. After release, reopen `votanUthar` and `lostaBile` on staging and compare with the figures in the proposal (verification tasks).
