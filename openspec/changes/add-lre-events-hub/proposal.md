# Proposal

## Why

Legendary Release Event (LRE) planning is the second most-used V1 workflow (355 of 433 Wave 1 respondents) and V2 has no LRE surface at all, even though the catalog already serves every event (`lres`, `lre-battles`, `lre-common`) and every signed-in profile already syncs its per-lane event progress (`lre-progress`). Stage 1 of the [LRE V2 plan](../../../../tacticus-planner-docs/ai/planning-artifacts/2026-10-lre-v2-plan.md) ships the part that needs no user input and no new API: an Events section where a player sees the active event, which of their units qualify for which restrictions, and their synced battle progress. It covers the three most-used V1 jobs (progress tracking 66%, eligibility 61%, lane comparison 53%) and is the foundation the later team, tokenomics and goals stages build on.

## What Changes

- **New top-level Events section** at `/events` (desktop sidebar and mobile menu drawer, authenticated-only), per [ADR 0010](../../../../tacticus-planner-docs/decisions/adr/0010-events-navigation-section.md). `/events` redirects to `/events/lre`. The general navigation tour and nav translations gain the section.
- **LRE hub** at `/events/lre`: active events first (an event stage is running), then upcoming (next stage start), then archived (`finished`, or every stage window passed), each with the event unit's portrait, name, stage timing and, for the active event, synced round number, tokens and points.
- **LRE event page** at `/events/lre/:eventId` with four in-page sections, no new API:
  - **Round status** from the synced `lre-progress` chunk: round, tokens and regen, points, currency, claimed chest, shards, next points milestone (from `lre-common`), time to the next stage, and when the data was last synced.
  - **Track overview** per track (Alpha, Beta, Gamma): track name and allowed-alliance rule, kill points, the five restrictions with icon, localized label and points, and the per-battle points ladder.
  - **Eligibility leaderboard** per track: every unit the track allows, owned/locked state, rarity and rank from the roster, which restrictions it satisfies, potential points per battle and slot count; sortable; "only unlocked" filter. Ports V1's restriction matching (alliance, faction, trait, damage type, min/max hits, attack type) including the damage-profile false-positive exclusions.
  - **Synced progress grid** per track: battles × (defeat-all + five restrictions) cleared from `objectivesCleared`, per-battle encounter points and high score, track points earned vs maximum.
  - Each of the points displays carries a short "how points work" disclosure.
- **Home card** "Legendary Event": the active (else next upcoming) LRE with stage timing and, when active, points and points to the next milestone; the whole card opens the event page.
- **New `entities/lre` slice** owning event lifecycle (active/upcoming/archived, current stage window), restriction matching, unit potential points and slots, the canonical track points model, and the sync-to-grid mapping, as pure functions with tests. New named catalog queries (`getLres`, `getLre`, `getLreCommon`) and player-data queries (`getLreProgress`, `getLreProgressForEvent`).
- **i18n**: new `lre` namespace (page copy, restriction label templates, tour steps) in en/de/es/fr; `common` nav keys for the Events section; restriction labels resolved from the existing `traits`, `damageTypes`, `factions` namespaces rather than the catalog's English name.
- Out of scope (later stages): teams and any persistence, manual progress annotations, occurrence inputs, tokenomics, clear-depth estimates, Goals Preview, master table, sharing, analytics events.

## Capabilities

### New Capabilities

- `lre-events-hub`: the Events section's LRE hub and event page shell — event lifecycle (active / upcoming / archived), hub ordering and content, event page sections and route behaviour, the round status section, loading / failure / empty states, and the page tours.
- `lre-eligibility`: which units a track allows, which restrictions a unit satisfies (per filter kind, with the damage-profile exclusion rule), potential points and slots per unit, the track overview, and the leaderboard's content, sorting and filter, on desktop and mobile.
- `lre-synced-progress`: the synced progress grid — how `lre-progress` lane data maps to battles and restrictions, per-battle and per-track points earned versus maximum, the canonical track points model, and how stale or missing sync data is presented.
- `home-lre-widget`: the Home page's Legendary Event card — which event it shows, its content per lifecycle state, navigation, states, and its Home tour step.

### Modified Capabilities

- `app-navigation`: adds the Events top-level section (route, child, mobile placement, default child redirect, tour step) to the navigation model the existing requirements describe.

## Impact

- `apps/web/src/fsd/app/layout/nav-items.ts`, `routes.tsx`, `shared/tour/general.tutorial.tsx`, nav tests that enumerate sections.
- New `apps/web/src/fsd/pages/events/**` (layout, route config, LRE hub, event page with desktop and mobile forms, tutorial, tests).
- New `apps/web/src/fsd/entities/lre/**` (lifecycle, eligibility, points model, sync mapping, hooks, restriction label hook, public `index.ts`).
- `apps/web/src/fsd/pages/home/ui/**` gains the LRE card; `home-page.tsx` layout and its tests; `home-page.tutorial.tsx` step.
- `packages/game-catalog/src/queries.ts` (LRE queries), `packages/player-data/src/queries.ts` (LRE progress queries) and their tests.
- `apps/web/public/locales/{en,de,es,fr}/lre.json` (new namespace), `common.json` nav keys, i18n resource types and namespace tests.
- No API change. The catalog's `lre-common` is assumed shared across events (known catalog caveat); `eventStageStartDatesUtc` currently carries one date per event.
- Docs: the LRE plan's Stage 1 exit criteria in `tacticus-planner-docs` are satisfied by this change; no docs edit is required to apply it.
