# Tasks

## 1. Game-catalog helpers

- [x] 1.1 Add event-resource, chest, menu, shop, lock, power, chance and reward-pool icon helpers with unit tests; verify `pnpm --filter @workspace/game-catalog test` passes.

## 2. Event pages

- [x] 2.1 Show LE resource icons on the run status, forecast, reward outlook and token plan rows.
- [x] 2.2 Show HRE points, faction currency, chest and shard icons on the pace card, mode token icons on tokens needed, the event icon and alliance icon in the header, and energy on the raids section.
- [x] 2.3 Show the HSE points icon on details, projection, milestones and the raids farm section; the wooden chest replaces the generic gift.
- [x] 2.4 Show the Quest Event points, rarity and star icons.

## 3. Navigation, shops and small swaps

- [x] 3.1 Add game menu art to navigation children and shop icons to shop tabs, headings and plan rows.
- [x] 3.2 Replace lucide lock, power and dice icons with the game's glyphs; replace swords with the raid ticket.
- [x] 3.3 Show alliance icons on insights rows and LE tier-list filters; rarity icons on guild raid and quest tiers.

## 4. Rewards, goals and raid bosses

- [x] 4.1 Resolve alliance item, badge and orb rewards, shard pools, seasonal currencies, crusade resources, intel, energy, MoW ammo and summoning tokens in the shop reward display; verify with `shop-reward-display.test.ts`.
- [x] 4.2 Use a rank badge and drop-table art for goal-type icons; remove the unused curated generics.
- [x] 4.3 Show raid boss set chests as tier art and name.

## 5. Sprites

- [x] 5.1 Add every new sprite to `datamine/sprites.txt` and copy it from the pinned data-mines; verify the CI folder check passes.
