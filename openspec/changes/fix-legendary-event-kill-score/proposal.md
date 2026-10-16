# Proposal

## Why

The Legendary Event page undercounts points: on `votanUthar` its lane totals read 3,631 / 4,158 / 3,852 (11,641), while V1 and the synced run total read 4,137 / 4,709 / 4,293 (13,139), the figures the owner confirms match the game. The gap is exactly each lane's kill score. A battle awards its kill score and its high score as two separate awards (the model's maximum already counts `battlesPoints[i]` twice), but earned points, the token plan, the upgrade impact, the team suggestions and the run history count it once. The sync gives no separate kill score (`encounterPoints` equalled `highScore` on all 121 synced encounters of the three events), so the earlier decision not to read `encounterPoints` made the second award vanish. On the Fabius plan this makes every first-pass token 23 to 41 points low (7,923 against V1's 8,615 for the same teams and depths), which also changes which token is recommended first.

## What Changes

- A battle's earned points become its kill score (synced `encounterPoints`) plus its high score (synced `highScore`), each capped at `battlesPoints[i]`, plus the cleared defeat-all and objective scores. A fully cleared battle at full scores now equals its maximum.
- The token plan values a first-pass token with both awards left: `(battlesPoints − kill score) + (battlesPoints − high score)` plus defeat-all and objectives, and a planned token leaves both awards full.
- Lane reachable points, upgrade-impact gains and team-suggestion gains follow the same two-award rule; run-history lane points count the recorded high score twice (records keep only the high score, which equals the kill score in the game's data).
- The "how points work" disclosure and the lane totals' copy say what is counted (kill score, high score, defeat-all, objectives) in en, de, es and fr.
- Worked examples in the six specs are recomputed (Uthar Alpha plan 978 → 1,136 points from 5,000; Fabius plan 7,923 → 8,615; forecast, suggestion and impact gains).
- The V1 parity test fixture stops merging V1's two awards into one `battlesPoints`; the V1 plan for Fabius (8,615 points over 55 tokens) becomes a parity case.
- Not changed: per-unit points per battle on the leaderboards and the master table (objective points plus the lane's defeat-all base, as V1 shows them), clear estimates, reward projection, the synced run totals.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `legendary-event-synced-progress`: earned points per battle count the kill score and the high score; assumptions record the evidence; lane totals equal the synced run points; disclosure copy.
- `legendary-event-token-plan`: token value, plan state and worked example count both awards; the Next token card and milestone marker figures follow.
- `legendary-event-upgrade-impact`: lane reachable points and upgrade gains count both awards.
- `legendary-event-team-suggestions`: gains and the ranking in the worked example follow the new reachable points.
- `legendary-event-run-forecast`: the worked forecast and its header follow the new plan totals.
- `legendary-event-run-history`: lane points in a run record count the high score twice; the Last run card example follows.

## Impact

- Code (`tacticus-planner-apps`, `apps/web/src/fsd`): `entities/legendary-event/lib/synced-lane-progress.ts` (`BattleProgressView` gains a kill score), `lane-points-model.ts` (comments), `reachable-points.ts`, `run-history.ts`, `features/legendary-event-tokens/lib/token-plan.ts` (state, token value, earned total, post-token scores), the team-suggestion and upgrade-impact libs that call reachable points, and the progress grid's "how points work" text in `public/locales/{en,de,es,fr}/legendaryEvents.json`.
- Tests and fixtures: `synced-lane-progress.test.ts`, `reachable-points.test.ts`, `run-history.test.ts`, `token-plan.test.ts`, `token-plan.v1-parity.test.ts`, `token-plan.fixtures.ts`, forecast, suggestion and page tests that carry the old figures.
- No API, schema or catalog change. The API run-record shape is unchanged (it stores `highScore`).
- No companion API change. A separate finding (catalog `killPoints` for `votanUthar` disagrees with its `defeatAll` values: 34 / 26 / 17 against 30 / 34 / 43) affects per-unit points on that event's leaderboards and needs its own small API change; it is out of scope here.
- Docs: design D3(a) and D4 of the archived Stage 1 and Stage 4 changes are superseded; this change's design records the reversal.
