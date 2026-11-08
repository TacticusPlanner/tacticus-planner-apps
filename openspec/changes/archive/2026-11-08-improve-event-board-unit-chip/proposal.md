## Why

Players comparing the V2 beta with V1 say they can't tell **which character** a unit is or **what ascension tier** it has at a glance on the Legendary Event board. The chip shows no name (it is only in a native `title` tooltip, which touch devices never show), and ascension is only a 2px ring whose rarity colours nearly match the rank-colour background behind it (`--rarity-epic` = `--rank-gold1`, `--rarity-legendary` = `--rank-diamond1`, …). The rank shading is also always on, while V1 lets players turn it off. Players share screenshots of their team lists, so these lists need to be readable without hovering.

## What Changes

- The Event board unit chip gains the unit's **display name** (the game's extra-short name, e.g. "Helbrecht"), truncated with an ellipsis when it doesn't fit. It sits **beside the portrait** in a single row (design N1) on team and token cards, and in the unit table once its columns are 8.5rem wide (three lanes from about 2500px). Narrower columns put it **across the top** (design N4). Every chip in one place shares the layout.
- The rarity-colour **ring is replaced by the game's lettered rarity hexagon** (C / U / R / E / L / M) on the portrait, the same `rarityIcon` art the app already shows for rarity (e.g. on the leaderboards).
- **Stars leave the chip everywhere**: unit table, saved teams, team cards, the team picker and token cards. They show only in the unit details (hover, focus or long-press).
- The **rank shading** becomes lighter and gets a per-browser **"Rank shading" switch** (default on), shared by every chip on the event page.
- The native `title` is replaced by a **unit details tooltip**: the unit's longer name, rarity with its stars, rank name and ability levels. It shows on mouse hover and keyboard focus; on **touch, a long-press** opens the same details, and a normal tap keeps today's action.
- **Teams tab cards** show their members (and reserve) as the same chip instead of bare portraits. Each member chip is a button that opens its details, and the card's coverage strip sits beside the team name when the card is wide enough, on its own line otherwise.
- **Starting a team from the board** shows a small "+" on a unit chip on hover and keyboard focus.
- **The unit table lists each column's best seven units**, with "Show all units" for the rest, on every screen, so the lanes stay short and the teams sit right under them; on a phone the table no longer scrolls inside the scrolling page.
- **Keyboard:** each lane's unit table is one Tab stop, with the arrow keys moving between units, and focused chips show a full-strength focus ring (an accessibility review found hundreds of tab stops and a 2.2:1 ring).
- The chip grows: a 14px name (`text-sm`), 12px ability levels, a 32px portrait and a 24px rank icon (with a faint dark outline so the medal stands apart from its own rank colour); at the earlier 11/10px sizes everything read too small. Three lanes of five then fit side by side from about 1920px; narrower screens scroll the unit table sideways.

Out of scope: V1-style one-row-per-character layouts, a share/export view, goals preview on chips, trait/relic/bias markers, rank-boosted rarity (V1 shows a D3+ unit as Mythic; V2 keeps the unit's actual ascension).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `legendary-events-hub`: the Event board requirement's chip description changes (name line, letter badge in place of the ring, no stars on chips, switchable lighter rank shading). New requirements cover the unit chip, its details tooltip with long-press on touch, and the Rank shading setting.
- `legendary-event-teams`: the Teams section card shows its members and reserve as unit chips instead of bare portraits.

## Impact

- **Code (apps/web only, no API change, no companion `tacticus-planner-api` change):**
  - The chip moves from `pages/legendary-events/ui/legendary-event/overview/event-board-unit-chip.tsx` into the `legendary-event` entity as `EventUnitChip`, as the team picker and the token cards use it too.
  - `overview/event-board.tsx` (`UnitTable`, the Rank shading switch, the best-seven list, keyboard movement).
  - `teams/team-card.tsx` and `teams/teams.view-model.ts` (members need rank, ascension and ability levels from the roster).
  - The team picker and the token popovers drop stars from their chips.
  - A new generic long-press hook in `shared/lib`.
  - Found along the way: the shared `TabsTrigger` no longer shows the keyboard focus ring after a tap, and `pages/my-game/model/compare-chips.ts` gets the `power` sort `main` was missing (it broke `pnpm typecheck`).
- **UI package:** `theme-contrast.test.ts` covers text contrast on the 30% rank tint. `TooltipTrigger` gets an opt-in `disableTouchToggle`, `TabsTrigger` its tap fix; the `popover` is reused.
- **i18n:** new `legendaryEvents` keys (Rank shading label, tooltip lines, "Not owned", the unit table's "Show all" / "Show the best", the arrow-key hint) in en/de/es/fr. Long names are read from the existing `unitSearchNames` namespace.
- **Layout:** board chips grow from 36px to about 59px tall, so the unit table shows about 9 instead of 14 units before scrolling; five-member team lists wrap to two or three lines.
- **Tests:** `event-board.test.tsx`, `team-card.test.tsx`, `tooltip.test.tsx` and the chip tests are updated; there's no tutorial change, because the tour doesn't target the Event board or team members.
