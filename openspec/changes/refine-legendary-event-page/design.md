# Design

## Context

See proposal.md — Why. This change reshapes what `add-legendary-events-hub` and `add-legendary-event-progress` shipped (both archived; their main specs are the ones modified here).

Current state that shapes the approach:

- **Navigation is static.** `app/layout/nav-items.ts` exports `navItems: NavItem[]` with literal `children: NavSubItem[]` whose labels are i18n keys (`NavLabelKey` union). `section-tabs.tsx` (mobile header), `desktop-section-navigation.tsx`, `resolve-active-navigation.ts`, navigation search and `use-section-entry-path` all read `item.children`. Nothing today derives a child from data.
- **Routes**: `app/routes.tsx` mounts `EventsLayout` at `/events` under `ProtectedRoute` with `pages/events/route.tsx` children (`index` → redirect, `legendary-events`, `legendary-events/:eventId`). Home's events widget links to `/events/legendary-events[/:id]`.
- **Event page**: `legendary-event-page.tsx` computes one view model and renders `LegendaryEventDesktopPage` (header, run status, three lanes side by side per section) or `LegendaryEventMobilePage` (header, run status, a `Tabs` lane selector, the selected lane). Sections are `LaneOverview`, `LeaderboardSection` (table / list), `ProgressSection` (grid / rows), each taking `laneIds`. Sort and "Only unlocked" live in the orchestrator.
- **Entity libs**: `unit-potential.ts` (`unitLanePotential` → `{ points, slots, satisfied }`, `buildLaneLeaderboard`, `sortLeaderboard` with `LeaderboardSortKey`), `synced-lane-progress.ts` (`pointsEarned = encounter.encounterPoints`), `lane-points-model.ts` (per-battle `defeatAllPoints`, `objectiveScores`, `maxPoints`), `objective-label.ts` (`describeUnitFilter` → label spec + `{ type: "image", src } | { type: "glyph", glyph }`), `ui/objective-icon.tsx` (image or a lucide glyph).
- **Icons**: V2 serves trait / damage-type / faction icons from `public/game_catalog`. It has no hit, ranged-attack, melee-attack, defeat-all or score icons; V1 has them as app assets (`snowprint_assets/stat_icons/ui_icon_stat_{hit,melee,rangedattack}_01.png`, `icons/lre-defeat-all.png`, `icons/lre-score.png`) and renders negation with a red-X badge (`3-features/lre/model/restriction-icon.tsx`).
- **Create Goal** is launched through `CreateGoalLauncherContext` (app shell); not used by this change.

## Goals / Non-Goals

**Goals:**

- One tab-strip page model for both UI forms, so desktop and mobile differ only in sticky behaviour and in table-vs-card rendering of the same sections.
- One canonical per-lane progress structure that the grid, the Overview lane summary and the leaderboard's remaining points all derive from.
- A navigation model that can carry data-driven children without special-casing Legendary Events in every nav consumer.

**Non-Goals:**

- Per-unit clear estimates, efficiency coefficients, team-aware projections (later changes).
- Any write path or manual progress entry.
- A generic "sections with dynamic children" framework beyond what one resolver needs.

## Decisions

**D1 — Dynamic nav children through a resolver on the `NavItem`, applied by one hook.**
`NavItem` gains `dynamicChildren?: "legendaryEvents"` (a key, not a function, so `nav-items.ts` stays a plain data module and serialisable in tests). A new `app/layout/use-nav-items.ts` returns `navItems` with each keyed section's children expanded: for `legendaryEvents`, `useLegendaryEvents()` (entity hook) → active events in hub order → `NavSubItem`s with a new shape `{ path, label: string, iconSrc?: string }` beside the existing `labelKey` shape (`NavSubItem` becomes a union; consumers call a small `subItemLabel(t, child)` helper). The static All events child is listed last with `isLandingPage: true`. Every consumer that reads `navItems` directly (`app-shell`, section tabs, desktop section navigation, navigation search, `resolve-active-navigation`, `use-section-entry-path`) reads from the hook instead. App → entities is an allowed FSD direction.
*Alternative*: let `pages/legendary-events` render its own secondary nav. Rejected: the shell owns section tabs and the desktop section column; a page-local strip would duplicate them and lose search, breadcrumb and last-visited behaviour.
*Alternative*: a function-valued `children`. Rejected: hooks cannot run inside a data array, and tests snapshot `navItems`.

**D2 — Rename the section, keep the slice name's shape: `pages/events` → `pages/legendary-events`, route root `/legendary-events`.**
`app/routes.tsx` mounts `LegendaryEventsLayout` at `/legendary-events` with children `index` (hub) and `:eventId`. No `/events*` routes or redirects remain (product owner decision 2026-10-07; pre-production per `tp-destructive-changes-policy`): an old `/events/...` link falls through to the existing `*` `NotFoundRedirect` (home when signed in, landing otherwise). i18n keys `nav.events*` and `events.tabs.legendaryEvents*` are replaced by `nav.legendaryEvents*` and `legendaryEvents.tabs.allEvents*` in `common.json`.

**D3 — The event page is a tab strip on both forms; tab state lives in the page orchestrator.**
`legendary-event-page.tsx` owns `selectedTab: "overview" | LegendaryEventLaneId` (default `overview`, keyed by `eventId` as today) and `scrollTarget` (set by the Overview lane summary). One `LegendaryEventTabs` component (Radix `Tabs`, `variant="line"`) renders the strip; `LegendaryEventOverviewTab` and `LegendaryEventLaneTab` render the bodies. Desktop and mobile share these; the forms differ only in (a) the strip wrapper, `sticky top-[var(--mobile-header-height)] z-20 bg-background` on mobile, static on desktop; (b) `layout="table" | "list"` and `"grid" | "rows"` passed to the sections. `LegendaryEventDesktopPage` / `LegendaryEventMobilePage` collapse into one `LegendaryEventPageView` taking `isMobile`.
*Jump-to-grid*: the lane summary calls `onJumpToLane(laneId)`; the orchestrator sets the tab and, in an effect after the lane tab mounts, scrolls `#legendary-event-progress-<lane>` into view with `scrollMarginTop` equal to the sticky strip height on mobile.
*Alternative*: lanes as routes (`/legendary-events/:eventId/alpha`). Rejected per ADR 0010: in-page state lets one tap switch and scroll.

**D4 — Earned points come from `objectivesCleared` + `highScore`; `encounterPoints` is dropped from the view.**
`synced-lane-progress.ts`: `pointsEarned = highScore + (cleared[0] ? defeatAllPoints : 0) + Σ objectiveScores[k] for cleared[k+1]`. `BattleProgressView` keeps `highScore`, adds `clearedCount`; `LaneProgressView` adds `completeBattles`. The lane summary on Overview and the leaderboard's remaining points both read `LaneProgressView`, so there is one progress structure per lane (rule: canonical result, derived summaries). The maximum model is unchanged; the "may read below maximum" caveat is noted in the spec assumptions and checked in verification.

**D5 — Remaining points and the objective filter extend `unit-potential.ts`; sorting collapses to one order.**
`unitLanePotential` returns `{ pointsPerBattle, objectivesCount, satisfied }` (rename of `points` / `slots`; the `LeaderboardRow` type follows). New `remainingLanePoints(potential, laneProgress, lane) → number` iterates `laneProgress.battles` and sums the unsatisfied-or-uncleared logic per the spec. `buildLaneLeaderboard(lane, characters, roster, laneProgress | undefined)` fills `pointsPerBattle`, `remainingPoints` and `objectives: boolean[]`; `sortLeaderboard(rows, figure: "remaining" | "perBattle")` replaces the key/direction API, and `LeaderboardSortKey`, `DEFAULT_LEADERBOARD_SORT` and `nextLeaderboardSort` are removed (pre-production, no external consumer). `filterLeaderboard(rows, { onlyUnlocked, objectiveIndices })` is the one filter function; the Overview cross-lane rows come from `buildCrossLaneLeaderboard(event, characters, roster, progressByLane)` which reuses the per-lane rows and sums the shown figure.

**D6 — V1 icon set as entity assets, negation and hits badges in `ObjectiveIcon`.**
Copy V1's five PNGs into `apps/web/src/fsd/entities/legendary-event/assets/` (`stat-hit.png`, `stat-melee.png`, `stat-ranged.png`, `defeat-all.png`, `score.png`; imported as modules so Vite fingerprints them). `describeUnitFilter` returns `icon: { src, badge?: "not" | "min" | "max" }` instead of the image/glyph union; `AttackType` maps to the ranged / melee asset with no badge; other `exclude: true` filters get `badge: "not"`. `ObjectiveIcon` renders the `<img>` plus an absolutely positioned badge (red circle with an X glyph, or a text badge "≥" / "≤"), `aria-hidden`, and gains a `muted` prop (opacity 35%, grayscale) for the leaderboard's not-satisfied state. `progress-columns.ts` uses the defeat-all asset for column 0. The lucide glyph path is deleted.
*Alternative*: ship the PNGs under `public/game_catalog/stat_icons`. Rejected: that folder mirrors the served catalog asset manifest; app-chosen art stays with the slice that uses it.

**D7 — Leaderboard controls: one shared bar.**
`LeaderboardControls` renders "Only unlocked", "Deduct scored points" (both `Switch`) and the objective chip group (`ToggleGroup type="multiple"`, one item per objective with `ObjectiveIcon` + label; on Overview the union across lanes keyed by `kind:target:exclude`). The sort toggle group and direction button are removed, as are the desktop table's sortable headers. State (`onlyUnlocked`, `deductScored`, `selectedObjectives: Set<string>`) stays in the page orchestrator and is passed to both the Overview and lane leaderboards.

**D8 — Desktop / mobile split.**

| | Desktop (≥768) | Mobile (<768) |
| --- | --- | --- |
| Tab strip | Static, above content | Sticky under the app header |
| Lane summary | Three rows in one card | Same |
| Cross-lane leaderboard | Table (unit, rarity, rank, Alpha, Beta, Gamma) | Row cards, three figures on one line |
| Lane leaderboard | Table, no sortable headers | Row cards, compact control bar |
| Progress grid | Full grid | Compact rows, icon header row directly under the strip |
| Tour targets | `legendary-event-tabs`, `legendary-event-run-status`, `legendary-event-lane-summary`, `legendary-event-overview-leaderboard`, then after programmatic tab switch `legendary-event-lane-overview`, `legendary-event-progress-grid`, `legendary-event-leaderboard` | Same targets; the tour's tab-switch step uses the same `onSelectTab` callback through a tour hook option |

The tutorial switches tabs with Joyride's step callback (the page exposes `selectTab` to the tutorial hook), so later targets exist when their step shows.

**D9 — V1-parity checklist** (this reworks V1's LRE page navigation and points table).

- Assets: V1 `statHits`, `statRangedAttack`, `statMeleeAttack`, `lreDefeatAll`, `lreScore` icon files reused (D6); trait / damage / faction icons via the catalog as today; V1's hand-drawn `assets/images/lre/*` not reused (V1 itself replaced them).
- Navigation: V1's Plan submenu with one item per active event → kept as the dynamic secondary nav (D1); V1's per-event "Teams / Progress / Tokenomics" default-page setting → dropped (plan §2); V1's Alpha / Beta / Gamma tabs inside the progress view → kept as the page's lane tabs with an Overview tab added.
- Points table: V1 "Characters: All / Unlocked" → "Only unlocked" (kept); V1 "points calculation: unearned / all" → the Deduct scored points toggle (redesigned: unearned is the default); V1 column sorting → dropped; V1 per-restriction column filters → the objective multi-select (redesigned).
- Secondary states: V1 overall-progress tooltips per track → the Overview lane summary (redesigned); V1 cell tooltips → accessible text (kept from the previous change); V1 "no characters" row → "no eligible units" / "no unit satisfies these objectives" bodies (kept, one added).

## Risks / Trade-offs

- [The maximum model counts kill score and high score separately while earned points carry only `highScore`] → fully cleared battles may show below their maximum; the lane total is compared with the in-game lane screen in verification, and if the game awards both, `pointsEarned` adds `battlePoints` for a complete defeat-all (one-line change, spec assumption updated).
- [A nav child depends on a catalog read inside the always-mounted shell] → the resolver falls back to All events only while pending or failed; `useLegendaryEvents` is already `useLiveQuery`-backed and cheap. Shell tests mock the hook.
- [Sticky strip overlapping the mobile header or the Home-indicator safe area] → the offset reads the header's CSS variable; verified at 390px with the tour.
- [Objective chips on Overview union three lanes, up to 15 chips] → chips wrap; keyed by filter identity so duplicate objectives across lanes merge.
- [Removing sort options may be missed by power users] → recorded as a product decision (owner feedback 2026-10-07); the old sort code is deleted, not hidden.

## Migration Plan

- Apps-only; ship behind nothing. Old `/events/*` links stop working; none are published outside the app.
- Rollback: revert the PR; no persisted state changes (tab, filters and toggle are in-memory).

## Open Questions

- Whether the game awards `battlesPoints[i]` twice per battle (kill score and high score); answered by the verification task comparing lane totals, and absorbed by D4 either way.
