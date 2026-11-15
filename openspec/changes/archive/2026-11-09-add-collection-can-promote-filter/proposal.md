## Why

Players want to see which units they can promote right now. Collection already lists units that can ascend (reach the next rarity) and those ready for one blue star, but not those whose shards and orbs already pay for their next star. Neither V1 nor V2 offers such a filter; the cost check itself already exists for Can ascend, so the new filter reuses it.

## What Changes

- The Collection quick filters gain **Can promote**: owned units whose held shards, mythic shards and orbs pay for their next star within their current rarity (the next Mythic step at Mythic).
- A unit on its rarity's last star does not match, since its next step is an ascension, which Can ascend covers.
- Like Can ascend, it needs the ascension cost ladder and the synced orb inventory, and is off while comparing a snapshot.

## Capabilities

### Modified Capabilities

- `player-collection`: "Collection quick filters follow defined progression rules" adds Can promote.

## Impact

- `apps/web/src/fsd/pages/my-game/model/collection-query.ts`, `collection-quick-filters.ts`, `collection-view.ts` and their tests.
- `apps/web/public/locales/*/common.json`: `myGame.collection.toolbar.quick.canPromote` and `quickHelp.canPromote`.
