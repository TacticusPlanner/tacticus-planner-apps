## Why

Dailies › Raids absorbed Shops (`fold-shops-into-raids`) and Onslaught (`show-onslaught-on-raids`) without a layout pass, and it doesn't use wide monitors (UserJot "Today's raids layout issues"). At 2560px the content stops at 1600px, the three lanes are ~500px each, and the plan lane is ~1340px tall because a typical day is a single goal group whose cards stack in one column. So the page leaves large empty margins and still scrolls (page 2069px in a 1255px viewport). The redesign brief and handoff are in `tacticus-planner-docs/ux/wireframes/` (`daily-raids-today-brief.md` problems 1–6, `daily-raids-today-handoff.md` proposal C, `daily-raids-today-implementation.md` change 1).

## What Changes

- On `/dailies/raids` only, raise the content width cap from 100rem (1600px) to 150rem (2400px). Other Dailies tabs keep 100rem.
- Replace the summary header ("Today's raids" heading, energy/raid pills, energy bar, campaign event half) with a row of **glance tiles**: Daily energy used, Planned today, Onslaught, Campaign event. **BREAKING** (UI): the "Today's raids" heading is removed.
- Put the controls on **one row**: quick filter chips inline, then project, Raids Filters and Planning settings. Quick filter notes appear under the row.
- Replace the three auto-fit lanes and the sections below them with a **dashboard grid of five cards**: Today's plan (two tracks wide), then a column of Bonus raids and Shop recommendations, then a column of Onslaught and Today's attempts. Container queries pick 4, 2 or 1 tracks. Reading and focus order is Plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts.
- Inside Today's plan (and Bonus raids at the energy limit), each goal group's resource cards fill as many 20rem columns as fit, so a one-goal day uses the card's width. This is a new opt-in layout on `RaidSchedule`; Plan › Schedule keeps its current layout.
- Bonus raids gets a **Show less** control after Show more. At or above the energy limit it takes the plan's place and lists **every** entry, without the top-3 truncation. That changes the current "keeps the top-3 truncation after the limit" rule.
- Today's attempts becomes a compact card: one dense row per node, with attempts used on the right.
- Shop recommendations becomes a card that uses the compact (mobile) presentation at every width, with a one-line "nothing to buy" state. The separate desktop shop layout is removed, since the Raids tab is now its only home.
- Retarget the Today tour (desktop and mobile share one step list in this change).
- Out of scope: the mobile segments (change `today-mobile-segments`), visible upgrade names on cards (change `show-upgrade-names-on-today`), a daily reset tile (no reliable reset time; follow-up), and a Retry button on the raids error state (`useDailyRaids` has no retry; follow-up).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: the dashboard layout replaces "Today lays out its groups side by side when there is room". The width cap, glance tiles, controls row, the card grid inside goal groups, compact Today's attempts rows, the energy tile, the campaign event tile, the Onslaught card and tile, and Bonus raids changes (Show less, every entry at the limit, no card when empty).
- `daily-shop-recommendations`: the section becomes a dashboard card with one compact presentation at every width and a one-line nothing-to-buy state.

## Impact

- `apps/web/src/fsd/pages/dailies/ui/`: `today-page.tsx` (rewritten), `dailies-layout.tsx` (width cap), `campaign-event-status.tsx` (hook + tile), `today-shops.tsx` (card), `shops/shops-state.tsx` (compact nothing state), `today.tutorial.tsx` (targets), and new files under `ui/today/`. `shops/desktop/shops-desktop.tsx` is deleted.
- `apps/web/src/fsd/features/daily-raids/`: `ui/raid-schedule.tsx` (new `cardLayout` prop), `ui/raid-state.tsx` (inline variant), `ui/today-quick-filters/today-quick-filter-chips.tsx` (inline layout), `index.ts` (exports `isLocationVisible`). `ResourceCard`, the model and selection logic are unchanged.
- `packages/ui/src/styles/globals.css`: new `--energy-over` token.
- `apps/web/public/locales/{en,de,es,fr}/dailies.json`: new keys, `today.title` removed.
- Tests: the Dailies page tests, tutorial test, quick-filter and raids-filter tests, campaign event and shops tests, and new dashboard, glance, view-model and `RaidSchedule` layout tests.
- No API, data or calculation change. No companion `tacticus-planner-api` change. The Home raids widget and Plan › Schedule are unaffected.
