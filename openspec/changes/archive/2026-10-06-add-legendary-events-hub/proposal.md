# Proposal

## Why

Legendary Event planning is the second most-used V1 workflow (355 of 433 Wave 1 respondents) and V2 has no Legendary Event surface at all, even though the catalog already serves every event (`lres`, `lre-battles`, `lre-common`) and every signed-in profile already syncs its per-lane event progress (`lre-progress`). This is the first half of Stage 1 of the [Legendary Event V2 plan](https://github.com/TacticusPlanner/tacticus-planner-docs/blob/main/ai/planning-artifacts/2026-10-lre-v2-plan.md): the Events section, the hub, the event page with its run status and lane overview, and the Home events widget widened to cover Legendary Events. The second half, `add-legendary-event-progress`, adds the eligibility leaderboard and the synced progress grid to the same page. Splitting keeps each apply a reviewable PR; this half needs no domain calculation beyond lifecycle.

Wording follows the Tacticus player API (`player.progress.legendaryEvents[]`): **lane** (not track), **objective** (not restriction), **run** (not stage or occurrence), **encounter** for a player's battle progress, **score** for an objective's value. See the docs glossary (`domain/glossary.md`).

## What Changes

- **New top-level Events section** at `/events` (desktop sidebar and mobile menu drawer, authenticated-only), per [ADR 0010](https://github.com/TacticusPlanner/tacticus-planner-docs/blob/main/decisions/adr/0010-events-navigation-section.md). `/events` redirects to `/events/legendary-events`. The general navigation tour and nav translations gain the section.
- **Legendary Events hub** at `/events/legendary-events`: active events first (a run is in progress), then upcoming (next run start), then archived (`finished` only; an unfinished event with no announced run date is upcoming and reads "to be announced"), each with the event unit's portrait, name, run timing and, for the active event, synced run number, tokens and points.
- **Legendary Event page** at `/events/legendary-events/:eventId` with two sections in this change, no new API:
  - **Run status** from the synced `lre-progress` chunk: run, tokens and regen, points, currency, claimed chest, shards, next points milestone (from `lre-common`), time to the next run, and when the data was last synced.
  - **Lane overview** per lane (Alpha, Beta, Gamma): lane name and allowed-alliance rule, kill points, the five objectives with icon, localized label and score, and the per-battle points ladder.
  - A short "how points work" disclosure under the lane overview.
  - The eligibility leaderboard and synced progress grid arrive with `add-legendary-event-progress` and slot in below these sections.
- **Home events widget widened**: the existing "Home Screen Events" card becomes "Events" and lists live Home Screen Events and live Legendary Events first, then upcoming ones of both types by start, up to three rows; each row navigates to its own destination (HSE tab or the Legendary Event page). The whole-card navigation to the HSE tab is removed.
- **New `entities/legendary-event` slice** owning event lifecycle (active / upcoming / archived, current run window), the next-milestone lookup and the objective label and icon resolution, as pure functions with tests; new named catalog queries (`getLegendaryEvents`, `getLegendaryEvent`, `getLegendaryEventCommon`) and player-data queries (`getLegendaryEventsProgress`, `getLegendaryEventProgress`). Objective matching, potential points and the points model are deliberately left to the second change.
- **i18n**: new `legendaryEvents` namespace (page copy, objective label templates, tour steps) in en/de/es/fr; `common` nav keys for the Events section and the widened Home widget copy. Objective labels resolve from the existing `traits`, `damageTypes`, `factions` and `common:alliances` entries rather than the catalog's English `name`.
- Out of scope (later changes and stages): eligibility leaderboard and progress grid (next change), teams and persistence, manual annotations, run inputs, tokenomics, clear-depth estimates, Goals Preview, master table, sharing, analytics events, and the pending data renames (`lres` → `legendary-events`, `unitsRestrictions` → `objectives`, `lre-progress` → `legendary-events-progress`), which land with the first Legendary Event API change.

## Capabilities

### New Capabilities

- `legendary-events-hub`: the Events section's Legendary Events hub and event page shell — event lifecycle (active / upcoming / archived), hub ordering and content, event page sections and route behaviour, the run status section, the lane overview section with localized objective labels, loading / failure / empty states, and the page tours.

### Modified Capabilities

- `app-navigation`: adds the Events top-level section (route, child, mobile placement, default child redirect, tour step) to the navigation model the existing requirements describe.
- `home-events-widget`: the Home Screen Events card becomes a generic Events card: new title, both event types listed, cap of three rows, per-row navigation instead of whole-card navigation, Legendary Event row content, and its tour step.

## Impact

- `apps/web/src/fsd/app/layout/nav-items.ts`, `routes.tsx`, `shared/tour/general.tutorial.tsx`, nav tests that enumerate sections.
- New `apps/web/src/fsd/pages/events/**` (layout, route config, hub, event page with desktop and mobile forms, run status, lane overview, tutorials, tests).
- New `apps/web/src/fsd/entities/legendary-event/**` (lifecycle, milestone lookup, objective labels, hooks, public `index.ts`).
- `apps/web/src/fsd/pages/home/ui/events-widget/**` (widened rows, per-row navigation, Legendary Event rows), `home-page.tutorial.tsx` copy, their tests; `formatEventCountdown` moves to `shared/lib`.
- `packages/game-catalog/src/queries.ts` (Legendary Event queries), `packages/player-data/src/queries.ts` (progress queries) and their tests.
- `apps/web/public/locales/{en,de,es,fr}/legendaryEvents.json` (new namespace), `common.json` nav and Home keys, i18n resource types and namespace tests.
- No API change. The catalog's `lre-common` is assumed shared across events (known catalog caveat); `eventStageStartDatesUtc` currently carries one date per event.
- Follow-up change `add-legendary-event-progress` depends on this one (routes, entity, page shell).
