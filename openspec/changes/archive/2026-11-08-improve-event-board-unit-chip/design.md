## Context

See proposal.md (Why) and the delta specs for the behaviour. What existed before this change:

- **The chip.** `EventBoardUnitChip` (`pages/legendary-events/ui/legendary-event/overview/event-board-unit-chip.tsx`) is used twice in `event-board.tsx`: by `UnitTable` (inside a `<button>` that starts a team) and by `TeamLine` (inside the team row `<button>`, with `showStars`). Its data, `EventBoardUnit`, comes from `eventBoardUnit(unitId, rosterById)` in `event-board.view-model.ts`.
- **Teams tab cards.** `teams/team-card.tsx` renders members as bare `EntityIcon` portraits. Its `TeamCardMember` holds only `unitId` and `owned`, built in `buildTeamCardViewModel`, which already has `rosterById`.
- **Colour tokens.** The rarity tokens nearly duplicate the rank tokens in `packages/ui/src/styles/globals.css`. `theme-contrast.test.ts` already checks token contrast relationships.
- **Tooltip.** The shared `@workspace/ui` `TooltipTrigger` opens and toggles on **touch tap**, which would fight the chip's own tap action. The `Popover` is also available.
- **Settings storage.** `usePersistedSelection` (`shared/lib/browser`) is the per-browser store the lane switches use.
- **Names.** `useUnitName` gives the display name. `useUnitSearchNames` returns the unit's other names in the current language from `unitSearchNames`.
- **Design input.** Claude Design's "LRE unit chip redesign", artboard 7 (`Downloads/lre-unit-chip-implementation-handout.md`). This design adopts it, except that chips show no stars anywhere and the rarity badge reuses the game's rarity art (user decisions).

## Goals / Non-Goals

**Goals:**

- One chip component, used by the unit table, the saved-team rows and the Teams tab cards.
- The details are reachable by mouse, keyboard and touch, without changing what a tap does today.
- No new dependency.

**Non-Goals:**

- Changing how rarity is derived. It stays `progressionRarity(progression)`, with no V1-style boost from rank.
- Changing the order of the unit table or the "best five" line.
- A display menu beyond the one Rank shading switch.

## Decisions

### D1. One `EventUnitChip` in the `legendary-event` entity

- **Where it lives:** `entities/legendary-event/`:
  - `ui/event-unit-chip.tsx` (`EventUnitChip`), `ui/event-unit-chip-details.tsx` (the details content), `ui/rarity-badge.tsx`;
  - `lib/event-unit-chip-data.ts` (`EventUnitChipData` plus `eventUnitChipData(unitId, rosterById)`, moved from `eventBoardUnit`/`EventBoardUnit`) and `lib/event-unit-chip-layout.ts`;
  - `model/use-event-unit-chip-names.ts`, `model/rank-shading.tsx` (the provider) and `model/rank-shading-context.ts` (the context and `useRankShading`).
- **Why there:** the chip has four consumers in three slices: the Event board and the team cards (the page), the team picker (`features/legendary-event-plan`) and the token cards (`features/legendary-event-tokens`). Features can't import from a page, so the chip sits below all of them.
- **Rejected: a page-level `unit-chip/` folder.** That was the first plan, when only the board and the team cards used the chip; it stopped working once the picker and token cards adopted it.

### D2. Teams cards get the same data, not a second mapping

`TeamCardMember` becomes `EventUnitChipData`. `buildTeamCardViewModel` calls `eventUnitChipData(unitId, rosterById)` for members and the reserve. That's the same derivation the board uses, so rank, ascension and ability levels can't drift between the board and the cards. The `owned` semantics are unchanged: `undefined` when there is no roster.

### D3. Rarity badge: the game's rarity art

- **Art:** `rarityIcon(rarity)` from `@workspace/game-catalog`, the lettered hexagon the shared `RarityIcon` already shows (leaderboards, team recs, goal creation). Drawn at 18px, overlapping the portrait's bottom-left corner (20px read too heavy next to the portrait).
- **Not the shared `RarityIcon` component itself:** it brings its own tooltip and `alt` label. On a chip the badge is decorative (`aria-hidden`), since the chip's accessible name and details already carry the rarity, and a tooltip inside the chip's tooltip would fight it.
- **Rejected: a CSS hexagon with a new `--rarity-badge-*` palette.** It duplicated a rarity style the app already has.
- **Unchanged:** the existing `--rarity-*` tokens stay for other pages.

### D4. Chip layout

- **Two layouts** from Claude Design's handout. `eventUnitChipLayout` (`lib/event-unit-chip-layout.ts`) picks one per place, the same for every chip there:
  - **Row (N1):** portrait → rank → the name over the A/P levels (side by side), with traits at the end. About 42px tall.
  - **Stack (N4):** the name across the top, then portrait → rank → A/P (stacked) → traits. About 59px tall.
- **Shared parts (one size everywhere):** the name is `text-sm` (14px)/600 with a 16px line height and `truncate`; the portrait is 32px, with an 18px rarity badge on its bottom-left corner; the rank icon is 24px, with a faint dark `drop-shadow` outline so the medal reads on its own rank colour; the A/P numbers are 12px/700 and their letters 10px/500. A row is about 42px tall, a stack about 59px.
- **How it switches:** one CSS grid with named areas (`name`, `portrait`, `rank`, `abilities`, `traits`), whose `grid-template-areas` change between the layouts. There's no second markup tree.
  - **The unit table:** each chip sits in an `@container` wrapper as wide as its column. One container query turns it into a row from 8.5rem. That's about 70px of fixed parts plus a ~66px name slot. All columns share a width, so the whole board switches at once: three lanes switch from about 2500px (8.7rem columns at 2560px), two lanes from about 1700px, one lane always. At 2560px with three lanes, 24 of 119 names end in an ellipsis (Shadowsun, Morvenn Vahl, Mephiston…), and on Healer and Mechanic chips the trait icon squeezes the name and levels further; the full name is in the details. Rows bring the board's chips from 59px to 41px, so a lane shows about 40% more units before scrolling.
  - **Rejected: switching at 9.5rem** (a ~77px name slot, 108 of 120 names in full): three lanes then never got rows, even at 2560px. The user chose rows there over full names.
  - **Team cards and token cards:** these chips size to their content, so they are always rows. They grow with the name up to their 10rem cap.
  - **The picker** (no name) stacks.
- **One layout per place, not per chip:** a column or a team never mixes 42px rows with 59px stacked chips.
- **Rejected: deciding per chip from each name's length.** It fit more names as rows, but it mixed heights within a column.
- **Width:** `w-full` in the table, where it fills its column (at least 5.9rem). Elsewhere it sizes to its content, between `min-w-24` and `max-w-[10rem]`.
- **No stars on the chip** (no `showStars` prop). Ascension stars show only in the details (D6).
- **Locked:** the chip keeps a `title`-free accessible name and its existing "Locked" text.
- **Board columns:** at least 5.9rem (`COLUMN_MIN_REM`), the stacked chip's ~94px, with 8px side padding on the lane cards. Three lanes of five fit side by side from about 1920px with the sidebar open; narrower screens scroll the table sideways inside its box. The table content is at least the columns' minimum wide (not `w-max`, which widened each column to its heading's unwrapped label).
- **Sizes, decided:** an earlier compact pass (11/10/8px text, 24px portrait, 4.375rem columns) fit three lanes at 1536px, but everything read too small. The user chose bigger chips everywhere over fitting three lanes on a laptop.
- **Sizing scale:** `main`'s `ui-sizing` lint rule bans hardcoded sizes, so the 13px name became `text-sm` and the 10px A/P letters `text-xs` (10px is kept for numerals on badges); the 18px badge is the `size-4.5` spacing step.
- **Ability levels:** the A and P letters are lighter (`text-xs`, 500) than the numbers (`text-xs`, 700), so "A55 P60" doesn't read as one block.
- **Starting a team from the board:** a small "+" shows on a board chip on hover and keyboard focus, saying what a click does.
- **Best seven, every screen:** each column lists its best seven (the team line and two more below it), and "Show all units (up to N)" lists the rest for every column of the lane at once. First phone-only (a scroll box inside the scrolling page traps the swipe); the user extended it to every screen, so the lanes stay short and their teams sit right under them. On phones (below 768px) the table doesn't scroll vertically inside the page; from 768px, a lane shown in full scrolls inside its box as before. Sideways it still scrolls inside its box.
- **Team cards:** five named chips (~500px) and the coverage strip (~196px) don't share a line in a 350–500px lane. The strip moves into the card header beside the team name when the card is at least 28rem wide (an `@container/card` query). Narrower cards give it a line of its own under the name: phones, tablets, and three lanes below ~1920px. There its slots may shrink from 36px to 32px rather than wrap. Checked in the browser from 375 to 2560px: placing it beside the name at every width left the name 0–80px on 286–371px cards.

### D5. Rank shading: one provider for the page

- **Provider:** `RankShadingProvider` wraps the event page (`legendary-event-page-view.tsx`) and reads `usePersistedSelection("legendaryEvents.unitChips.rankShading", isOnOff, "on")` once. Chips read it with `useRankShading()`; outside a provider they are shaded, the default.
- **Why a context, not a prop:** the first plan passed `shaded` down from two call sites (the board and the Teams section). Once the team picker and the token cards (in features, inside dialogs and popovers) showed chips too, threading a prop through every layer cost more than one provider, and one provider keeps every chip on the page on the same switch without a storage read per chip.
- **The switch** (`RankShadingSwitch`) sits in the Event board header, beside its title.
- **Tint:**
  - background `color-mix(in oklab, var(--rank-x) 30%, var(--card))` (was 60% with transparent);
  - border `color-mix(in oklab, var(--rank-x) 70%, var(--card))`.
- **Off:** the plain `bg-card` and `border-border`.

### D6. Details: shared Tooltip for mouse and keyboard, long-press plus Popover for touch

- **Content:** `EventUnitChipDetails` renders the details (long name, badge with rarity name and the stars/wings icons from `progressionVisual`, rank name, "Active n · Passive n"; "Not owned" for locked units). Both the tooltip and the popover use it.
- **Mouse and keyboard:** the shared `Tooltip` with `delayDuration` 300ms.
- **Opt-out flag:** the shared `TooltipTrigger` gets an opt-in-to-skip prop, `disableTouchToggle`, that turns off its tap-to-open behaviour, so a tap on a chip only does the chip's action. This is a small, backward-compatible addition to `packages/ui`, with a test.
  - Rejected: using Radix `TooltipPrimitive` directly in the app. That bypasses the package's styling wrapper.
  - Rejected: hiding the tooltip on touch by `(hover: none)`. Hybrid devices would lose hover.
- **Touch:** a new generic `useLongPress({ onLongPress, delay = 450, moveTolerance = 10 })` in `shared/lib/browser`:
  - It starts a timer only on `pointerType === "touch"` and cancels it on pointerup, pointercancel, or movement over 10px (so scrolling the table never triggers it).
  - When it fires, it swallows the following click in the capture phase (`preventDefault` + `stopPropagation`), so neither the table `<button>` nor a surrounding control (a picker tile) runs its action.
  - It also prevents `contextmenu` and sets `-webkit-touch-callout: none` / `select-none` on the chip.
  - When it fires, it opens a controlled `Popover` anchored on the chip; tapping outside closes it.
- **Focusability:**
  - In `UnitTable`, the tooltip trigger is the existing `<button>` (`asChild`).
  - On the team card (`focusable`), the trigger is a `<button>` that opens the details panel, so keyboard users can read a member's stars and rank (the accessibility review found them pointer-only otherwise).
  - In the team picker and the token cards, the trigger is a non-focusable `<span>`, so nothing nested inside another control becomes interactive.
  - Each `UnitTable` is one Tab stop with a roving `tabIndex` (`useBoardGridFocus` in `event-board.tsx`): the arrow keys move between units, Home and End within a column. Without it a keyboard user tabbed through 366 units at 1920px before reaching the first team.
  - The focus ring is the solid `ring-ring`: `ring-ring/50` measured 2.2:1 (dark) and 2.35:1 (light) against the card, under the 3:1 minimum.
- **Accessible name:** it uses the long name, which `useEventUnitChipNames()` resolves: the first entry of `useUnitSearchNames()(id)` if it differs from the display name, otherwise the display name.
- **Hover vs touch:** this split is input-based, not viewport-based, so the same code path serves desktop and mobile. There's no layout fork and no Joyride target change. The tour doesn't target the board's chips or the team card members (checked in `legendary-event.tutorial.tsx`).

### D7. Found along the way

- **Tabs focus ring after a tap:** Radix `Tabs` focuses a trigger by script on mousedown, and Chrome then draws the keyboard focus ring after a click or tap. The shared `TabsTrigger` (`packages/ui/src/components/tabs.tsx`) now focuses itself first with `focusVisible: false`, which makes Radix's call a no-op; keyboard focus keeps its ring. It affects every tab strip in the app, not only the event page.
- **Collection compare type error:** `pages/my-game/model/compare-chips.ts` missed the `power` sort that `main` added to `CollectionSort`, which broke `pnpm typecheck` on `main`. Its `orderChip` map now covers it (the power chip), so this change's gates pass.
- **Lazy settings button test:** `app/layout/section-actions.test.tsx` waits up to 10s for the lazy-loaded Legendary Event settings button: the `legendary-event-plan` feature it loads now pulls in the chip, and its first load ran past the default 1s wait.

## Risks / Trade-offs

- **[A lane shows only seven units per column until "Show all"]** → The best five, the part that matters, plus two spares are always in view; "Show all" is one click per lane. Shown in full, the table scrolls inside its box (`max(34rem, 100dvh - 18rem)`) from 768px.
- **[Five chips wrap to two or three lines on Teams cards]** → Accepted. Names over rows; the cards already wrap.
- **[Long-press vs. scrolling and text selection on touch]** → The movement tolerance cancels the timer; `select-none` and the contextmenu suppression stop the iOS callout. This gets checked manually on a touch emulator.
- **[`unitSearchNames` is about 50% identical to English in de/es/fr]** → Acceptable: it holds the game's own names for each language. We show whatever the current language has and never mix languages ourselves.
- **[Changing the shared `TooltipTrigger`]** → The prop is opt-in and defaults to today's behaviour, and the existing `tooltip.test.tsx` keeps covering the default.

## Migration Plan

Frontend only; there's nothing to migrate. The new storage key defaults to "on", which matches today's shaded look. Rollback is a revert.
