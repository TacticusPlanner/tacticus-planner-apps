# Proposal

## Why

Stage 4 of the V2 Legendary Event plan ("Guided tokenomics", docs plan §5; pain #1 "tokenomics opaque"). V1's token planning is the reason power users stay, but it sits behind a setup chain (teams → clear depth → tokenomics tab) most users never finish, and its answer is a table. Stages 2, 3 and 5 have now put every input in place without that chain: teams per lane (Stage 2), run inputs and Maybe clear / Stop here marks (Stage 3), and an estimated depth for every team (Stage 5). What is missing is the answer itself: which battle to spend the next token on, the order after that, and where the run ends if the user follows it. The plan's principle is "lead with the answer, not the tab": a **Next token** headline card, with the plan and the forecast one tap below, and an empty state that names the missing input whenever there is no answer yet.

## What Changes

- **Token plan calculation.** A pure `features/legendary-event-tokens/lib/token-plan.ts`, ported from V1 `TokenEstimationService` (`computeNextToken`, `computeAllTokenUsage`, incremental objectives and points) onto V2's lane points model: from the synced progress, the lane's teams, each team's depth for the current run (manual, else the Stage 5 estimate) and the plan's marks, it orders every token that still earns points, greedily by most points, then the same team continuing to its next battle, then the earlier lane, then the earlier battle. Stop here marks are never planned; tokens that touch a Maybe clear cell are planned but flagged.
- **Fewest tokens per battle.** V1 `computeMinimumTokensToClearBattle` ported as `lib/minimum-tokens.ts`: for each lane, how many tokens a full clear of a battle takes with the lane's teams, or which objectives no team covers.
- **Token supply and run forecast.** V1 `LeTokenService` and `LeRoundOutcomeForecastService` ported as `lib/token-supply.ts` and `lib/run-forecast.ts`: tokens left in the current run from the synced bucket, its regeneration delay, the run's end and the daily ad token; full runs after it; bonus-delivery tokens when the premium track is (or is planned to be) bought. The plan's tokens are spent run by run, giving each run's ending points, currency, chests, shards and next ascension step, with Stage 3's run inputs for later runs and an "Oh So Close" hint when a run ends within 75 shards of a step.
- **Next token card** on the Overview tab, above Run status: team, lane, battle, "+N points", the objectives it clears, and a one-line reason; actions "Partly cleared" (Maybe clear on its objective cells) and "Couldn't clear" (Stop here on all its cells), written through the existing marks feature. Empty states: no teams, no depth, nothing left for the teams, every battle cleared.
- **Token plan** (collapsible, below Run status): the ordered tokens with running points and the milestone or ascension step each crosses, grouped by consecutive team, with a per-lane line for the fewest tokens per battle.
- **Run forecast** (collapsible): per run, tokens available (free, ad, bonus delivery), tokens the plan uses and tokens left over, and end-of-run points, currency, chests, shards and next step; an **Edit inputs** link opens the Stage 3 drawer, which already carries the paid-options switch.
- **Marks** now steer the token plan; the synced-progress requirement is amended to say so.
- **Tour and i18n.** Two event-page tour steps (Next token, Token plan); all copy in en/de/es/fr.

Out of scope: V1's default-page setting and token table view (dropped, per plan), suggested teams and upgrade impact (Stage 6), history (Stage 7), sharing the plan (Stage 8), a next-token line on lane tabs.

## Capabilities

### New Capabilities

- `legendary-event-token-plan`: the token plan calculation (with a worked example and assumption lines), how marks and depths feed it, fewest tokens per battle, the Next token card with its states and actions, and the token plan list.
- `legendary-event-run-forecast`: token supply per run, the run-by-run forecast (with a worked example and assumption lines), and how it is shown.

### Modified Capabilities

- `legendary-events-hub`: the Overview tab gains the Next token card, the token plan and the run forecast; the event page tour gains their steps.
- `legendary-event-synced-progress`: marks are no longer reminders only; they steer the token plan (still never points, the lane summary or the reward projection).

## Impact

- **Apps only.** No API change: teams and depths (Stage 2), run inputs and annotations (Stage 3) and the `lre-battles` / `horde-mode-tiers` reads (Stage 5) already exist.
- New `apps/web/src/fsd/features/legendary-event-tokens/` (`lib/token-plan.ts`, `lib/minimum-tokens.ts`, `lib/token-supply.ts`, `lib/run-forecast.ts`, `model/use-token-plan.ts`, `ui/next-token-card.tsx`, `ui/token-plan-list.tsx`, `ui/run-forecast.tsx`, `index.ts`), `entities/legendary-event/lib/reward-projection.ts` (exports its constants and ascension-step helper for reuse, unchanged behaviour), `features/legendary-event-annotations/model/use-annotations.ts` (`markToken`, analytics scope `token`), `pages/legendary-events/ui/legendary-event/` (`legendary-event-page-view.tsx`, `legendary-event-page.view-model.ts`, `legendary-event.tutorial.tsx`), test fixtures, locales `legendaryEvents.json` in four languages.
- Docs: amend `tacticus-planner-docs/product/features/lre-planning.md` (Stage 4 as built) when this change is archived.
- No infra change.
