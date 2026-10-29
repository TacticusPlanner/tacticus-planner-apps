# Use datamined game art in place of generic icons

## Why

An app-wide audit found many places that show a generic lucide icon, a planner-made image, or plain text where the game ships its own art: event points and currencies, chests, shop and menu glyphs, the lock, power and chance glyphs, event-ladder rewards with no icon, and the goal-type badges. Using the game's own sprites makes those values recognisable at a glance and matches what players see in Tacticus.

## What Changes

- Add game-catalog icon helpers for event resources (LE points, tokens, shards, chests; HRE points, shards, faction currency and chest; HSE points by event; Quest Event points), tiered and guild-raid chests, menu and shop glyphs, the lock, power and chance glyphs, and event-ladder reward pools (random items, equipment pools, faction shard pools, seasonal currencies, crusade resources, intel, MoW ammo, summoning tokens).
- Show those icons on the Legendary Event, Hero Release Event, Home Screen Event and Quest Event pages, the Dailies raid planner, guild raid status, shops (Library and Dailies), navigation children, alliance filters and insights.
- Resolve shop and HSE milestone rewards that had no icon (about a third of HSE milestone rewards) to the game's drop-table, orb, badge and resource art; HSE milestones with no art show the wooden chest instead of a generic gift.
- Goal-type badges keep the upgrade glyph for Rank and Upgrade goals and use the game's drop-table art for Ascension and Ability goals; the three curated generic images they used are removed.
- Raid boss seasons show each set's chest as its tier art and name instead of the raw chest id.
- Every new image is a pinned game sprite added to `datamine/sprites.txt`.

## Capabilities

### New Capabilities

- `datamined-game-art`: where the app shows the game's own art for event resources, chests, menus and rewards.

## Impact

- `packages/game-catalog/src/game-entities/icons/` (new `event-resource.ts`, `menu.ts`, `reward.ts`; `event.ts`, `progression.ts`).
- Web app feature and page components listed above, `shared/ui/icon-line.tsx`, `entities/goal/model/goal-type-icon.ts`, `features/shop-rewards/lib/shop-reward-display.ts`.
- `apps/web/datamine/sprites.txt` and `public/game_catalog/datamines/`; locale keys in `shops.json` and `library.json`.
