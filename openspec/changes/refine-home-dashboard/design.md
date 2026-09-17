## Context

`pages/home` currently renders only the calendar. The three new/changed sections each need data and rendering logic that today lives entirely inside a different page:

- Token status: no existing consumer renders `gameModeTokens` as a dedicated widget; it's only read internally by guild-raid countdowns and goal/insight estimates.
- Project cards: `features/project-management` already computes and renders the condensed card content the Projects dashboard (`pages/goals`) uses.
- Daily-raids schedule: the schedule engine and its goal→resource→location rendering (`RaidSchedule`, `resource-card.tsx`, `use-daily-raids.ts`) live inside `pages/dailies`.

This repo forbids page-to-page imports (`pages/home` may not import `pages/dailies` or `pages/goals` directly), so each piece of reused logic needs a home outside both pages it's shared between. See proposal.md for motivation; see the specs for exact required behavior.

## Goals / Non-Goals

**Goals:**

- Reuse existing computation (project summaries, the daily-raids schedule engine, `gameModeTokens`) rather than re-deriving it for the home widgets.
- Land the FSD boundary correctly the first time: shared logic in `features/`, not duplicated per page.
- Keep the daily-raids widget's location-flattening/dedup logic isolated from Today's own goal-grouped rendering, so Today's behavior is provably unchanged.

**Non-Goals:**

- Redesigning the Projects dashboard cards or the Today page themselves — this change only adds new consumers of their existing data/summary logic.
- A generic "home widget" framework. Three sections, three purpose-built pieces — no shared widget-shell abstraction unless a fourth one shows up later.
- Any backend change — `gameModeTokens`, project summaries, and the daily-raids schedule are already exposed to the frontend.

## Decisions

**Token Availability stays page-local to `pages/home`, not a new feature slice.**
Nothing else consumes it today (unlike Projects and Daily Raids, which each already have a second consumer — `pages/goals` and `pages/dailies` respectively). Per this repo's FSD convention, logic reused by multiple pages gets promoted to a feature/entity; single-consumer logic doesn't need that indirection yet. It lives under `pages/home/ui/token-availability/`, reading `gameModeTokens` directly from the existing player-data query and the existing app-shell sync action (`fsd/app/providers/player-data-sync-button.tsx`, already above the page layer so this is not a boundary violation).
_Alternative considered_: a new `entities/game-mode-tokens` slice. Rejected for now as premature — nothing else needs it; promote it if a second consumer appears (e.g. a nav-bar token indicator).

**`features/project-management` gains a condensed-card entry point in its public API; no new slice.**
The dashboard card's data (color, name, description, available/blocked/estimate) is already computed there. The home widget needs a smaller rendering of the same data plus the capped-list/"+N more" selection logic — both belong in `project-management`'s public API (e.g. a `ProjectSummaryCard` component and a `useProjectsForHome()`-style selector), consumed by both `pages/goals` (full dashboard) and `pages/home` (capped list). No page-to-page import is introduced; both pages import the feature.

**New `features/daily-raids` slice owns the schedule engine and location-level rendering primitives; `pages/dailies` is refactored to consume it.**
This is the one genuine extraction. `use-daily-raids.ts`, `raid-schedule.tsx`, and `resource-card.tsx` currently compute and render goal→resource→location. The home widget needs the same underlying schedule (today's real, energy-budget-constrained raid list for a project) but flattened to one row per location. Rather than duplicating the schedule computation, the computation (`use-daily-raids.ts` and its calc modules) moves into `features/daily-raids`, keeping its existing output shape (goal-grouped). `pages/dailies` continues to render it goal-grouped, unchanged. A new flattening/dedup function — also in `features/daily-raids`, since it operates on that same schedule output — collapses it to the per-location rows the home widget needs (see below), and a new compact `LocationRow` presentational component (ported from V1's `daily-raids-section.tsx` pattern) renders it. `pages/home` imports only the flattened view and the compact row; it never touches the goal-grouped shape.
_Alternative considered_: build the flattening logic directly in `pages/home` against a public "get today's schedule" API from `features/daily-raids`. Rejected — the flattening/dedup rule (combine same-location raids across goals) is schedule-shape logic, not home-page-specific presentation, and keeping it next to the schedule computation means any future consumer gets correct behavior for free instead of re-implementing the merge rule.
_Note_: `RaidSchedule`'s existing unused `compact` prop is a different concept (hides per-location detail, keeps goal/resource grouping) and doesn't satisfy the "one row per location, no goal relation" requirement — it's left as-is for a future Today-page density option, not reused here.

**Location dedup/merge rule**, ported from V1's `daily-raids-section.tsx` (`toBeRaidedLocations`): iterate the schedule's goal→resource→location entries in priority order; key by location id (or by resource id for Onslaught, which has no fixed node); on a repeat key, sum `raidsToPerform` into the existing entry instead of adding a new row. This is the same merge V1 already validated in production.

**Active-project resolution is shared, not re-implemented.**
The "Active project, falling back to Default" default is already Today's own selection rule (`daily-raids-today` spec). The home raids widget and Today should resolve this identically, so the resolver moves alongside the schedule computation in `features/daily-raids` (or is called from wherever Today's own default currently lives, if that's already shared) rather than being re-derived in `pages/home`.

## V1 Parity Checklist

V1 source: `tacticusplanner/src/fsd/1-pages/home/{desktop-home,daily-raids-section,goals-section,lre-section,game-mode-tokens}.tsx`.

**V1 asset/icon ids reused:**

- Token icons (`tokenIcons` map in `game-mode-tokens.tsx`): `guildRaidToken`, `arenaToken`, `onslaughtToken`, `salvageRunToken`, `bombToken` — reused as-is, same `MiscIcon` keys.
- Location reward icons: unit shard icons (`UnitShardIcon`) and upgrade material icons (`UpgradeImage`), as used in `daily-raids-section.tsx`'s `LocationRow` — reused as-is.
- Campaign location chip (`ChipCampaignLocation`, compact/non-clickable variant) — V1 asset; V2 equivalent is its own existing compact-chip component in `pages/dailies`, not a literal port, since V2 already has richer campaign presentation metadata (see `daily-raids-today` spec's "Character Lookup presentation" requirement).

**V1 navigation/layout pattern — kept vs. changed:**

- V1: single `flex-wrap` row of independent cards, order Daily Raids → LRE (conditional) → Goals → static calendar image. **Changed**: V2 uses an explicit order (Token Availability → Projects/Raids row → Calendar) with Projects and Raids paired in a 2-column layout at ≥768px and stacked at <768px, per this change's explicit section-order requirements — not a free-flowing wrap.
- V1: each card is independently clickable, navigating to its full page. **Kept**: same pattern for Projects (→ project detail) and Daily Raids (→ Today); Token Availability is not a navigation target in V1 either (kept non-navigating).

**V1 secondary states — keep / drop / redesign:**

- Stale-sync banner inside Token Availability (`SyncBanner`, "Refresh Required" + "Sync now"): **keep the informational half, drop the trigger**, redesigned as a banner that names the last-sync time and points at V2's existing app-shell sync control, rather than calling V1's `useSyncWithTacticus` (or V2's `player-data-sync-button`) itself — `pages/home` can't import either, since both live in the `app` layer this repo's FSD layering forbids a page from importing.
- Token over-cap indicator ("OVER CAP +Xm") and full-in countdown: **keep**, same derivation logic (see `home-token-availability` spec's worked example).
- "No API key" marketing announcement banner (`desktop-home.tsx`'s `announcements()`): **drop** — dated onboarding copy specific to V1's API-key rollout, not relevant to V2's onboarding flow.
- Home questionnaire banner: **drop** — already disabled in V1 itself (`questionnaireBannerEnabled = false`), dead code there.
- Goals card's per-goal "Done"/"Blocked" chips and energy/onslaught/ETA estimate column: **redesign** — this change shows projects, not individual goals, so these become the project card's existing available/blocked/estimate summary fields instead (already defined by `project-management`'s spec), not a literal port.
- Goals card's "+N more"/note line: **keep the pattern**, redesigned as the Projects widget's "+N more" project-count control; the free-text goal `notes` field has no project-level equivalent and is dropped.
- Daily Raids card's "Raided" section (dimmed, already-completed locations): **drop** — explicit requirement of this change (home-raids-widget spec).
- Daily Raids card's onslaught-location merge-by-key logic: **keep**, generalized to all locations per the home-raids-widget spec's dedup requirement (V1 only merged Onslaught; V2 merges any location shared across goals).
- LRE section (event stage, countdown, shard progress, per-track completion bars): **drop** — no V2 LRE page exists to link to or source progress from (see proposal.md).
- Static current/next-season calendar images: **drop** — superseded by V2's already-built dynamic `EventsCalendar`, unaffected by this change except for its position.
- `TokenAvailability` widget itself: **keep**, ported (see requirements above), since no equivalent exists yet in V2.

## Risks / Trade-offs

- [Extracting `use-daily-raids.ts` out of `pages/dailies` touches the page every user of Today already relies on] → Move the computation with behavior-preserving tests first (existing Today/Bonus Raids/Today's Attempts test coverage must pass unchanged before the home widget is built on top), so a regression in Today surfaces immediately rather than being attributed to the new widget.
- [Home page now issues the same queries (`gameModeTokens`, project list, daily-raids schedule) that `pages/goals` and `pages/dailies` also issue] → These already go through TanStack Query; as long as query keys match what those pages use, navigating between `/home` and `/dailies`/`/goals` is cache-warm, not a duplicate fetch. Verify query keys are shared, not accidentally namespaced per page.
- [Condensed project cards and compact location rows are new presentational components, not just reused ones] → Keep them thin (props in, markup out) so they're easy to visually verify against the full-size versions they're condensing.

## Migration Plan

No data migration. Rollout is a single frontend deploy; the widgets are additive to an existing page, so this can ship as one change with no feature flag. Rollback is reverting the deploy.
