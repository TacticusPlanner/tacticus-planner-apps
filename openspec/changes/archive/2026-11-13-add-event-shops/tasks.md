## 1. API contract

- [x] 1.1 Once the API half is implemented, run `pnpm --filter web api:pull --local` and `pnpm --filter web api:types`; verify `schema.d.ts` contains the `event-shops` dataset model, `EventShopPlanResponse` and the `/event-shop-plans` paths. Before merge, re-pin with `api:pull <merge-sha>` (CI rejects a `local` pin)

## 2. Catalog package

- [x] 2.1 Add `event-shops` to `servedDatasetKeys` and to the datasets the cache counts as complete without; add its zod schema (sharing the shop variant schema) with schema tests for a valid payload and a malformed one
- [x] 2.2 Add the `event-shops` IndexedDB store (version bump with a complete `stores()` block), mapper and sync wiring; verify with sync tests (records stored per id, upgrade preserves other stores, absent dataset leaves the catalog ready and reports absent)
- [x] 2.3 Add `getEventShops` / `getEventShop` queries; verify ordering by `startUtc` and `undefined` for an unknown id
- [x] 2.4 Add pure helpers `eventDayIndex`, `eventStatus`, `eventDay`, `defaultEventDay`, `resolveEventDaySlots` with injected `now`; verify the spec scenarios (Wednesday-start August mapping to week 2 THU 2026-08-13, upcoming/ended defaults, Yarrick MON/THU/SUN availability, slot 7 resolving to mythic orbs at the high tier) in unit tests

## 3. Event shop plan entity

- [x] 3.1 Add `entities/event-shop` with API wrappers over the generated client and TanStack query/mutation (`useEventShopPlan`, `useSaveEventShopPlan`) mapping 409 `eventShopPlanStale` to a typed error carrying `current`; verify with API wrapper tests (200, empty revision-0 plan, 409)

## 4. Game text

- [x] 4.1 Extend `scripts/generate-game-names-i18n.mjs` with the `eventMissions` namespace (seasonal task templates, mission chain names, game-mode names) in en/de/es/fr, register its resource type, and commit the generated files; verify the script runs clean on the pinned datamine and that `TraverseHexes`, `October2026FreeMissionChain` and `Quest_GameMode_Survival` resolve in all four locales

## 5. Planner model

- [x] 5.1 Add `@x` slices: `shop-recommendations/@x/shops/event-planner.ts` (`aggregateShopNeeds`), `goal-planning/@x/shops/event-planner.ts` (missing resources), `shop-rewards/@x/shops/event-planner.ts`; verify existing consumers' tests still pass and `pnpm lint:fsd` is clean
- [x] 5.2 Implement `cart.ts` (add, replace option with confirm flag, set quantity within cap, mark all bought, bought fewer, remove, all of today bought, needs-review Bought / Bought some / Missed via `dropUnbought`, clear week, undo bought ahead, draft alliance, drop unresolvable) with unit tests per spec rule, including the Clear week scenario (a stays, b keeps 1 bought, c and d leave)
- [x] 5.3 Implement `classify.ts`, `shopping-list.ts` and `day-state.ts` (Needs review, Today, later days, Done, All view, totals + cart total, per-day state, review count, bought ahead); verify the worked totals example (90 / 140 / 160 = 390 in cart), partial past entry, today-as-upcoming, bought ahead and the ended-event recap
- [x] 5.4 Implement `slot-labels.ts` (tier and unit-progress subtitles, unsynced option lists) with tests for the Yarrick and slot 7 scenarios and the unsynced case
- [x] 5.5 Implement `coverage.ts` using the D5 reward mapping, `planned` from classified `toBuy` packs only, cheapest offer over remaining days, full-price estimate, max still buyable, "N short" and the sort order; verify both worked examples (Yarrick: planned 50, still needed 60, 3 packs, 135, not short; badges: still needed 300, max 200, 100 short, 30 packs, 450), draft alliance routing and XP book conversion
- [x] 5.6 Implement `use-event-shop-cart.ts` (optimistic updates, 400 ms debounce, one save in flight, 409 reload + notice, drop-unresolvable notice) and `unit-shard-search.ts`; verify with hook tests using fake timers and a mocked 409

## 6. Page UI

Reference: the canvas FINAL boards (design.md, Context).

- [x] 6.1 Add routes `/dailies/event-shop` (redirect to default event) and `/dailies/event-shop/:eventId` (unknown id → redirect + notice) and the Dailies nav child; verify with route tests including the default-event rules
- [x] 6.2 Build the header (event picker newest first, name from the calendar definition + localized month/year, status badge, date range, reset in local time, "Synced N ago" / "Not synced", the selected week's income when served); verify with component tests including a Europe/Prague reset time
- [x] 6.3 Build the day pickers inside the Shop tab: the week calendar (legend, seven columns with planned-item icons by state, previous/next week for multi-week events) and the phone day chips with status dots, both backed by `?day=`; verify with component tests at both widths and that other tabs show no picker
- [x] 6.4 Build slot cards (desktop/tablet) and tiles with the corner tick (phone): tier and progress subtitles, unsynced option lists + sync notice, add / quantity / "Mark N bought" / "Bought fewer…", draft alliance dialog, replace-option confirm; verify with component tests per card state (not in cart, in cart, partly bought, bought, capped, locked, unsynced)
- [x] 6.5 Build the phone slot sheet (header, cost and cap, "Also …" days, planned stepper, "Mark N bought", "Bought fewer…", "Remove from cart"); verify with a component test
- [x] 6.6 Build the shopping list (totals + cart total, Needs review with Bought / Bought some… / Missed, Today with "All of today bought", later days, collapsed Done, Upcoming/All, row "Mark N bought" + ⋯ menu, bought-ahead notice, Clear week link + confirm dialog with counts, ended recap); verify with component tests for each spec scenario
- [x] 6.7 Build Coverage (scope selector all goals/project, rows with need/planned, still needed, ≈ cost, "N short" + "only M left", sync hint, no-goals empty state with link to Goals); verify with component tests
- [x] 6.8 Build Rewards (reference-only notice, milestones and progress chests with "Show all N", missions with game text and chain positions, "None this week") as desktop/tablet tabs and the phone Rewards tab; verify with component tests
- [x] 6.9 Build the shop search (a typed field over every reward the event sells, matching names and unit search names; tab bar on desktop/tablet, header icon on phone; past markers; a day opens Shop on that day); verify with a component test
- [x] 6.10 Implement the three forms (desktop side column ≥ 1024; tablet full width + sticky "Shopping list" button + right drawer; phone Shop · Plan · Rewards with review badge and sticky "Still to buy" bar), `?tab=` normalization per form, and all page states (catalog loading/failure, absent/empty dataset, plan loading/failure with disabled cart, unsynced, empty cart); verify with page tests per form and state
- [x] 6.11 Add `seasonalEventCurrency*` ids to the shop currency icon map; verify icons resolve for the three curated events

## 7. i18n and tour

- [x] 7.1 Add the `armageddon-shop` calendar definition name to `events.json` in en/de/es/fr and its wiki link in `event-wiki-links.ts` (if the wiki has a page); verify the Home calendar shows the June and October 2026 Armageddon weeks by name and the existing calendar tests pass
- [x] 7.2 Add the `eventShops` namespace to every locale (en, de, es, fr) with real translations at sibling-namespace quality (copy from the canvas FINAL boards, reviewed: one verb for "Days you didn't mark", "Bought some…", no glyphs in text, planner reward labels), register its TypeScript resource type in `i18next.d.ts`, and add the nav label; verify the i18n completeness test and typecheck pass
- [x] 7.3 Add `event-shop-page.tutorial.tsx` with desktop, tablet and phone steps (event picker, week calendar / day chips, slot card / tile and its tick, add to cart, shopping list via side column / drawer button / Plan tab, Coverage, reward tabs) registered via `useTourPageSteps`, plus `tour.eventShop.steps.*` keys in all four locales; verify with automated tutorial tests at 390, 900 and 1280 px

## 8. Desktop and tablet verification (≥ 768px)

Data states needed: a signed-in account with synced player data and Active goals including a Yarrick shard goal; an account with no goals; a running event; an ended event (`october-2026` from 2026-11-02 on). Every curated event has ended by now, so the running state needs a reversible local fixture (per `tp-manual-ui-verification`): temporarily add a `ShopEvent` week for `October2026` starting this week in the local API's `event-occurrences.json`, verify, then revert it.

- [x] 8.1 Through the Aspire stack at 1280 px, verify the header, week calendar, slot cards, add / quantity / mark bought / bought fewer, draft alliance, side column staying visible while changing days, and that a reload restores the cart from the server
- [x] 8.2 At 1280 px, verify the shopping list (Needs review actions, Today, Done, Clear week, bought ahead, totals) and Coverage against a plan with past, today and future entries, and the ended recap
- [x] 8.3 At 900 px, verify the full-width cards, the sticky "Shopping list" button and the drawer
- [x] 8.4 Run the desktop and tablet tours end to end

## 9. Phone verification (< 768px)

- [x] 9.1 In a same-origin 420px iframe on the app origin (per `tp-manual-ui-verification`), confirm the phone layout renders and verify the day chips, tiles and corner tick, the slot sheet, the Plan tab with its review badge, the "Still to buy" bar and the Rewards tab
- [x] 9.2 Run the phone tour end to end in the same iframe

## 10. Gates

- [x] 10.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`; all pass
