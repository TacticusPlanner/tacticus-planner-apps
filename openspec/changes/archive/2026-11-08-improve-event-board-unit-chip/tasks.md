## 1. Shared building blocks

- [x] 1.1 Extend `theme-contrast.test.ts` to assert ≥ 4.5:1 text contrast on every 30% rank tint, in both themes. (The rarity badge reuses the game's `rarityIcon` art, design D3, so it needs no new tokens.) Verify: `pnpm --filter @workspace/ui test:run` passes.
- [x] 1.2 Add the opt-in `disableTouchToggle` prop to `TooltipTrigger` in `packages/ui/src/components/tooltip.tsx`; when set, a touch tap doesn't open or toggle the tooltip. Verify: a new case in `tooltip.test.tsx` (touch tap with the prop leaves it closed and still calls `onClick`) passes, and the existing default-behaviour cases still pass.
- [x] 1.3 Add `useLongPress` to `apps/web/src/fsd/shared/lib/browser` and export it from the barrel. Behaviour: touch only, 450ms, 10px move tolerance, swallows the following click in the capture phase, prevents `contextmenu`. Verify: unit tests with fake timers cover fire, early release, movement cancel, mouse pointer ignored, and click suppression after firing.

## 2. Unit chip

- [x] 2.1 Move the chip's data into the `legendary-event` entity: `EventBoardUnit` → `EventUnitChipData` and `eventBoardUnit` → `eventUnitChipData` in `lib/event-unit-chip-data.ts`, with its tests, and update the board's imports (design D1). Verify: `event-unit-chip-data.test.ts` and `event-board.view-model.test.ts` pass.
- [x] 2.2 Add `useEventUnitChipNames()`, which returns `{ displayName, longName }` per unit id (long name = the first `useUnitSearchNames` entry when it differs from the display name). Verify: tests for `templHelbrecht` ("Helbrecht" / "High Marshal Helbrecht") and a unit with no other names (both equal the display name).
- [x] 2.3 Add `RankShadingProvider` (`model/rank-shading.tsx`) over `usePersistedSelection("legendaryEvents.unitChips.rankShading", …, "on")` and `useRankShading()` (`model/rank-shading-context.ts`), and wrap the event page in the provider (design D5). Verify: tests for default on, toggled off, and the value surviving a remount.
- [x] 2.4 Build `EventUnitChip` (`ui/event-unit-chip.tsx`, props `unit`, `showName`, `fill`, `action`, `focusable`):
  - a truncated name: beside the portrait (row, N1) or across the top (stack, N4), one layout per place (`eventUnitChipLayout`), the unit table switching at an 8.5rem column by container query;
  - the portrait without the ring, with the game's rarity art as an 18px badge on its bottom-left corner (`ui/rarity-badge.tsx`);
  - a 24px rank icon with a faint outline (32px portrait, `text-sm` name, `text-xs` levels with lighter letters, all on the app's sizing scale);
  - A/P;
  - no stars (the picker and token cards drop `showStars` too);
  - the 30%/70% tint while Rank shading is on;
  - the locked and no-roster states;
  - the accessible name using the long name;
  - a "+" on hover and keyboard focus of an action chip.

  Delete `overview/event-board-unit-chip.tsx`. Verify: `event-unit-chip.test.tsx` covers "Owned unit chip" (including the exact accessible name), "Long name is cut, not wrapped", "Locked unit chip", "No roster", shading on/off, no stars and the "+"; `event-unit-chip-layout.test.ts` covers the layout per place.

- [x] 2.5 Add `ui/event-unit-chip-details.tsx` (long name, badge plus rarity name plus stars/wings, rank name, "Active n · Passive n"; locked: "Not owned"; no roster: long name only). Wire it into `EventUnitChip`:
  - the shared `Tooltip` (300ms, `disableTouchToggle`) on the trigger;
  - `useLongPress` opening a controlled `Popover` with the same content;
  - the trigger is the chip's button with `action` (table), a button opening the details with `focusable` (team cards), otherwise a non-focusable span (picker, token cards).

  Verify: tests for the hover details content, keyboard focus on a table chip showing details, a focusable chip opening the details, long-press opening the popover without running the action, a normal tap running it with no popover, and the locked details.

- [x] 2.6 Add the i18n keys in `legendaryEvents` (`unitChip.*`: abilities, notOwned, rankShading, rankShadingHint; `eventBoard.showAll`, `showBest`, `keysHint`) in en/de/es/fr. Verify: `event-unit-chip-translations.test.ts` asserts every new key exists in de/es/fr, differs from English and keeps its placeholders. The rarity letters come from the game's rarity art, so they need no keys.

## 3. Surfaces

- [x] 3.1 In `event-board.tsx`, render `EventUnitChip` in `UnitTable` (fill the column, the chip as the start-team button). Columns are at least 5.9rem; the table content is at least the columns' width. Verify: `event-board.test.tsx` covers "Stars only in the details" and the sticky heading row spanning the columns.
- [x] 3.2 Add the "Rank shading" switch to the Event board header. Verify: a test toggles it, asserts chips lose their tint, and asserts that after remounting the board it's still off (spec "Shading turned off", "Default").
- [x] 3.3 Change `TeamCardMember` to `EventUnitChipData`, built by `eventUnitChipData` in `buildTeamCardViewModel` for members and the reserve. Verify: `teams.view-model.test.ts` asserts rank, progression and ability levels for an owned member, and `owned: false` / `undefined` for the locked and no-roster cases.
- [x] 3.4 In `team-card.tsx`, show each member and the reserve as a `focusable` `EventUnitChip` (reserve marked as today, no native `title`), and move the coverage strip beside the team name on cards at least 28rem wide (on its own line otherwise). Verify: `team-card.test.tsx` covers "Partial team shows its count" (three chips), "Members show as named chips" and no stars; `teams-section.test.tsx` passes.
- [x] 3.5 Confirm no tutorial change is needed: `legendary-event.tutorial.tsx` targets neither `event-board-unit` nor `team-card-member` test ids. Verify: `legendary-event.tutorial.test.tsx` passes.
- [x] 3.6 List each column's best seven on every screen, with "Show all units (up to N)" / "Show the best 7". Verify: `event-board.test.tsx` "lists each column's best seven and shows the rest on request".
- [x] 3.7 Make each unit table one Tab stop with the arrow keys, Home and End moving between units (`useBoardGridFocus`), described by "Use the arrow keys to move between units."; give focused chips the solid `ring-ring`. Verify: `event-board.test.tsx` "makes each unit table one Tab stop…".

## 4. Desktop verification (viewport ≥ 768px, signed in, synced roster, an event with saved teams in all three lanes)

- [x] 4.1 On the Teams tab's Event board with three lanes at 1920px: every chip shows a name and rarity badge; no chip shows stars; the German "Der Schöpfungsvater" ends in an ellipsis at the same height (59px) as its neighbours. Checked 2026-11-08 at 1536, 1920 and 2560px (three lanes fit without sideways scroll from 1920px).
- [x] 4.2 Hover a table chip: details appear after the delay with long name, rarity plus stars, rank and abilities, and the "+" shows. Focus the table's chip: details show; Enter opens the editor on a new team ("Add a team to Alpha"). Tab reaches the first team card after 61 stops (210 before 3.7). Checked 2026-11-08.
- [x] 4.3 Switch Rank shading off: 0 of 433 chips tinted on the board and the team cards; still off after a reload; switched back on. Checked in light and dark themes for badge legibility and tint contrast (text contrast is also asserted by `theme-contrast.test.ts`). Checked 2026-11-08.

## 5. Mobile verification (viewport < 768px via a same-origin 390px iframe per the `tp-manual-ui-verification` skill, same data)

- [x] 5.1 Board and Teams cards: chips show name, badge, rank and A/P; each column lists seven units with "Show all units (up to 60)"; five-member rows wrap without horizontal page scroll (at 320px a 9px page overflow comes from the leaderboard's "remaining" column, outside this change). Checked 2026-11-08.
- [x] 5.2 Long-press a table chip: the details popover opens and the team editor doesn't; a click outside closes it. A normal tap opens the editor. Long-press a team card chip: its details open. A 30px drag over a chip never opens a popover. Checked 2026-11-08 with touch pointer events dispatched in the page, as the browser tool has no touch emulation; worth one check on a real phone.

## 6. Gates

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`; all pass.
