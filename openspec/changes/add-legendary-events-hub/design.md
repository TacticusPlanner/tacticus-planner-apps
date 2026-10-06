# Design

## Context

See proposal.md — Why. Relevant current state:

- The catalog already serves and the client already caches `lres` (per event: `id` = unit snowprint id, `finished`, `eventStageStartDatesUtc` = run start dates, three lane views `alpha` / `beta` / `gamma` with `killPoints`, `battlesPoints[18]`, `defeatAll[18]`, `allowedUnitsFilter`, `unitsRestrictions[5]` = objectives `{ name, points, index, filter: { kind, target, exclude } }`, `battleIds`, `availableUnitIds`) and `lre-common` (one record: `pointsMilestones`, `chestsMilestones`, `progression`, `shardsPerChest`). `packages/game-catalog` has zod schemas and storage models for them but **no named queries**. The dataset and field names still carry V1 wording; the glossary records their pending renames, and this change does not rename them.
- `packages/player-data` syncs the `lre-progress` chunk (array keyed by event `id`; per lane `encounters[{ objectivesCleared, highScore, encounterPoints }]`, plus `currentPoints`, `currentCurrency`, `currentShards`, `currentClaimedChestIndex`, `currentEventRun`, `currentEventTokens`) as a split chunk keyed by `id`, with no named query. The player-data manifest metadata carries `syncedAt`.
- Navigation is data-driven from `app/layout/nav-items.ts` (`NavItem` with `children`, `mobilePlacement`, `anonymousAllowed`); sections render through a generic layout (`PageContainer` + `<Outlet/>`, see `pages/progress`); `app/routes.tsx` splices each page slice's `routes` export under the section path.
- `pages/home/ui/events-widget/home-events-widget.tsx` is the HSE-only card: `useActiveHomeScreenEvent` from `features/daily-raids`, `selectHomeScreenEventPreview`, a minute tick, `formatEventCountdown`, button semantics on the card, skeleton / error / empty bodies. `EventTypeIcon` and `eventBarClass` already know the `LegendaryEvent` type.
- Tours: a co-located `<page>.tutorial.tsx` registering `useTourPageSteps({ desktop, mobile })`; step copy lives in the page's namespace.
- Binding decisions from the docs repo: client-side calculation (ADR 0009), Events as a top-level section (ADR 0010), sync-wins, three-run model, and the API-aligned glossary (`domain/glossary.md`).

## Goals / Non-Goals

**Goals:**

- One owning slice, `entities/legendary-event`, for the Legendary Event domain, consumed by `pages/events` and `pages/home` through its public API only; this change seeds it with lifecycle, milestone lookup and objective labels, the next change adds matching and progress.
- Zero new API surface; every input is already cached locally.
- Both UI forms designed, not reflowed: desktop shows three lanes side by side; mobile shows one lane behind a shared selector.
- The Home card stays one card and one row model; adding a second event type must not fork it.

**Non-Goals:**

- Objective matching, potential points, the points model and the progress grid: `add-legendary-event-progress`.
- Renaming catalog datasets, fields or the player-data chunk key: an API change, listed in the glossary.
- A `features/*` slice: nothing here is a user action beyond navigation and the lane selector.
- Lane colour tokens: lanes are labelled Alpha / Beta / Gamma, not colour-coded; the existing `legendary` event accent is reused for the section and the Home rows.

## Decisions

**D1 — Owning slice `entities/legendary-event`, public API via its `index.ts`.**
This change adds:

- `lib/lifecycle.ts`: `deriveLegendaryEventLifecycle(event, nowMs) → { state: "active" | "upcoming" | "archived", runStartMs?, runEndMs? }`, `orderLegendaryEventsForHub(events, nowMs)`, and the exported constant `LEGENDARY_EVENT_RUN_DURATION_MS` (7 days).
- `lib/next-points-milestone.ts`: `nextPointsMilestone(common, points)`.
- `lib/lane-label.ts`: `laneAllowedRule(lane)` ("No Xenos" style from `allowedUnitsFilter`).
- `model/types.ts`: `LegendaryEventLifecycle`, `LegendaryEventLaneId = "alpha" | "beta" | "gamma"`, `LegendaryEventObjective` (the catalog `unitsRestrictions` record under its glossary name). Naming follows the naming-conventions skill: `GameCatalogLreView` (package storage model) → `LegendaryEvent*` domain types → page view-model props.
- `model/use-legendary-events.ts`, `use-legendary-event.ts`, `use-legendary-events-progress.ts`, `use-legendary-event-progress.ts`, `use-legendary-event-common.ts`: `useLiveQuery` wrappers returning `{ status: "loading" | "error" | "ready", … }` with a minute tick for lifecycle.
- `model/use-objective-label.ts`: `(objective) → { label, icon }` per D6.
  The next change adds `lib/objective-match.ts`, `lib/unit-potential.ts`, `lib/lane-points-model.ts`, `lib/synced-lane-progress.ts` to the same slice.
  _Alternative:_ page-local helpers under `pages/events`. Rejected: the Home card needs lifecycle and milestones, and later stages need every rule here; FSD forbids importing them from a page.

**D2 — Named queries in the packages, named by the glossary.**
`@workspace/game-catalog/queries`: `getLegendaryEvents()`, `getLegendaryEvent(id)`, `getLegendaryEventCommon()` (the single record or `null`), reading the existing `lres` / `lre-common` stores. `@workspace/player-data/queries`: `getLegendaryEventsProgress()` and `getLegendaryEventProgress(eventId)` over the `lre-progress` chunk. Query names carry the glossary wording while storage keys keep theirs until the API rename lands; a comment on each query says so.

**D3 — Lifecycle from run dates, run number from sync.**
The catalog has no run number and one date per event: active iff `start <= now < start + 7d`; "Run N of 3" only from `currentEventRun`. Inferring the run from the count of past dates is wrong with a one-element array and would drift if the catalog later fills all three. The 7-day constant is V1's; it is isolated so a catalog-served duration can replace it.

**D4 — Event page is an orchestrator with desktop and mobile sub-pages; later sections slot in.**
`pages/events/ui/legendary-event/legendary-event-page.tsx` computes `LegendaryEventPageViewProps` once and renders `isMobile ? <LegendaryEventMobilePage/> : <LegendaryEventDesktopPage/>`; sub-pages take no `isMobile`. The orchestrator owns the mobile-only lane selector state, keyed by `eventId` so it resets per event. Lane-scoped sections receive `laneIds: LegendaryEventLaneId[]` (three on desktop, one on mobile) so the next change adds its sections by rendering them in the same slot without touching the selector.

|              | Desktop (≥768)                                                      | Mobile (<768)                                                                                                |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Hub          | Card grid (2–3 per row) under Active / Upcoming / Archived headings | Full-width stacked cards                                                                                     |
| Event page   | Run status card, then Lane overview as three adjacent panels        | Run status card, one `Tabs` (`line`) Alpha / Beta / Gamma selector, then Lane overview for the selected lane |
| Tour targets | `legendary-event-run-status`, `legendary-event-lane-overview`       | `legendary-event-run-status`, `legendary-event-lane-selector`, `legendary-event-lane-overview`               |

**D5 — Section plumbing follows Progress.**
`pages/events/index.ts` exports `EventsLayout` (`PageContainer` + `<Outlet/>`) and `routes` (`index` → `<Navigate replace to="/events/legendary-events"/>`, `legendary-events` → hub, `legendary-events/:eventId` → event page, lazy). `app/routes.tsx` adds the `/events` `ProtectedRoute` entry; `nav-items.ts` adds Events after Progress with one child `/events/legendary-events` (`isLandingPage: true`). Nav label keys in `common.json` (`nav.events`, `nav.eventsDescription`, `events.tabs.legendaryEvents`, `events.tabs.legendaryEventsDescription`); page copy in the new `legendaryEvents` namespace.

**D6 — Objective labels from the filter, icons from existing id helpers.**
`traits:<id>`, `damageTypes:<id>`, `factions:<id>`, `common:alliances.<id>`, plus `legendaryEvents:objective.minHits` ("Min {{n}} hits"), `maxHits`, `ranged`, `melee`, `not` ("No {{label}}"). Icons: `traitIcon`, `damageTypeIcon`, `factionIcon` from `@workspace/game-catalog`; lucide glyphs for hits and attack type. This removes the dependence on the catalog's English `name` that the import research flagged as drifting; `name` stays as the fallback.

**D7 — The Home card merges two sources into one row model.**
`home-events-widget.tsx` keeps `useActiveHomeScreenEvent` and adds `useLegendaryEvents` + `useLegendaryEventsProgress`. A page-local `select-home-event-rows.ts` maps both into `HomeEventRow { type: "homeScreen" | "legendaryEvent", id, live, startMs, endMs, labelKey or unitId, destination, runNumber?, points? }`, orders live-first then by start, and caps at three. Each row is a `<button>`; the card loses its `role="button"`. Loading when either source is pending; error only when both fail; a per-source inline note when one fails. `formatEventCountdown` moves to `shared/lib` since `pages/events` needs it too.
_Alternative:_ a second Home card for Legendary Events. Rejected by review: one Events card is the product owner's call and keeps Home's first row intact.

**D8 — Stale-sync presentation, no local sync control.**
Run status shows "Synced X ago" from the player-data manifest metadata (`getManifestMetadata(...).updatedAt`, which stores the manifest `syncedAt`) via `formatEventCountdown`, so the span reads "25 min" as the spec scenario requires (`formatRelativeTime` would read "25 minutes ago"); refresh is the shell's Sync action. A second sync trigger inside the page would reintroduce V1's "sync spam" the survey complained about.

**D9 — V1-parity checklist (this reimplements V1 `plan-lre`'s event navigation, lane header and home section).**

- Assets / icons reused: character round portraits via `characterIcon(id)`; objective icons via `traitIcon` / `damageTypeIcon` / `factionIcon` (V1's `RestrictionIcon` mapped type+target to the same families).
- Navigation: V1's Plan › LRE submenu with one item per event and an archive → Events section hub (ADR 0010). Kept: deep link per event; archived events listed.
- Layout: V1's one page with six tabbed sections → one scrollable page; this change ships Run status and Lane overview, the next adds leaderboard and progress; teams / tokenomics / battles / settings come with later stages. V1's section-visibility `localStorage` toggles → dropped.
- Home: V1's LRE section (next event, countdown, shards to next milestone) → a row in the Events card with run number and points; shards projection is Stage 3.
- Secondary states: V1 objective tooltips "name – points" → chip labels with score (kept); V1 "sync progress" button in the page → dropped (D8); V1 default-page setting → dropped.

## Risks / Trade-offs

- [`eventStageStartDatesUtc` has one element and a stale date hides the active run] → an expired single date reads as archived only after 7 days; the hub still lists the event under Archived rather than dropping it.
- [`lre-common` assumed shared across events] → only `pointsMilestones` is read; the next-milestone line degrades to "—" when `lre-common` is missing.
- [Glossary names in code over V1-named storage keys] → each query and the entity's catalog adapter carry a one-line comment naming the pending rename, so the API change can grep for them.
- [Seventh top-level nav item crowds the desktop rail] → accepted by ADR 0010; the compact icon rail already exists.
- [Home card now depends on two sources] → per-source failure notes keep one failure from blanking the other's rows; tests cover each combination.
