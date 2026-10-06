# Design

## Context

See proposal.md — Why. Relevant current state:

- The catalog already serves and the client already caches `lres` (per event: `id` = unit snowprint id, `finished`, `eventStageStartDatesUtc`, three `GameCatalogLreTrackView`s with `killPoints`, `battlesPoints[18]`, `defeatAll[18]`, `allowedUnitsFilter`, `unitsRestrictions[5]` each `{ name, points, index, filter: { kind, target, exclude } }`, `battleIds`, `availableUnitIds`), `lre-battles` and `lre-common` (one record: `pointsMilestones`, `chestsMilestones`, `progression`, `shardsPerChest`). `packages/game-catalog` has zod schemas and storage models for all three but **no named queries** for them.
- `packages/player-data` syncs the `lre-progress` chunk (array keyed by event `id`; per lane `encounters[{ objectivesCleared, highScore, encounterPoints }]`, plus `currentPoints`, `currentCurrency`, `currentShards`, `currentClaimedChestIndex`, `currentEventRun`, `currentEventTokens`) and stores it as a split chunk keyed by `id`, but exposes no named query for it. The player-data manifest metadata carries `syncedAt`.
- The restriction filter kinds present in the served data are `Alliance`, `Faction`, `Trait`, `DamageType`, `MinHits`, `MaxHits`, `AttackType` (target `Ranged`). V1 matched these in `3-features/lre/model/filters.ts` + `objective-dispatch.ts`; V1 also carried a `NoSummons` kind the catalog does not use.
- Catalog characters expose `alliance`, `faction`, `traits` (ids such as `SuppressiveFire`, `Resilient`), `meleeDamage`, `rangedDamage | null`, `meleeHits`, `rangedHits | null`, `activeAbilityDamage`, `passiveAbilityDamage`. `shared/lib/characterDamageTypes` already unions those damage sources. V1's `damage-profile-exclusions.ts` (two units) has no V2 counterpart yet.
- Navigation is data-driven from `app/layout/nav-items.ts` (`NavItem` with `children`, `mobilePlacement`, `anonymousAllowed`); sections render through a generic layout (`PageContainer` + `<Outlet/>`, see `pages/progress`), with the mobile header tab row and desktop section menu derived from the same items. `app/routes.tsx` splices each page slice's `routes` export under the section path.
- Home composes widget cards in rows; `pages/home/ui/events-widget` is the closest sibling (card as a button, skeleton / error / empty bodies, minute tick, `formatEventCountdown`).
- Tours: a co-located `<page>.tutorial.tsx` registering `useTourPageSteps({ desktop, mobile })`; step copy lives in the page's namespace (Home uses `events:tour.home.*`).
- Decisions already taken in the docs repo and binding here: LRE-owned teams (ADR 0008, not used in this stage), all LRE calculation on the client (ADR 0009), Events as a new top-level section (ADR 0010), sync-wins (no manual progress entry), three-occurrence model.

## Goals / Non-Goals

**Goals:**

- One owning slice, `entities/lre`, for every LRE domain rule this and later stages need (lifecycle, eligibility, points model, sync mapping), consumed by `pages/events` and `pages/home` through its public API only.
- Zero new API surface; every input is already cached locally.
- Deterministic, catalog-driven matching with tests over the **real** served datasets, so a new objective kind or renamed trait id fails CI instead of silently emptying a restriction.
- Both UI forms designed, not reflowed: desktop shows three tracks side by side; mobile shows one track at a time behind a shared selector.

**Non-Goals:**

- Teams, persistence, occurrence inputs, tokenomics, clear depth, Goals Preview, master table, sharing — Stages 2–8.
- Manual progress entry of any kind, including `maybe` / `stop` annotations.
- A `features/*` slice: nothing in this stage is a user action beyond sort/filter, so no feature layer is introduced yet; Stage 2's team builder will be the first `features/lre-*`.
- New colour tokens for tracks; Alpha / Beta / Gamma are labelled, not colour-coded (the existing `legendary` event accent is reused for the section).

## Decisions

**D1 — Owning slice `entities/lre`, public API via `entities/lre/index.ts`.**
Exports (all pure unless named `use*`):

- `lib/lifecycle.ts`: `deriveLreLifecycle(event, nowMs) → { state: "active" | "upcoming" | "archived", stageStartMs?, stageEndMs? }`, `orderLresForHub(events, nowMs)`; the 7-day stage length is one exported constant `LRE_STAGE_DURATION_MS`.
- `lib/restriction-match.ts`: `matchesLreFilter(unit, filter) → boolean` (table in the spec; unknown kind → `false`), `isUnitAllowedOnTrack(unit, track)`, `restrictionsSatisfied(unit, track) → number[]` (restriction indices).
- `lib/damage-profile-exclusions.ts`: ported map `{ votanChampion: ["Psychic", "Direct", "DirectDamage"], thousSekhetar: ["Psychic"] }` and `unitDealtDamageTypes(unit)` = `characterDamageTypes(unit)` minus exclusions. `shared/lib`'s helper stays generic; the LRE-specific correction lives here, mirroring V1's placement note.
- `lib/unit-potential.ts`: `unitTrackPotential(unit, track) → { points, slots, satisfied }` and `buildTrackLeaderboard(track, characters, roster) → LreLeaderboardRow[]`.
- `lib/track-points-model.ts`: `buildTrackPointsModel(track) → LreTrackPointsModel` (`battles[{ index, battlePoints, defeatAllPoints, restrictionPoints[], maxPoints }]`, `maxPoints`), the single source every total derives from.
- `lib/synced-track-progress.ts`: `buildSyncedTrackProgress(model, lane | null) → LreTrackProgressView` (per battle cleared flags for defeat-all + five restrictions, `pointsEarned`, `highScore`, `complete`; track `pointsEarned`), `nextPointsMilestone(common, points)`.
- `model/types.ts`: domain types (`LreLifecycle`, `LreLeaderboardRow`, `LreTrackPointsModel`, `LreTrackProgressView`) following the naming-conventions skill: `GameCatalogLreView` (package storage model) → `Lre*` domain types → page view-model props.
- `model/use-lres.ts`, `model/use-lre.ts`, `model/use-lre-progress.ts`: `useLiveQuery` wrappers returning `{ status: "loading" | "error" | "ready", … }` so pages never touch Dexie; a minute tick (like `useActiveHomeScreenEvent`) drives lifecycle re-evaluation.
- `model/use-lre-restriction-label.ts`: `(restriction) → { label, icon }` resolving through `traits`, `damageTypes`, `factions`, `common:alliances` and the `lre` namespace templates, with the catalog `name` fallback.

_Alternative:_ page-local helpers under `pages/events`. Rejected: the Home card needs lifecycle and milestone logic, and Stages 2–7 need every rule here; FSD forbids importing them from a page.

**D2 — Named queries added to the packages, not Dexie access in the app.**
`@workspace/game-catalog/queries`: `getLres()`, `getLre(id)`, `getLreCommon()` (returns the single record or `null`). `@workspace/player-data/queries`: `getLreProgress()` (whole chunk) and `getLreProgressForEvent(eventId)` (`getChunkRecord("lre-progress", id)`). Mirrors every existing named query; tested in the package test files. `lre-battles` gets no query in this stage (nothing reads wave data yet).

**D3 — Lifecycle from stage dates, stage number from sync.**
The catalog has no stage number and one date per event, so: active iff `start <= now < start + 7d`; "Stage N of 3" only from `currentEventRun`. The alternative, inferring the stage from the number of past dates, is wrong with a one-element array and would drift if the catalog later fills all three. The 7-day constant is V1's; it is isolated so a catalog-served duration can replace it later without touching callers.

**D4 — Sync-to-grid mapping is by objective index, asserted against real data.**
`objectivesCleared` carries indices; the chunk has no objective definitions. Index 0 = defeat-all, k ∈ 1..5 = restriction with `index k−1`. V1 proved the game order equals the datamined bonus-objective order (its converter mapped by type/target and skipped the `Acing` objective at 0). Because V2 cannot re-verify at runtime, a manual verification task compares `encounterPoints` against the model's per-battle points for the cleared set on a real synced account; a mismatch means the assumption is wrong and the mapping must move server-side.

**D5 — One points model, totals derived.**
`buildTrackPointsModel` is the only place `battlesPoints`, `defeatAll` and restriction `points` are combined; the progress header, hub, Home card and the spec's worked examples (471 per battle 1, 9,000 per track for Lysander Alpha) all read it. Points earned come from synced `encounterPoints`, never recomputed from cleared flags, so a game-side scoring change cannot make the app disagree with the game.

**D6 — Matching semantics port V1 exactly, with two deliberate differences.**
(1) `MinHits`/`MaxHits` use `rangedHits ?? meleeHits` (V1: `rangeHits || meleeHits`). (2) Unknown kinds match nothing and are caught by a test that walks every restriction in the real `lres` fixtures and asserts each kind is in the supported set — V1 threw at runtime. Damage types include ability damage minus the ported exclusions; `DirectDamage` is added to V1's `Direct` since that is the id the V2 catalog emits.

**D7 — Restriction labels are built from the filter, icons from existing id helpers.**
`traits:<id>`, `damageTypes:<id>`, `factions:<id>`, `common:alliances.<id>`, plus `lre:restriction.minHits` ("Min {{n}} hits"), `lre:restriction.maxHits`, `lre:restriction.ranged`, `lre:restriction.melee`, `lre:restriction.not` ("No {{label}}"). Icons: `traitIcon`, `damageTypeIcon`, `factionIcon` from `@workspace/game-catalog`; lucide glyphs for hits (`Crosshair`) and attack type (`Target` / `Sword`). This removes the dependence on the catalog's English `name` that the import research flagged as drifting; `name` stays as the fallback.

**D8 — Desktop / mobile split.**

|                 | Desktop (≥768)                                                                                 | Mobile (<768)                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Hub             | Card grid (2–3 per row) under Active / Upcoming / Archived headings                             | Full-width stacked cards                                                                           |
| Event page      | Round status card, then three sections each with Alpha / Beta / Gamma as three columns (stack to two at narrow desktop widths via container queries) | Round status card, one `Tabs` (`line` variant) Alpha / Beta / Gamma selector, then the three sections for the selected track |
| Leaderboard     | Table per track (`@workspace/ui` table), sortable headers                                       | Row cards per unit, compact sort/filter bar                                                        |
| Progress grid   | 18 rows × 6 columns per track                                                                   | Compact rows, sticky icon header                                                                   |
| Tour targets    | `lre-round-status`, `lre-track-overview`, `lre-leaderboard`, `lre-progress-grid`                | `lre-round-status`, `lre-track-selector`, `lre-track-overview`, `lre-leaderboard`, `lre-progress-grid` |

The event page orchestrator (`lre-event-page.tsx`) computes `LreEventPageViewProps` once and renders `isMobile ? <LreEventMobilePage/> : <LreEventDesktopPage/>`; sub-pages take no `isMobile`. The track selector is mobile-only state owned by the orchestrator, keyed by `eventId` so it resets per event; sort/filter state is also orchestrator-owned and shared by the three tracks, discarded on unmount.

**D9 — Section plumbing follows Progress.**
`pages/events/index.ts` exports `EventsLayout` (`PageContainer` + `<Outlet/>`) and `routes` (`index` → `<Navigate replace to="/events/lre"/>`, `lre` → hub, `lre/:eventId` → event page, lazy). `app/routes.tsx` adds the `/events` `ProtectedRoute` entry; `nav-items.ts` adds the Events item after Progress with one child `/events/lre` (`isLandingPage: true`, since the hub is a real landing screen the tab should return to from a detail route). Nav label keys go in `common.json` (`nav.events`, `nav.eventsDescription`, `events.tabs.lre`, `events.tabs.lreDescription`), matching Progress; page copy goes in the new `lre` namespace.

**D10 — Home card is a page-local widget consuming `entities/lre`.**
`pages/home/ui/lre-widget/home-lre-widget.tsx` reuses the events-widget card pattern (button semantics, skeleton / error / empty, minute tick, `formatEventCountdown` lifted to `shared/lib` if the LRE pages also need it — they do, so `formatEventCountdown` moves to `shared/lib` with its test, and the events widget imports it from there). Placement: a new `grid md:grid-cols-2` row with the card in the first cell, before `EventsCalendar`.

**D11 — Stale-sync presentation, no local sync control.**
Round status shows "Synced X ago" from `getManifestMetadata().syncedAt` via `formatRelativeTime`; refresh is the shell's Sync action (sidebar / bottom bar / Ctrl+Shift+S). Adding a second sync trigger inside the page would reintroduce V1's "sync spam" pattern the survey complained about.

**D12 — V1-parity checklist (this reimplements V1 `plan-lre` tracks, points table and progress read-view).**

- Assets / icons reused: character round portraits via `characterIcon(id)`; restriction icons via `traitIcon` / `damageTypeIcon` / `factionIcon` (V1's `RestrictionIcon` mapped type+target to the same asset families); rank/rarity via `RankBadge` / `RarityIcon`.
- Navigation: V1's Plan › LRE submenu with one item per event and an archive → replaced by the Events section hub (ADR 0010). Kept: deep link per event; archived events listed.
- Layout: V1's one page with six tabbed sections (teams, progress, tokenomics, battles, leaderboard, settings) → one scrollable page with four sections in this stage; teams / tokenomics / battles / settings arrive in later stages. V1's section-visibility `localStorage` toggles → dropped.
- Secondary states: V1 points table "Characters: All / Unlocked / Selected" → "Only unlocked" toggle (kept), "Selected" (needs teams) → Stage 2; V1 tile display toggles (icon, rarity, rank, name, bias, abilities, traits, relic) → dropped, rows always show portrait, name, rarity, rank; V1 "points calculation: unearned / all / estimated" → not in this stage (master table, Stage 7); V1 requirement tooltips "name – points" → kept as chip labels; V1 progress checkbox states (cleared / maybe / stop / partial) → read-only cleared / not-cleared (sync-wins), partial scores shown as high score and points; V1 "sync progress" button inside the page → dropped (shell sync, D11); V1 home LRE section (next event, countdown, shards to next milestone) → Home card with points to next milestone (shards projection is Stage 3).

## Risks / Trade-offs

- [Objective index order differs from catalog `index` order for some event] → D4's manual verification on a real account before archive; if it fails, add an API-side objective map to the chunk in a follow-up change and gate the grid on it.
- [`eventStageStartDatesUtc` has one element and a stale date hides the active round] → lifecycle treats a past single date as archived only after 7 days; the hub still lists the event under Archived rather than dropping it, and the plan's catalog validation idea (at least one unfinished event with a future date) is noted for the API.
- [`lre-common` assumed shared across events] → only `pointsMilestones` is read here; the next-milestone line degrades to "—" when `lre-common` is missing.
- [Character ability damage arrays are partly unpopulated server-side] → eligibility may under-count ability-only damage types for some units; tests pin the behaviour on current data and the gap is noted in the catalog skill for the next data refresh.
- [Leaderboard over ~100 allowed units × 3 tracks on mobile] → rows are plain list items, computed once per roster/catalog change with `useMemo`; no virtualisation in this stage, measured in verification.
- [Seventh top-level nav item crowds the desktop rail] → accepted by ADR 0010; icon-only compact rail already exists.

## Open Questions

- Whether the hub should hide archived events behind a disclosure once the catalog carries all finished events (Stage 7); harmless to decide then.
