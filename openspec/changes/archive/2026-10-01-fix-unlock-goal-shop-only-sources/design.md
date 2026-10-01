## Context

`useEntityShardSummary` computes `unlockAvailable` from `charactersById.get(id).shardLocations.length > 0` (campaign nodes only). `useCreateGoalForm` already resolves `shopOffers` via `useUnitShopShardSupply(entityId)` and the Unlock card already renders non-mythic shop offers.

## Decisions

- Extend the gate rather than add a new hook: pass `shopOffers` (already computed in `use-create-goal-form.ts`) into `useEntityShardSummary` and OR in `shopOffers.some(o => !o.isMythic)`. Unlock consumes regular shards only, matching the Unlock card's own `!offer.isMythic` filter.
- While `shopOffers` is `undefined` (catalog still loading) treat it as no offers; the gate re-evaluates when the live query resolves.
- Keep the Mow branch and the owned check unchanged.

## Risks

- Offers use the permissive lock resolver (no roster context), so an offer hidden by an in-game lock may still enable Unlock. Acceptable: the goal still creates and the estimate treats unselected sources as absent.
- Estimates for an Unlock goal with no campaign nodes: verify the energy-for-remaining-shards line and `unlockRequirement` tolerate empty campaign locations (task 2).
