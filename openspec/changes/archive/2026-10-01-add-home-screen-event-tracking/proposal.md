## Why

V1 lets a player pick a Home Screen Event (HSE) in Daily Raids settings so raid ordering favours battles that earn event points. V2 has no equivalent, yet the game-events calendar carries HSE occurrences (`type: HomeScreenEvent`) with explicit UTC windows. The active HSE is knowable from the calendar, so the player should not have to pick it. A dedicated Dailies tab shows what to raid to earn event points, while Today stays the plain goal-driven schedule.

## What Changes

- Derive the single active HSE from the game-events calendar (`getEventsActiveAt`, start inclusive / end exclusive, UTC). There is never more than one active HSE; if stale or erroneous data overlaps, prefer a rule-bearing event, then the latest-starting one.
- Add a client-side table of raid-point rules per HSE definition id for every HSE that earns points from campaign raids: Warp Surge, Machine Hunt, Training Rush, Purge Order. Ported from V1 (3 points per matching non-summon enemy, 5 on Elite nodes). Every other V1 HSE type is explicitly listed in design as having no raid relevance.
- New Dailies tab "HSE" (localized abbreviation of Home Screen Event) at `/dailies/hse`, so Dailies shows Raids (the Today page), HSE, Shops, Guild Raids. Content: (a) a **farm list for event points**, computed over the whole schedule (every active goal's remaining need as Plan > Schedule models it, with the Dailies project selector semantics), not from Today's picks: it lists the campaign locations the player can farm with the daily energy left today (planning-settings daily energy minus energy really spent today, node attempts already used subtracted) that earn event points for the active rule, are unlocked with attempts left, drop a resource that contributes to at least one active goal's remaining need anywhere in the schedule and pass the Raids Filters, ordered by event points per energy (deterministic tie-breaks) and filled until the energy budget is used. It behaves like a filter-then-pick (an implicit "earns event points" filter), so it may spend more energy per item than Today's plan, and the UI says so. Each row shows the location, raids to do, points, energy, round goal unit icons (cap 4 + "+N", accessible tooltip) and the drop icon; day total badges show points and energy; empty states cover no goals, no energy budget and nothing contributes. (b) a separate goal-independent list of the top 10 locations overall (each row also shows the node's reward icon) by event points per energy that the player has unlocked, has not raided today and that pass the Raids Filters, and (c) while a campaign event is active (`live-progress.activeCampaignEventId`), a second top 10 limited to that event's campaign battles. The tab header carries the Dailies project selector, the Raids Filters trigger and the Planning Settings trigger and dialog (the same components Today uses). Each farm row also shows an "X/Y" chip beside the drop icon (inventory held of the item over its total target across the goals in scope). With no event running the tab shows the same lists as a clearly labelled preview for the next upcoming event (its rule; the status line keeps the countdown), unless that event has no raid-point rule or nothing is scheduled, which keep the explanation states.
- Rework note: the first implementation filtered and sorted Today's day result (`summarizeEventRaids`) and added a tied-node score to the engine. That is replaced by the schedule-wide farm list; the score tie-break and `summarizeEventRaids` are removed. Kept: the goal-icons component, reward icons on the top-10 rows, the pointer-to-top-10 wording (now in the "nothing contributes" empty state), the status line, rules, active-event selection and most i18n keys.
- Today and the Raids Plan do not use event points at all (V1's tie-break is not ported to them).
- No device-local override switch, no 48-hour banner on Today, no per-location pills on Today.
- Not ported: V1's per-event dropdown, `invertHse`, and the `plan-hse` points calculator/tracker pages (rewards, tiers, milestones). These stay out of scope as a separate planner feature.
- **Depends on `add-daily-raids-filters` (apps), applied first**: this change reuses its `useRaidsFilters`, `buildFarmNodeFilter`, `passLocationFilter` and `RaidsFiltersTrigger`; it adds no filter logic of its own beyond combining the predicate with "earns event points" for the farm list (filter-then-pick). Its Enemy traits group (reopened there) is available to the HSE tab through the same filter.
- **Companion API change** `add-home-screen-event-tracking` in `tacticus-planner-api` (**applied first**): adds the missing HSE definitions (including Purge Order), authors the occurrences read from the in-game Update 1.42 calendar (Against the Tide, Purge Order, Squig Smash, Machine Hunt, Training Rush; the Machine Hunt starting 2026-10-02 is the one players need next), and adds a stale-calendar test. This change adds the i18n names and wiki links for the new definition ids.

## Capabilities

### New Capabilities

- `daily-raids-home-screen-event`: deriving the active HSE, raid-point rules, the HSE tab (the schedule-wide farm list, overall and event-campaign top-10 locations, header controls, Raids Filters honoring, empty states).

### Modified Capabilities

- `dailies-navigation`: the HSE tab.
- `daily-raids-today`: Today is not event-optimised.
- `daily-raids-plan`: the plan is not event-optimised.

## Impact

- `apps/web/src/fsd/features/daily-raids` (home-screen-event model and UI; reuses `use-eligible-campaign-battles`), `features/daily-raids/model/home-screen-event-farm.ts` (the schedule-wide farm list), `features/goal-farming` (one exported `collectFarmNodes` extracted from `selectFarmNodes`; the earlier optional node score is removed), `entities/planning-setting` and `entities/project` (read-only reuse of the trigger/dialog and project selector), `pages/dailies` (route, HSE page), `app/layout/nav-items.ts`, i18n (`dailies`, `events`, all four locales), event wiki links, tests.
- `@workspace/game-catalog` read-only use of `getEventsActiveAt` / `getEventDefinitions` / `getUpcomingEvents`; the `npcs` dataset (`traits`, `factionId`, `alliance`) is read for enemy matching.
- Depends on the API change being released first (no API contract change) and on `add-daily-raids-filters` being applied first.
- The persisted Raids Filters (`raids-filters.v1`) are read by the HSE tab; the Raids Filters dialog/trigger come from the filters change.
- Sequencing: `hide-premature-dailies-pages` also edits the Dailies tab set; apply it first (or archive it) so this change adds the tab on top of it.
