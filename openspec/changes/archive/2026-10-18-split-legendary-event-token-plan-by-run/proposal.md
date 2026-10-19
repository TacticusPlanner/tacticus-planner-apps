# Proposal

## Why

The Token plan list on the Overview tab is one flat list headed by the total tokens and points, while the Run forecast already knows which run each token falls into. Severyn wants the plan split by run so it is clear what to play in the current run and what is left for later runs.

## What Changes

- The expanded Token plan lists its tokens in **run sections** (Now, Next, Planned), using exactly the run forecast's spending: each run takes the next tokens up to its supply.
- Each section header reads "Run 2 · Now · 6 of 32 tokens · +1,136 points · ends at 6,136".
- A run with no planned tokens shows "No tokens planned · 68 tokens available" in its section.
- Tokens beyond the last run's supply go in a final **Not enough tokens** section ("8 tokens beyond run 3's supply"), so the user sees what the plan cannot fit.
- Team grouping, milestone and ascension markers stay as today, now within each section. The collapsed header ("N tokens · +P points") and the per-lane fewest-tokens lines are unchanged.

No **BREAKING** changes: front end only.

## Capabilities

### Modified Capabilities

- `legendary-event-token-plan`: the Token plan list is sectioned by run.

## Impact

- `apps/web/src/fsd/features/legendary-event-tokens/lib`: a `splitPlanByRun(plan, supply)` helper shared with `run-forecast.ts` so both read one spending rule.
- Token plan list component and its tests; `legendaryEvents` i18n in en/de/es/fr.
- No API change.
