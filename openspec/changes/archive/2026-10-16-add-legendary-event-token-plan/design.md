# Design

## Context

- The event page's Overview tab renders, in order, the Run status card (with Stage 3's Inputs button and Reward outlook), the lane summary and the cross-lane leaderboard; lane tabs render the lane overview, Teams, the Synced progress grid (with Stage 3's marks) and the lane leaderboard. The page view model (`legendary-event-page.view-model.ts`) already builds the run status, the reward outlook, the progress grid and the clear estimates.
- Every input the token plan needs exists in `entities/legendary-event`: `buildLanePointsModel` and `buildSyncedLaneProgress` (cells and earned points; defeat-all id 0, objective id `index + 1`), `currentLegendaryEventRun` and `teamDepthForRun`, `teamEffectiveDepth` (manual else estimate, Stage 5), `applicableAnnotations` (marks in effect, Stage 3, whose doc already names Stage 4 as a reader), `projectRewards` and its constants (`MISSION_CURRENCY`, `PREMIUM_BONUS_CURRENCY`, `BUNDLE_CURRENCY`, `ASCENSION_STEPS`), `deriveLegendaryEventLifecycle` and `LEGENDARY_EVENT_RUN_DURATION_MS`. The synced `lre-progress` entry carries `currentEventTokens` (`current`, `max`, `nextTokenInSeconds`, `regenDelayInSeconds`), `hasUsedAdForExtraTokenToday` and `extraCurrencyPerPayout`.
- V1 sources (tacticusplanner `src/fsd/1-pages/plan-lre/`): `token-estimation-service.ts` (`computeNextToken`, `computeAllTokenUsage`, `computeNextBestTokenInTrack`, `computeIncrementalRestrictionsCleared`, `computeIncrementalPointsForClearingRestrictions`, `computeMinimumTokensToClearBattle`, `getTokenDisplays`), `le-token-service.ts` (free, ad and premium token counts), `le-round-outcome-forecast.service.ts` (per-round simulation), with specs `token-estimation-service.spec.ts` (1,029 lines), `le-token-service.spec.ts` and `le-round-outcome-forecast.service.spec.ts`. V1's tokenomics card shows the first token without a Maybe/Stop mark and offers Maybe / Stop buttons that write marks (`lre.tsx` `nextTokenMaybe` / `nextTokenStopped`); its plan itself ignores marks.
- No API change: marks are written through the existing `PUT …/annotations`.

## Goals / Non-Goals

**Goals:**

- One answer on first look ("spend the next token here, because …"), with the full order and the run outcome one tap away.
- A plan that never asks the user to play a battle they marked Stop here, and that steers around Maybe clear without dropping it.
- V1 parity where V1 is right, every deviation pinned by a test.
- One calculation the card, the list, the forecast and later stages (Stage 6 upgrade impact, Stage 8 analytics) read.

**Non-Goals:**

- V1's tokens table, default-page setting and per-round toggles (the Stage 3 drawer already holds run inputs and Show paid options).
- Suggesting teams or upgrades (Stage 6), history (Stage 7), sharing (Stage 8).
- A next-token line on lane tabs.

## Decisions

**D1. Slice ownership.** New `features/legendary-event-tokens` owns the pure libs `lib/token-plan.ts` (`planTokens(input): TokenPlan`), `lib/minimum-tokens.ts` (`fewestTokensForFullClear(teams, objectiveCount)`), `lib/token-supply.ts` (`runTokenSupply(input): RunSupply[]`), `lib/run-forecast.ts` (`forecastRuns(input): RunForecast[]`), the hook `model/use-token-plan.ts` (memoises the three from the page's reads), and `ui/next-token-card.tsx`, `ui/token-plan-list.tsx`, `ui/run-forecast.tsx`. Its public API (`index.ts`) exports the hook, the three components and the result types. The libs import only from `entities/legendary-event` (points model, synced progress, depth, annotations, projection constants). `projectRewards` is unchanged; `reward-projection.ts` exports a `nextAscensionStep(shards, progression)` helper extracted from its step 4 so the forecast and the projection name steps the same way. The card's mark actions call an `onMarkToken(laneId, battleIndex, objectiveIds, status)` prop; the page wires it to a new `markToken` in `features/legendary-event-annotations` (one write, analytics scope `token`), so the two features never import each other. Stage 6 can import `planTokens` through the feature's public API from the page that composes it.

**D2. Token plan algorithm.** Input: per lane the points model, the synced lane (or none), the lane's teams in sort order with their effective depth for the current run (`teamEffectiveDepth(teamDepthForRun(team, run)?.expectedBattleClears ?? null, estimate)`), the applicable marks, and synced `currentPoints`. State per battle: six cleared flags and the high score. Loop: per lane, scan battles from the first not complete to the highest available (battle 0, or the furthest battle whose predecessor's defeat-all is cleared), skipping a battle whose defeat-all is marked Stop here; per battle and team (in lane order) build the token's cleared ids (not cleared, not Stop here, defeat-all or covered) and value (spec formula); keep the strictly better value, so earlier battles then earlier teams win ties. Across lanes pick the most points, then the token whose team id equals the previous token's and whose battle is the previous battle + 1 in the same lane, then lane order. Apply and repeat until the best value is 0. Output:

```
TokenPlan {
  tokens: { laneId, battleIndex, teamId, clearedIds: number[], points, runningPoints, maybe: boolean }[]
  totalPoints
  lanes: { laneId, pointsLeftAfterPlan, fullClear: { tokensPerBattle } | { uncovered: objectiveIndex[] } | null }[]
}
```

Bounded by 3 lanes × battles × 6 cells, so at most ~324 tokens; each step scans ≤ 54 battles × teams. It runs inside `useMemo` keyed on its inputs; no worker.

**D3. Deliberate deviations from V1, each pinned by a test.** (a) V1 models kill points, high score and defeat-all as three always-cleared requirements; V2 uses its cell model: defeat-all is a cell, the kill score is `battlesPoints − highScore`, and the unverified second high score is not counted (same rule as earned points). (b) V1's plan ignores marks; V2 never plans a Stop here cell and stops a lane at a Stop here defeat-all, and flags Maybe clear tokens instead of dropping them. (c) V1's "same team continues" compares lane, battle + 1 and the restriction set; V2 compares the team id. (d) V1's "earlier battle" cross-lane rule is unreachable (one candidate per lane) and is dropped. (e) V1 reads one depth per team; V2 reads the current run's depth (Stage 2) with the Stage 5 estimate as fallback. (f) V1's token displays use hard-coded ladders (`pointMilestones`, `chestMilestones`); V2 reads the event's own `rewards`. (g) V1's forecast adds the active round's missions and bundle beyond what is stored; V2 follows the reward projection's rule that the current run is already in sync. Fixtures translate V1 names to catalog ids in the fixture, never in the lib.

**D4. Next token selection and reason.** `nextToken(plan)` returns the first unflagged token whose battle is playable from synced progress alone (each planned token records `playableNow`) and has no earlier planned token, else the plan's first token. A token is valued after every earlier token on its battle, so a later token on a skipped token's battle would assume the skipped one was played; only tokens on that battle change its cells, so the chosen token's cells and points match sync. The reason line says "most points available now" for the plan's first token (the greedy best from the synced state), otherwise "most points among battles you can play now" (spec copy). Every token before a later pick is skipped, so a "same team, next battle" note would always describe a skipped token and is not shown. This keeps V1's "first token without a mark" while never naming a battle the game has not unlocked.

**D5. Card actions write marks.** "Partly cleared" marks the token's objective ids (or its defeat-all id when it clears only defeat-all) Maybe clear; "Couldn't clear" marks every cleared id Stop here; both through `markToken` (optimistic, shared plan write queue, 409 adoption, rollback toast, as Stage 3's marks). They are offered only on a token whose battle is playable now; the list has no actions (marks stay editable on the grid).

**D6. Supply and forecast.** `runTokenSupply` follows V1 `LeTokenService` for the current run with V2's lifecycle (`runEndMs`) and the chunk's observation instant (already used by Run status for the countdown); Planned runs use the constants 61 / 7 / 6 kept in `token-supply.ts` beside V1 references. `forecastRuns` follows V1's per-round loop with the event ladder (D3 f, g), Stage 3's input semantics and bounds, and `nextAscensionStep`. The Oh So Close price constants (500 base, 100 / 50 per shard, max 75) are V1's and live in `run-forecast.ts`.

**D7. Placement on the Overview tab, desktop and mobile.** Order: Next token card, Run status card, Token plan (collapsed), Run forecast (collapsed), lane summary, cross-lane leaderboard. Desktop: the card is a full-width row with portraits left and actions right; the plan is a columned list; the forecast's three runs sit side by side. Mobile: the card stacks (team, battle and points, objectives, reason, then the two actions as full-width buttons sized for touch); plan rows are two lines; forecast runs stack with only the Now / Next run open. Collapse state is per device in `localStorage` (`legendaryEvents.tokenPlan.open`, `legendaryEvents.runForecast.open`), wrapped in try/catch, shared across events and not across devices. Tour targets are the same on both forms (`data-testid="legendary-event-next-token"`, `legendary-event-token-plan`), so no split selectors.

**D8. Data states.** The card, plan and forecast derive from reads the page already makes. Loading any of synced progress, the plan, the roster, `lre-battles` or `horde-mode-tiers` → skeletons (the estimate fallback needs the last two; a failed tier read degrades to manual depths as Stage 5 specifies, so it never blocks the plan). Failed synced progress → the card's "unavailable" text and no plan or forecast. Failed plan read → the plan's existing failure note. Archived, or signed out (no plan to read, as with the Teams section) → none of the three render. Upcoming → plan and forecast render, the card adds "for when run N starts" and its actions are hidden (nothing is playable yet).

**D9. Analytics.** `legendary_event_next_token_shown` once per page view and state change (eventId, state `token` | `noTeams` | `noDepth` | `nothingLeft` | `allCleared` | `unavailable`, planLength, tokensLeftOver), `legendary_event_token_plan_expanded` (eventId, planLength), `legendary_event_run_forecast_expanded` (eventId), and `legendary_event_annotation_set` with scope `token` for the card actions.

## Risks / Trade-offs

- [Depth estimates are uncalibrated] → the plan is only as good as depths; the card says which team and battle, and the margin on the team card (Stage 5) shows how sure the estimate is. Stop here from the card is the one-tap correction.
- [The kill-score and second high-score semantics are unverified] → the plan uses the same rule as earned points, so the two never disagree; when the in-game check settles it, both change in one place (`lane-points-model.ts`).
- [Between runs, which run `currentEventRun` names is unverified] → stated as an assumption; a manual check on the next run boundary confirms it (task 7.2).
- [Greedy order is not optimal across milestones] → V1's order, kept for parity and explainability; a smarter order can come later without UI change.
- [Overview gets longer] → plan and forecast start collapsed; the headline card is one row on desktop.

## Migration Plan

Client-only. No stored data changes; new `localStorage` keys default to collapsed.

## Open Questions

- None blocking. Whether the forecast should also offer a "remaining this run" missions input (Stage 3 risk) stays open until users ask.
