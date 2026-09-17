## Why

The V2 home page currently renders only the events calendar — everything else V1's home page offered (token status, a goals/projects summary, a daily-raids summary) never made it over. Players land on `/home` and have to navigate away to see whether they're capped on tokens, what their active project's plan looks like, or what's left to raid today. V1's dashboard already proved this composition works; V2 just needs it rebuilt on V2's project-based goal model and V2's richer daily-raids engine.

## What Changes

- Add a **Token Availability** widget (new, ported from V1): shows Arena/Guild Raid (+ Bomb)/Onslaught/Salvage Run token counts, regen countdowns, capped/over-cap state, and an informational stale-data banner (naming when the account was last synced) pointing at the existing app-shell sync control — the banner itself has no sync-trigger action, since a page can't import that control per this repo's FSD layering. Full-width, rendered first.
- Replace the (never-built) "Your Goals" concept with a **Your Projects** widget: condensed project cards (Current plan first, then a capped number of others, then a "+N more" link to `/goals/projects`), each card clicking through to its own `/goals/projects/{id}`.
- Add a **Daily Raids** widget scoped to the player's Active project (same default the Today tab uses): one row per battle location, flattened across goals (no per-character/per-goal grouping), deduplicated when the same node is shared by multiple goals, real energy-budget schedule only (no Bonus Raids), already-raided locations excluded. Clicks through to `/dailies/raids/today`.
- Reposition the existing **Events calendar** to render last, after the three widgets above. Its own behavior (loading/failure/empty states, confirmed vs. projected, Wiki actions, navigation) is unchanged.
- Desktop layout: Token Availability full-width, Projects and Daily Raids side by side, Calendar full-width last. Mobile: same top-to-bottom order, all four sections stacked.
- **Not in scope**: a Legendary Events widget. The backend already models LRE data (`Lres.cs`, event data files, `LreProgress` player-data chunk) but no LRE page/route exists in the V2 frontend yet to summarize — there is nothing to link a home card to.

## Capabilities

### New Capabilities

- `home-token-availability`: the home page's token-status widget — per-token-type regen/cap display and the informational stale-data banner.
- `home-projects-widget`: the home page's condensed projects list — which projects show, ordering/capping, and per-card navigation.
- `home-raids-widget`: the home page's compact daily-raids widget — Active-project scoping, per-location flattening/deduplication, raided-location exclusion, and navigation.

### Modified Capabilities

- `home-events-calendar`: only the "Home page renders the events calendar as primary content" requirement's framing changes, to reflect that the calendar is now the last of four home sections rather than the page's sole content — its rendering, state, and interaction behavior are otherwise unchanged.

## Impact

- `apps/web/src/fsd/pages/home/ui/home-page.tsx` — composes the four sections in the new order/layout, both breakpoints.
- New page-local Token Availability UI under `pages/home` (single-consumer; reads the existing `gameModeTokens` player-data chunk, already typed in `packages/player-data/src/player-data.schema.ts`; no new slice needed since nothing else consumes it).
- `apps/web/src/fsd/features/project-management` — gains a condensed project-card/summary entry point in its public API, consumed by both `pages/goals` and `pages/home`.
- New `apps/web/src/fsd/features/daily-raids` slice — the schedule computation and location-flattening logic extracted out of `pages/dailies` so both `pages/dailies` and `pages/home` can consume it without a page-to-page import.
- `pages/dailies` — internal refactor only, to consume the extracted `features/daily-raids` slice instead of its own inline logic; its own pages' behavior is unchanged.
- No backend/API change: `gameModeTokens`, project summaries, and the daily-raids schedule are already exposed to the frontend via existing endpoints. No companion `tacticus-planner-api` change.
- New Joyride tutorial coverage for the home page's new sections (both breakpoints), per this repo's per-page tutorial convention.
- New i18n keys for all new widget copy under the appropriate `apps/web/public/locales` namespace(s), translated for every supported locale.
