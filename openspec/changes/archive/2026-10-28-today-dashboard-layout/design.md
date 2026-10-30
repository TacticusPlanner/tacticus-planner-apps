## Context

See proposal.md for motivation. The design decisions come from `tacticus-planner-docs/ux/wireframes/daily-raids-today-handoff.md` (proposal C). The code-level guide is `daily-raids-today-implementation.md` §3, in the same folder. This design records where the plan departs from that guide after reading the current code.

Current shape (`apps/web/src/fsd/pages/dailies/ui/today-page.tsx`, 399 lines):

- `TodayPage` renders the controls (project, Raids Filters, Planning settings), the quick filter chips on their own row, then `TodaySchedule` or `RaidState`, then `TodayShops`.
- `TodaySchedule` derives everything inline: `selectTodayRaids`, bonus slicing, the combined attempts map, `planResourceByBattle`, Onslaught runs and energy percent. It renders the summary header, three auto-fit lanes (`today-lanes`) and the Onslaught section.
- `RaidSchedule` (`features/daily-raids/ui/raid-schedule.tsx`) flows whole goal groups through CSS columns (`md:columns-[20rem]`, groups `break-inside-avoid-column`). The cards inside a group are a one-column grid, so a one-goal day is one column wide whatever the container.
- `TodayShops` is only used on Today. It switches between `ShopsDesktop` and `ShopsMobile` by `useIsMobile()`.
- `DailiesLayout` wraps every Dailies tab in `PageContainer` (`max-w-400`).

## Goals / Non-Goals

**Goals:**

- Fill wide monitors and fit the 110 BS player's day in one desktop screen (handoff §12).
- Keep all calculations as they are. Every number comes from the same selectors and hooks as today.
- Keep one derivation path for the page's numbers, shared by the cards, the tiles and (in the next change) the mobile segments.

**Non-Goals:**

- A distinct mobile form. In this change, mobile renders the same dashboard collapsed to one track. Segments come in `today-mobile-segments`.
- Changing Plan › Schedule, the Home raids widget, `ResourceCard`, `selectTodayRaids`, `useDailyRaids`, `buildOnslaughtRuns` or `useShopRecommendations`.

## Decisions

### 1. One pure view model in the page slice

`pages/dailies/ui/today/today-view-model.ts` exports `buildTodayView(raids, { showAllBonus })`. It moves the derivations out of `TodaySchedule` verbatim: the selection, the bonus slice and `bonusHasMore`, `scheduleProps`, the plan and bonus node counts, attempt rows and totals, `planResourceByBattle`, Onslaught runs and whole tokens, the energy percent and `overLimit`, and the planned totals. Cards and tiles read only from it.

- `overLimit` is `selection.energyLimitReached`, not `percent >= 100`, so the tile and the list switch together. The two can differ when `dailyEnergy <= 0`, which means "no limit".
- At the limit, `bonusShown` is every entry, whatever `showAllBonus` is.
- Visible node counts use `isLocationVisible`, the rule `RaidSchedule` applies, now exported from `features/daily-raids/index.ts`. A second copy of the rule would drift.

_Alternative_: keep derivations in each card. Rejected. Tiles and cards show the same totals (Onslaught tokens appear in both), and the design rules ask for one canonical structure with summaries derived from it.

### 2. Dashboard grid with container queries and stacked side columns

`today-dashboard.tsx` is an `@container` with a grid that is 1 track by default, 2 tracks at `@[42rem]` and 4 at `@[84rem]`. It has three children: the plan area (`@[42rem]:col-span-2`), side 1 (a flex column with Bonus raids, then Shops) and side 2 (Onslaught, then Today's attempts).

- Container queries measure the dashboard's own width, so the section menu's open or collapsed state and the 150rem cap need no JavaScript. The repo already uses Tailwind v4 container queries (`widgets/battle-preview/ui/enemy-list.tsx`, `shared/ui/responsive-dialog.tsx`).
- Each side column is one flex stack, so cards close up when one is missing and never inherit a row height from another column.
- DOM order is the reading order at every track count. No CSS `order` and no grid areas.

_Alternatives_: `grid-template-areas` with a different order per breakpoint (rejected: the visual order and the focus order would differ), and JS-measured masonry (rejected: fragile, and the handoff forbids it).

### 3. Opt-in `cardLayout` on `RaidSchedule`

`RaidSchedule` gains `cardLayout?: "stacked" | "grid"`, defaulting to `"stacked"` (today's output).

- With `"grid"`, the root drops CSS columns (`flex flex-col gap-4 md:gap-5`), groups drop `break-inside-avoid-column`, and each group's card grid adds `md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]`. The bonus fallback block drops `break-inside-avoid-column` too.
- Today passes `"grid"` through `view.scheduleProps`, so the plan card, the bonus card in both modes and the later Raid now panel all get it. In the narrow side column, `auto-fill` yields one column anyway.
- The prop lives in `features/daily-raids` because `RaidSchedule` is that slice's public UI. It is not a page-to-page or feature-to-feature import.

_Alternatives_: card-level CSS columns with `column-span: all` goal headers (rejected: behaves badly with several groups and is hard to test), and a plan card one track wide (rejected: wastes the wide layout).

### 4. Shops: one card form; `ShopsDesktop` removed

`TodayShops` renders a `TodayCard` (`testId="today-shops"`) that always uses `ShopsMobile`. `ShopsState` gains `compact`, which renders the nothing-to-buy state as one line of text. `shops/desktop/shops-desktop.tsx` is deleted.

_Departure from the guide_: the guide added `variant?: "section" | "card"` and kept the section form. `TodayShops` has no other consumer, so the section form and `ShopsDesktop` would be dead code that knip flags. V2 is greenfield, so removing them is the simpler state.

### 5. Shared card shell and states

`today-card.tsx` wraps the shadcn `Card` at `size="sm"` with `role="region"`, `aria-labelledby` (via `useId`) and a header row (h2, optional meta, optional action). The plan card's resource cards get `bg-background` through a descendant selector on the wrapper. If that hits anything unintended, a `tone` prop on `RaidSchedule` → `ResourceCard` (location path only) replaces it.

- `RaidState` gains `variant?: "card" | "inline"` so the plan card holds the loading, error, no-goals and no-farmable states without nesting a card in a card.
- The plan card always renders; while raids aren't ready it holds `RaidState`. Shops always render. Bonus raids, Onslaught and Today's attempts render only when raids are ready.
- The error state has no Retry button, as today. `useDailyRaids` exposes no retry, and that stays a follow-up.

### 6. Glance tiles and the campaign event tile

`today-glance.tsx` renders `<section aria-label>` → `<dl>` with `GlanceTile`s (`dt` label, `dd` value) in a `repeat(auto-fit,minmax(12rem,1fr))` grid.

- `campaign-event-status.tsx` splits into `useCampaignEventDetail()`, which holds the existing string building unchanged, and `CampaignEventTile`, which renders the value with `break-words`, not `truncate`. `CampaignEventStatusLine` goes away, and the two test mocks of it are updated.
- The over-limit colour is a new token, `--energy-over` (light `#9a6a00`, dark `#d9a032`), registered in `@theme inline` as `--color-energy-over`. Its contrast against `--card` is checked to be at least 4.5:1 in both themes, and the hex is adjusted if it fails.
- There is no Daily reset tile. Neither the apps nor the API knows when raid attempts reset (the handoff's open question 1).

### 7. Width cap on Raids only

`DailiesLayout` passes `className="max-w-[150rem]"` to `PageContainer` when `useMatch("/dailies/raids")` matches. `cn()` (tailwind-merge) lets it override `max-w-400`.

### 8. Controls row

`TodayControls` (page slice) renders the inline quick filter chips, then the three existing triggers, in a `flex flex-wrap justify-end` row. `TodayQuickFilterChips` gains `layout?: "stacked" | "inline"`, defaulting to `"stacked"`. Inline puts the caption on the chips' line, and each note gets `basis-full` so it sits on its own line under the row.

### 9. Desktop and mobile in this change

The desktop and mobile forms do not diverge yet. Below 768px, the container is narrower than 42rem, so the grid is one track: tiles, then Plan, Bonus raids, Shops, Onslaught, Today's attempts. That reorders today's mobile page (Shops used to come last), which is acceptable as an interim until `today-mobile-segments` lands.

The tour shares every step between desktop and mobile except the first. Its targets are:

| Step                  | Target                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| navigation (desktop)  | `desktop-section-navigation` or, when collapsed, `desktop-section-toggle`; placed `right` because the open menu runs the full page height |
| navigation (mobile)   | `section-tabs`                                                                                                                            |
| filters, quickFilters | unchanged test ids                                                                                                                        |
| campaignEvent         | `campaign-event-status` (now the tile)                                                                                                    |
| energyUsage           | `energy-usage` (now the tile)                                                                                                             |
| schedule              | `today-plan-area`, the plan grid area wrapper                                                                                             |
| todaysAttempts        | `todays-attempts`                                                                                                                         |
| onslaught             | `today-onslaught`, optional                                                                                                               |
| shops steps           | unchanged; the two offer-group steps optional                                                                                             |

Optional steps carry `data: { optional: true }`, so the tour runner's existing `withoutMissingOptionalSteps` drops them at tour start when their card is not rendered (no Onslaught run today, nothing worth buying).

_Departures from the guide_:

- The guide targets `today-plan-card`, but at the energy limit that card is not rendered and the step would lose its target. The wrapper always exists and holds whichever card is shown.
- The old navigation target `dailies-primary-tabs` no longer existed (Dailies' child pages moved to the shell's section menu and tabs), so the step was silently skipped before this change. It now targets the shell's navigation per platform.

### 10. Test ids

- Kept: `dailies-raids-layout`, `today-page`, `today-raid-list`, `bonus-raid-list`, `bonus-raids-heading`, `bonus-energy-limit-reached`, `todays-attempts`, `todays-attempts-list`, `todays-attempt-<id>`, `today-onslaught*`, `today-shops`, `energy-usage*`, `campaign-event-status`, `today-quick-filters*`, and the controls' ids.
- Removed: `today-schedule`, `today-lanes`, `today-lane`, `bonus-lane`.
- Added: `today-controls`, `today-glance`, `today-grid`, `today-plan-area`, `today-plan-card`, `bonus-card`.

## Risks / Trade-offs

- [Cards in one grid row share a height, so a 1-location card next to a 3-location card leaves a gap] → Resource cards vary little (1–3 rows). Accepted in the handoff; check it in the 2560 screenshot.
- [A long Today's attempts list (30–40 rows on heavy days) makes side 2 tall] → It grows below the fold, which is acceptable. A row cap is a separate decision (handoff open question 2).
- [The descendant selector for the inset card background could restyle nested cards] → Check visually; fall back to a `tone` prop (decision 5).
- [Interim mobile order differs from today's] → Short-lived until `today-mobile-segments`; verified in the mobile task group.
- [`--energy-over` contrast] → Checked with a contrast tool in both themes before merge.
- [Removing `ShopsDesktop` loses the multi-column shop layout if a wide shop page returns] → It is in git history; a future shop page can restore it.
