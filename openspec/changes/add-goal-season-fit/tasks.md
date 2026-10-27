# Tasks

## 1. Season window and fit logic

- [x] 1.1 Add `features/goal-planning/model/season-fit/season-windows.ts` (`resolveSeasonWindows`) with `season-windows.test.ts` covering the Battle Pass and Guild War worked examples, authored-start override, projection past the 15-week window, non-`Fixed` with and without a current authored occurrence, missing definition, and invalid anchor.
- [x] 1.2 Add `season-fit.ts` (`seasonFitOffset`, `isSeasonFitEligible`, `seasonCutoffGoalId`) with `season-fit.test.ts` covering the Battle Pass fit worked example, deadline-day boundary, Ability/Paused/Reached/Blocked/unestimated exclusions, cut-off placement (none, first spill, later offset-0 goal below) and the "past last known boundary" rule.
- [x] 1.3 Add `use-season-fit.ts` reading `event-definitions` and `events-calendar` via `useCatalogDataset`, returning per-mode availability, the current season (number, deadline, kind) and the fit map; export the hook, mode type and guard from `features/goal-planning/index.ts`; verify with a hook test (loading, failure, ready).

## 2. Goals page UI

- [x] 2.1 Add `--season-fit-on-track`, `--season-fit-caution`, `--season-fit-urgent` (light and dark) to `packages/ui/src/styles/globals.css` and extend `goal-contrast-audit.test.ts` to check each >= 3:1 against card and background in both themes.
- [x] 2.2 Add `season-fit-select.tsx` (desktop labelled select, mobile icon trigger, disabled modes with reason) and wire it through a `seasonFit` slot in `goals-toolbar.tsx`; persist with `usePersistedSelection("goals.overview.seasonFit", ...)` in `goals-page.tsx`.
- [x] 2.3 Render the fit label beside the Done By date (`goal-row-shared.tsx`) and the left accent on desktop rows and mobile cards; add the `seasonFit` prop to `GoalsListProps` and `sameRowProps`.
- [x] 2.4 Render the cut-off divider (desktop table row with `colSpan`, mobile `<li role="separator">` in both card lists) before the cut-off goal, only with Group None.
- [x] 2.5 Add page-level tests (`goals-page.test.tsx` "Season fit") and `goals-season-fit.test.tsx` covering the spec scenarios: Off renders nothing, choice survives remount and scope change, labels and accents per offset, Ability and Blocked goals ignored, divider placement, grouped list without divider, project scope, disabled Guild Raid mode, mobile trigger and mobile divider; confirm drag ids exclude the divider.

## 3. Copy and tour

- [x] 3.1 Add `goals.seasonFit.*` keys (select label and options, disabled reason, labels, tooltips, divider copy) to `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations matching the sibling `goals.*` tone; verify the i18n key parity test and that no de/es/fr entry is English.
- [x] 3.2 Add a `seasonFit` step targeting `[data-testid="goals-season-fit"]` to both desktop and mobile step lists in `goals-page.tutorial.tsx`, with `tour.overview.steps.seasonFit.{title,content}` in en/de/es/fr; verify `goals-page.tutorial.test.tsx`.

## 4. Gates

- [x] 4.1 Run the targeted tests for the touched files, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd` and `git diff --check`; full suite runs in CI (project instruction: no full local suite).

## 5. Desktop verification (viewport at or above 768px)

Required data states: an account with at least four Active Rank/Ascension goals whose Done By dates straddle the current Battle Pass deadline, one Active Ability goal, one Paused goal, one Blocked goal, and a project holding a subset of them.

- [ ] 5.1 Season fit select in the filters row; Battle Pass and Guild War selectable; Guild Raid disabled with its reason while the catalog has no raid season dates.
- [ ] 5.2 Labels, tooltips and accents match the offsets; Ability, Paused and Blocked rows show none.
- [ ] 5.3 Divider before the first spilling goal with Group None, absent with Group Type; still correct in project scope; dragging a row across the divider re-places it after the drop.
- [ ] 5.4 Tour includes the Season fit step.

## 6. Mobile verification (viewport below 768px)

Same data states as group 5.

- [ ] 6.1 Icon-only Season fit trigger in the second control row; choosing a mode updates the cards.
- [ ] 6.2 Card labels, accents and the divider list item match desktop; divider also shows in reorder mode.
- [ ] 6.3 Tour includes the Season fit step on mobile.

## Deferred / out-of-session

- Guild Raid mode data: companion `tacticus-planner-api` change `add-goal-season-fit` makes `guild-raid-season` a `Fixed` 14-day recurrence (decided 27 Oct, separate PR). Web side needs no change; Guild Raid mode enables once that catalog ships.
