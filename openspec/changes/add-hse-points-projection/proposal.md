# Proposal

## Why

Dailies > HSE only helps with the four Home Screen Events that score from campaign raids. For every other event (Psyker Boost, Flying Boost, For the Emperor, Defeat Waves, Faction Focus, ...) it shows a name, a countdown and "does not earn points from campaign raiding". Severyn wants the page to be useful for those events too: show the event's details and milestones the way V1's Learn > HSEs page does, and project how many units the player has to defeat to reach the final milestone and how many Arena, Onslaught and Salvage Run tokens they can use during the event.

## What Changes

- **Event details** for the selected instance (from `add-hse-instance-switcher`), mirroring V1 Learn > HSEs without paid offers: power level and the resolved reward tier (Low / Mid / High, rule in a tooltip), the event's description lines built from its served modifiers and trackers, and the milestone grid (points per step, reward icon and quantity, the repeating step marked endless). Shown for every event with scoring data, including the raid events.
- **Points projection** for running and upcoming personal events that score in Arena, Onslaught or Salvage Run: the final-milestone target, units to defeat, tokens the player can use per mode until the event ends (from the synced token buckets), the average per token needed to reach the final milestone, and, from an editable average per mode (defaults Arena 5, Onslaught 20, Salvage Run 12 kills per token), the projected points and the milestone they reach. An optional "points so far" input for a running event.
- The "does not earn points from campaign raiding" state now shows the details and the projection instead of ending there.
- Tour steps and copy in en/de/es/fr.

Companion API change: **`add-hse-points-projection`** in `tacticus-planner-api` serves `config.hse` (variants, tiers, milestones, trackers, modifiers) on `event-definitions`. It applies first.

Out of scope: team suggestions (`add-hse-team-suggestions`); replacing the hard-coded raid-point rules with served trackers (kept, by decision); paid offers (dropped, by decision); synced HSE progress (the game API does not expose it).

## Capabilities

### New Capabilities

- `hse-event-details`: tier resolution, description lines and the milestone grid for the selected instance.
- `hse-points-projection`: tokens per mode, the required rate, the projection with worked examples, inputs and persistence, states.

### Modified Capabilities

- `daily-raids-home-screen-event`: the no-raid-points state shows details and projection; layout order of the new sections next to the raid lists.

## Impact

- `packages/game-catalog`: zod schema and types for `config.hse` (`schemas/events.ts`, `types.ts`), a variant resolver.
- New `apps/web/src/fsd/features/home-screen-event-points/` (`lib/resolve-hse-scoring.ts`, `lib/hse-token-supply.ts`, `lib/hse-projection.ts`, `lib/hse-description.ts`, `model/use-hse-projection.ts`, `model/use-hse-projection-inputs.ts`, `ui/event-details.tsx`, `ui/milestone-grid.tsx`, `ui/points-projection.tsx`, `index.ts`); `features/shop-rewards/@x/home-screen-event-points.ts` for reward icons and labels.
- `pages/dailies/ui/hse-page.tsx`, `hse-page.tutorial.tsx`; locales `dailies.json` in four languages.
- Docs: none required; `tacticus-planner-docs` has no HSE page yet.
