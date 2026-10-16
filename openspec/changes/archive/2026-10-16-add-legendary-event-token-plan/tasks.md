# Tasks

No companion API change: teams and depths, run inputs and annotations, and the `lre-battles` / `horde-mode-tiers` reads already exist (Stages 2, 3 and 5).

## 1. Entity: shared helpers

- [x] 1.1 Extract `nextAscensionStep(shards, progression)` from `projectRewards` step 4 in `entities/legendary-event/lib/reward-projection.ts` and export it with the existing constants from `entities/legendary-event/index.ts`; verify `reward-projection.test.ts` passes unchanged and a new case covers each step and `fullyAscended` (design D1).

## 2. Feature libs: token plan, fewest tokens, supply, forecast

- [x] 2.1 Add `features/legendary-event-tokens/lib/token-plan.ts` (`planTokens`, `nextToken`) returning the `TokenPlan` shape in design D2; verify `token-plan.test.ts` covers the worked Uthar Alpha example with every candidate and running total, Maybe clear flagging, Stop here on defeat-all and on an objective, a team without depth, a reserve that never counts, the same-team and earlier-lane ties, a lane with no synced record, a partial high score, and `nextToken` skipping flagged and unplayable tokens (spec `legendary-event-token-plan`, design D2, D4).
- [x] 2.2 Port V1 `token-estimation-service.spec.ts` (`computeNextToken`, `computeAllTokenUsage`, current points) as `token-plan.v1-parity.test.ts`, mapping V1 names and tracks to catalog ids and V2 cells in the fixture; add one case per design D3 deviation that pins the V2 result; verify all pass.
- [x] 2.3 Add `lib/minimum-tokens.ts` (`fewestTokensForFullClear`); verify `minimum-tokens.test.ts` covers the worked "not covered" case, the overlapping example and V1's four `computeMinimumTokensToClearBattle` cases.
- [x] 2.4 Add `lib/token-supply.ts` (`runTokenSupply`); verify `token-supply.test.ts` covers the worked run 2 / run 3 supply, premium planned and already bought, a null bucket, the next token after run end, the ad token used today, an upcoming event, and V1 `le-token-service.spec.ts` cases translated (spec `legendary-event-run-forecast`, design D6).
- [x] 2.5 Add `lib/run-forecast.ts` (`forecastRuns`); verify `run-forecast.test.ts` covers the worked Uthar forecast with every intermediate value, the Oh So Close hint and price, a plan longer than a run, paid options off, no synced entry, every step reached, and V1 `le-round-outcome-forecast.service.spec.ts` cases translated, with D3 (f, g) deviations pinned.

## 3. Feature model and UI

- [x] 3.1 Add `model/use-token-plan.ts`: memoised plan, next token, fewest tokens, supply and forecast from the page's reads, with the data states of design D8; verify `use-token-plan.test.tsx` covers loading, failed progress, archived, upcoming and the worked example.
- [x] 3.2 Add `ui/next-token-card.tsx` (`data-testid="legendary-event-next-token"`): token view with portraits, objective icons, reason line and the two actions calling `onMarkToken`; every empty state with its link; desktop row and mobile stacked layout; verify `next-token-card.test.tsx` covers every scenario of the "Next token card heads the Overview tab" requirement and the actions' accessible names.
- [x] 3.3 Add `ui/token-plan-list.tsx` (`data-testid="legendary-event-token-plan"`): collapsible, per-device open state, team groups, milestone and step markers, Maybe flags, per-lane fewest-tokens lines, desktop columns and mobile two-line rows; verify `token-plan-list.test.tsx` covers the milestone marker, grouping, the lane lines and the hidden empty plan.
- [x] 3.4 Add `ui/run-forecast.tsx`: collapsible with the header line, run blocks with states, leftover-tokens line with its link, Edit inputs, desktop side-by-side and mobile stacked with the Now / Next block open; verify `ui/run-forecast.test.tsx` covers the worked header, the leftover line, Done blocks, the hint and the catalog-failure state.
- [x] 3.5 Export the hook, components and types from `features/legendary-event-tokens/index.ts`; verify `pnpm lint:fsd` passes.

## 4. Marks from the card

- [x] 4.1 Add `markToken(laneId, battleIndex, objectiveIds, status)` to `features/legendary-event-annotations/model/use-annotations.ts` with analytics scope `token`; verify `use-annotations.test.tsx` covers the token body, conflict adoption and rollback (design D5).

## 5. Page wiring

- [x] 5.1 In `pages/legendary-events/ui/legendary-event/`, render the card, plan and forecast on the Overview tab in the design D7 order, wire `onMarkToken` to `markToken`, Edit inputs to the existing drawer, and the empty-state links to the lane tab's Teams section or team card; verify `legendary-event-page.test.tsx` covers the Overview order, a card action re-planning at once, and an archived event without the three sections.
- [x] 5.2 Add the Next token and Token plan tour steps to `legendary-event.tutorial.tsx` (desktop and mobile, `tour.event.steps.nextToken.*`, `tour.event.steps.tokenPlan.*`); verify the tutorial test lists them in order.
- [x] 5.3 Analytics `legendary_event_next_token_shown`, `legendary_event_token_plan_expanded`, `legendary_event_run_forecast_expanded` through the existing entry point; verify a test asserts the properties (design D9).

## 6. i18n

- [x] 6.1 Add to `legendaryEvents.json` (en/de/es/fr): `tokenPlan.nextToken.*` (title, battle, points, reasons, upcoming suffix, actions, every empty state), `tokenPlan.plan.*` (header, group, row, maybe flag, milestone and step markers, fewest-tokens and uncovered lines), `tokenPlan.forecast.*` (header, run states, supply breakdown, uses / left over, ending figures, steps, Oh So Close hint, leftover line, Edit inputs), and `tour.event.steps.nextToken.*` / `tokenPlan.*`, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.

## 7. Platform-independent verification

Data states: a profile with a synced Uthar entry in run 2 and two Alpha teams (one with a manual depth, one estimated); a profile with teams but no depths and the tier read failing; a profile with no teams; an archived event; an upcoming event.

- [ ] 7.1 With the Aspire stack, open Uthar and play the card's suggested battle in game, sync, and confirm the card moves to the next planned token and the forecast's points match the in-game total.
- [ ] 7.2 On a run boundary (or with a fixture), confirm the forecast's run states against the synced `currentEventRun` between runs.
- [ ] 7.3 Press Couldn't clear and Partly cleared on the card, reload, and confirm the marks show on the progress grid and the plan respects them.

## 8. Desktop verification (≥768px)

- [ ] 8.1 The card renders as one row above Run status; both actions work with keyboard; each empty state links to the right lane or team.
- [ ] 8.2 The token plan and forecast expand and remember their state after reload; the forecast's runs sit side by side; the tour's two new steps highlight their targets.

## 9. Mobile verification (<768px, same-origin iframe per the `tp-manual-ui-verification` skill)

- [ ] 9.1 The card stacks with touch-sized actions; plan rows are two lines; nothing scrolls horizontally.
- [ ] 9.2 Forecast runs stack with the Now / Next block open; Edit inputs opens the bottom sheet; the tour steps scroll their targets into view.

## 10. Gates

- [x] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.

## Deferred / out-of-session

- Amend `tacticus-planner-docs/product/features/lre-planning.md` (Stage 4 as built: marks steer the plan, card actions, forecast reads the Stage 3 drawer) when this change is archived.
