# Tasks

## 1. Shared search-param hook

- [x] 1.1 Add `useSearchParamState(key, isValid, fallback, { history })` in `apps/web/src/fsd/shared/lib` (exported from its barrel) with a unit test covering: valid value read, fallback on missing, invalid value removed with replace, `set(fallback)` deletes the param, `history: "push"` adds an entry and `"replace"` does not; verify with `pnpm --filter web test:run src/fsd/shared/lib`.

## 2. Goals page URL state

- [x] 2.1 Replace the `tab` and `goalType` `useState` in `goals-page.tsx` with `useSearchParamState("status", ...)` / `("type", ...)` (replace history, defaults `toReach` / `all`, validated against the entity select value lists); verify `goals-page.test.tsx` passes and a new test covers reload-with-params, unknown value fallback and no history entry per the `goals-navigation` scenarios.
- [x] 2.2 Replace `editGoalId` with the `goal` param (push history; validated against the loaded list, kept while loading; dropped with replace when unknown); the dialog's close control navigates (replace) rather than clearing local state, and a dirty dialog registers the existing `shared/ui/unsaved-changes-guard.tsx` (`useBlocker`) so Back, forward and in-app navigation that would drop the `goal` param ask first, proceed on discard and reset the blocked navigation on keep; verify new tests for the four `goal-edit-dialog` scenarios (Back closes, reload reopens, unknown id, dirty Back asks first).
- [x] 2.3 Keep `use-goals-project-scope.ts` as the async variant and add a doc comment pointing at the shared hook; verify `use-goals-project-scope.test.tsx` and `goals-project-scope.test.tsx` still pass unchanged.
- [x] 2.4 Check `goals-page.tutorial.tsx` targets: no step targets the filter state itself, so only confirm the tour still runs with `goals-page.tutorial.test.tsx`.

## 3. Legendary Event tab

- [x] 3.1 Replace `selectedTab` in `legendary-event-page.tsx` with `useSearchParamState("tab", ...)` validated against `"overview" | LegendaryEventLaneId`, replace history; keep the Overview lane-row select-and-scroll behaviour; verify `legendary-event-page.test.tsx` plus new cases for reload keeps lane, shared lane link, unknown value falls back and no history entry (`legendary-events-hub` scenarios), and `legendary-event.tutorial.test.tsx` still passes.

## 4. Raid Bosses URL repair

- [x] 4.1 Extract `repairRaidBossesSearch` into `raid-bosses-search.ts` beside the page, replace both repair effects with one effect calling it, and remove `/* eslint-disable max-lines */`; verify a unit test enumerates every `raid-boss-library` repair scenario (unknown entity with and without `tab`, invalid context, invalid tab, season normalisation, unknown comp) and `raid-bosses-page.test.tsx` and `raid-bosses.tutorial.test.tsx` pass; verify `pnpm --filter web lint` reports no `max-lines` error for the page.

## 5. Forms read request state from the mutation

Moved to `tune-client-query-caching` group 6: that change rewrites the `onSuccess` of the same nine mutation sites (guild register/sync, Tacticus integration, V1 import), so the `status`/`errorMessage` removal lands in the same edit there. This change lands after it.

## 6. Onslaught draft on the shared idiom

- [x] 6.1 Rewrite `pages/onslaught/ui/onslaught-page.tsx` on `useRevisionedDraft` (identity `toDraft`, revision attached in `toPayload`, `updateOnslaughtProgress` as `save`), applying `tier-after-sector-change.ts` through the hook's setter and removing the page's own 409 path and Save button; verify `onslaught-page.test.tsx` passes with its save/conflict/error cases rewritten against the hook outcomes.
- [x] 6.2 Add `UnsavedChangesBar` and `UnsavedChangesGuard` to the page, rendered inside `createMemoryRouter` in tests; verify new tests for bar appears/disappears, Discard, revision conflict, other API error, and leave confirmation with and without edits (`onslaught-progress-entry` scenarios).
- [x] 6.3 Add `onslaught.unsaved.{message,save,discard}` and `onslaught.leave.{title,description,stay,leave}` to `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations matching the tone of `progress.events.unsaved.*`; verify the i18n key test and a grep showing no English text in the de/es/fr entries.
- [x] 6.4 Create `pages/onslaught/ui/onslaught-page.tutorial.tsx` (`useOnslaughtTutorial`, registered via `useTourPageSteps`) with desktop and mobile steps for the alliance cards and the unsaved-changes bar, plus `tour.onslaught.steps.*` keys in `{en,de,es,fr}` with real translations; verify a tutorial test renders both step sets.

## 7. Setup flow reducer

- [x] 7.1 Replace the four flow `useState`s (`account-setup-route.tsx`, `account-setup-screen.tsx`, `setup-v1-import.tsx`) with one `useReducer` in `AccountSetupRouteForStep`, keeping the `key={step}` remount and the router-state `suggestedDisplayName`; verify `account-setup-route.test.tsx`, `account-setup-screen.test.tsx`, `setup-v1-import.test.tsx` and `account-setup-layout.test.tsx` pass unchanged.

## 8. Desktop verification (viewport at or above 768px)

Required data states: an account with at least one Paused and one Reached goal in two projects; an active Legendary Event with synced progress; Onslaught progress saved at a known revision (second tab available to force a conflict).

- [ ] 8.1 On `/plan/goals`, set status and type, reload, confirm both filters and the list persist, then press Back and confirm it leaves the page in one step.
- [ ] 8.2 Open Edit on a goal, reload, confirm the dialog reopens; edit a field, press Back, confirm the confirmation appears and both outcomes behave as specified.
- [ ] 8.3 On an event page select Beta, reload, confirm Beta is selected; open `?tab=delta` and confirm Overview with the param removed.
- [ ] 8.4 On `/my-game/onslaught` change a tier, confirm the bar spans the content area without covering the last card, Discard restores, Save succeeds, and a save from a second tab produces the translated conflict message; confirm leaving with edits asks first.
- [ ] 8.5 Run the onslaught tour on desktop and confirm every step attaches to its target.

## 9. Mobile verification (viewport below 768px, same-origin 420px iframe)

- [ ] 9.1 Repeat 8.1 and 8.3 in the iframe and confirm the mobile card list and the fixed tab strip reflect the URL state.
- [ ] 9.2 On `/my-game/onslaught` in the iframe, confirm the unsaved-changes bar sits directly above the bottom navigation without overlapping it or the last alliance card.
- [ ] 9.3 Run the onslaught tour on mobile and confirm every mobile step attaches to its target.

## 10. Gates

- [x] 10.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps` and confirm all pass.

## Notes (as built)

- `useSearchParamState` lives in `shared/lib/browser` (beside `usePersistedSelection`) to keep `shared/lib` within the FSD module limit. `isValid` may return `undefined` while its data loads, which keeps the param but returns the fallback; the `goal` param uses this.
- Goals: the status/type value lists moved to `entities/goal/model/types.ts` (`isGoalStatusFilterValue`, `isGoalTypeFilterValue`). The dirty Edit dialog blocks with its own `useBlocker` instead of `shared/ui/unsaved-changes-guard.tsx`, because that guard only blocks path changes and Back here only drops `?goal=`; it shows the dialog's existing confirmation.
- Raid Bosses: `repairRaidBossesSearch` returns `{ pathname?, search } | null` (an unknown entity changes the path); the detail logic moved to `hooks/use-raid-boss-detail.ts` to get the page under 400 lines.
- Onslaught: the bar's tour step targets the help paragraph, since the bar only renders with edits (same as campaign events). `onslaught.saveError` now says the changes are still there instead of "Refresh", since the draft survives a failed save.
- Groups 8 and 9 (desktop/mobile manual checks) are open for a browser pass.
