# Design

## Context

See proposal.md - Why. The Goals page (`pages/goals/ui/goals-board/goals-page.tsx`) renders one list for both the unscoped plan and a project scope (`?project=`), so "plan + project view" is one surface. Estimates come from `usePlanInsights(null)` as `EstimateOutcome` per goal id (`date` is an inclusive UTC `yyyy-mm-dd`). Season data comes from the catalog datasets `event-definitions` and `events-calendar` read with `useCatalogDataset`, as `use-hse-projection`, `use-hre-instance` and the home calendar already do. Rows are rendered through `SortableList`, which applies the sortable ref to each item's own root element.

## Goals / Non-Goals

**Goals:**

- Restore V1's season-planning workflow with an explicit cut-off and a non-colour signal.
- One source of truth for season dates (the catalog), no hard-coded anchors in the web app.
- No change to how estimates are computed.

**Non-Goals:**

- Project targets (season or date) and "Move to top" (Phase 2, a separate UserJot request).
- Showing fit on Dailies, Schedule, Insights, the home projects widget or the Projects page.
- Server-side persistence of the Season fit choice.

## Decisions

1. **Owning slice: `features/goal-planning`, `model/season-fit/`.** Pure functions in `season-windows.ts` (`resolveSeasonWindows(definition, occurrences, nowMs) -> SeasonWindows | null`) and `season-fit.ts` (`seasonFitOffset(estimateDate, windows)`, `isSeasonFitEligible(row, estimate, reached)`, `computeSeasonFits(rows, estimates, reached, windows)`, `seasonCutoffGoalId(orderedIds, fits)`), plus `use-season-fit.ts` (`useSeasonFit(mode, rows, estimates, reachedByGoalId) -> SeasonFitState`). Exported through `features/goal-planning/index.ts`; consumed only by `pages/goals`. Alternative: an `entities/game-event` slice - rejected for now, there is one consumer; the pure window function moves there unchanged if a second consumer (Phase 2) appears.
2. **Cycle starts, not occurrence ends.** A season's deadline is the next cycle start. For Battle Pass this is the season end (the projected `durationDays` 34 vs authored 35 days would otherwise disagree by a day); for Guild War it is "before the next war season starts", which is what a player preparing heroes needs, and it keeps the 20-day gap between Guild War seasons inside a cycle instead of creating an undefined bucket. Projection is computed from the definition directly (`anchorUtc + k * intervalDays`), so offsets 2 and 3 work beyond the catalog's 15-week projected rows; authored rows only override slot starts.
3. **Completion instant = Done By + 1 day at 00:00 UTC.** Done By is an inclusive calendar day; treating completion as the end of that day is conservative and matches V1's intent ("achievable within the season"). Offsets compare instants only; formatting reuses `formatEstimateDate` (UTC-pinned).
4. **Eligibility excludes Ability goals by rule.** V1 excluded them only because their `daysLeft` was 0; the requester asked to keep that behaviour, so `goalType === "Ability"` is an explicit exclusion. Paused, Reached, Blocked and unestimated goals have no meaningful finish date and are excluded too.
5. **Persistence: `usePersistedSelection("goals.overview.seasonFit", isSeasonFitMode, "off")`.** Same per-browser mechanism as Group, which already satisfies "survives reload, shared across scope". Not URL state: it is a display preference, not a filter that changes which goals show.
6. **Divider as a non-sortable sibling.** Desktop: `GoalsTable`'s `renderItem` returns a fragment `<SeasonCutoffRow/>` + the sortable `<TableRow>` for the cut-off goal; the divider row is not in `items`, so dnd-kit's ids and drop targets are untouched. Mobile: same in both card lists (`<li role="separator">`). The page computes the cut-off goal id once over all visible rows (Group None only) and passes it down; rows receive their fit via a `seasonFit` map prop so memoised rows compare one value per id (`sameRowProps` gains it).
7. **Accent, not background tint.** A 3px left accent (`border-l-[3px]`) in new tokens `--season-fit-on-track`, `--season-fit-caution`, `--season-fit-urgent` (light and dark, each >= 3:1 against `--card`/`--background`), plus a text label using the existing `text-muted-foreground`. Background tints would collide with the Reached row's `bg-success` and with the contrast audit; Reached rows are never eligible anyway.
8. **Desktop vs mobile.** Same data and copy. Desktop: select in the filters row (`GoalsToolbar` gets a `seasonFit` slot), divider is a `<TableRow>` with one `colSpan` cell. Mobile: icon-only select trigger (lucide `CalendarRange`) with `aria-label`, divider is an `<li>`; the tour targets `[data-testid="goals-season-fit"]` on both breakpoints, so one step serves both step lists.
9. **Guild Raid data dependency.** The web resolver is generic over any `Fixed` or authored definition. Guild Raid mode is disabled until the catalog provides dates; making `guild-raid-season` `Fixed` is the companion API data change `add-goal-season-fit` and needs no web change.

## Risks / Trade-offs

- [Catalog anchors wrong or game changes cadence] -> one data fix in the API's curated file updates every client; no web release needed.
- [Divider row and drag animation] -> the divider does not move during a drag and re-positions after drop; acceptable and covered by a test that the drag ids exclude it.
- [Estimate recomputation churn re-renders all rows] -> the fit map is derived with `useMemo` from the stable estimates map and passed per id, so unchanged rows stay memoised.
- [Goals page test file size] -> new behaviour is tested in focused files (`season-windows.test.ts`, `season-fit.test.ts`, `goals-season-fit.test.tsx`) rather than growing `goals-page.test.tsx`.

## Migration Plan

Client-only, default Off, no flag. Rollback is reverting the PR.
