# Design

## Context

See proposal.md - Why. The app runs on a React Router data router (`createBrowserRouter`), so `useSearchParams`, `useBlocker` and router state are available everywhere. Three URL-state implementations already exist and agree on the rules this change generalises: `pages/goals/model/projects/use-goals-project-scope.ts` (replace history, drop invalid values once validation data is known), `pages/library/ui/raid-bosses/raid-bosses-page.tsx` (`tab`, `season`, `comp` with repair-to-default), and the Legendary Event master table. `shared/api/use-revisioned-draft.ts` plus `shared/ui/unsaved-changes-bar.tsx` and `unsaved-changes-guard.tsx` are the draft/409/leave idiom campaign events use; the Onslaught page predates them. The config rule for this store asks that shared tab/filter state name its owner and its default source; those are written into the spec deltas.

## Goals / Non-Goals

**Goals:**

- One way to hold a validated view-state value in the URL, with the history mode chosen per use (replace for filters and tabs, push for an open dialog).
- Mutation request state has one owner, the mutation object.
- Draft editing over a revisioned resource has one owner, `useRevisionedDraft`, on both pages that do it with a plain revision.

**Non-Goals:**

- Putting the Dailies or Insights project selection in the URL (`goals-navigation` requires it to reset on reload).
- Persisting anything new in localStorage; `usePersistedSelection` stays for the Group control only.
- Converging the Legendary Event plan write queue; it batches several resources under one revision and is named here only as the third idiom.
- Memoization, context splitting or slice moves on the touched pages (other audit changes).

## Decisions

1. **One `useSearchParamState(key, isValid, fallback, { history })` hook in `shared/lib`.** Returns `[value, set]`; `value` is the parsed param when `isValid`, else `fallback`; an invalid present value is removed with `replace` in an effect; `set(fallback)` deletes the param; `history: "replace" | "push"` picks `setSearchParams(..., { replace })`. Built on `useSearchParams` only, no library. Alternative: extend `usePersistedSelection` with a URL backend - rejected, the two have different lifetimes and mixing them hides which one a control uses. Alternative: a generic store (Zustand) - rejected, the URL is the store.
   - `useGoalsProjectScope` is not replaced: its validity depends on an async project list and it must keep the raw param while that list loads. It keeps its own code and is documented as the async variant of the same rule.
2. **Goals page owns `status`, `type`, `goal`; the Dailies layout keeps owning the project selection.** Status and type use `history: "replace"`. The Edit dialog uses `history: "push"` so Back closes it; the dialog's `onOpenChange(false)` calls `navigate(-1)` only when the current entry was pushed by this page (tracked in router `state`), and otherwise replaces the param away, so a reload-restored dialog closes without leaving the page. The existing unsaved-changes confirmation in `goal-edit-dialog.tsx` already runs from `onOpenChange`; it must also run from the Back path, so the dialog is closed through the same handler rather than by the URL change directly: the page keeps the dialog mounted while the confirmation is pending and only drops `goal` after it resolves. Fresh-load defaults stay exactly as the toolbar's current `useState` initialisers ("toReach", "all").
3. **Legendary Event tab is `tab` on the event route, validated against `"overview" | LegendaryEventLaneId`,** replace history, default Overview. The page is keyed by `eventId` (already), so navigating to another event unmounts and the param is not carried. The Overview lane-summary rows that select a lane and scroll to its grid keep working: they set the param and then scroll on the next frame, as today.
4. **Raid Bosses repairs become one pure function.** `repairRaidBossesSearch(current: URLSearchParams, state): URLSearchParams | null` takes the catalog state, the selected unit, `exactLocation`, `seasonIds`, `selectedSeasonId`, `tab`, `compId` and returns the next params or `null` when nothing changes; one effect applies it with `navigate(..., { replace: true })`. The two effects today both touch `season` with different rules; the function encodes the union in one place, in the order: unknown entity -> entity fallback; invalid context -> drop `tier`/`set`/`encounter`; invalid `tab` -> `details`; `season` -> selected id or dropped when it is the first season and no entity or tab is set; invalid `comp` -> dropped. The function is unit-tested against each `raid-boss-library` repair scenario; the page test keeps its route-level assertions. The `max-lines` disable is removed; the function and the page's view helpers live beside the page as `raid-bosses-search.ts`.
5. **Forms derive from the mutation.** `isPending` replaces `status === "submitting"`; `error` replaces `errorMessage` with the message mapped at render (`translateApiError(error)` or the existing per-form mapping); `mutation.reset()` replaces `setStatus("idle")`/`setErrorMessage(null)` on retry or field edit; where a form currently sets `status: "success"` to show a done state, `isSuccess` is used. `v1-import-panel.tsx` keeps its `result` state because the result drives further UI; only `status`/`error` go. No behaviour change, so each file's existing test is the regression check.
6. **Onslaught adopts `useRevisionedDraft` unchanged.** `query: onslaughtProgressQueries.current()`, `toDraft` is identity, `toPayload` attaches the saved revision, `save: updateOnslaughtProgress`; the bar and guard are the shared components with their own `onslaught.*` copy under `common`. The sector-change tier rule stays in `tier-after-sector-change.ts` and is applied to the draft via the hook's setter. Save outcome messages map `saved`/`conflict`/`error` to the existing `onslaught.saved`, `onslaught.conflict`, `onslaught.saveError` keys. Alternative: keep the page's own 409 path and only add the bar - rejected, that is the duplication the change removes.
7. **Setup flow state is one `useReducer` in `AccountSetupRouteForStep`.** State: `{ importAwaitingContinue, v1Suggestion, submitted, keyImported }`; actions: `importCompleted`, `keyImported`, `suggestionReceived(name)`, `submitted`. `AccountSetupScreen` and `SetupV1Import` become controlled: they receive the state they read and dispatch through the callbacks they already have, so their props barely change. The `key={step}` remount stays, with `importAwaitingContinue` derived from `step` in the reducer's initialiser as today. Router `state` for `suggestedDisplayName` stays, since it must survive Back across the name step. Alternative: a context - rejected, three components in one subtree, props suffice.

## Risks / Trade-offs

- [Back closing the edit dialog interacts with the unsaved-changes confirmation] -> the dialog is closed only through its `onOpenChange` path; a page test covers Back with a dirty draft on both outcomes.
- [Deep-linked `goal` before the list has loaded] -> validation waits for `fetchState.status === "success"`, mirroring `useGoalsProjectScope`; the param is kept while loading.
- [`useBlocker` requires a data router in tests] -> the onslaught page test renders inside `createMemoryRouter` like the campaign-events page test already does.
- [Merge conflicts with `memoize-render-hot-paths` on `goals-page.tsx` and `legendary-event-page.tsx`] -> this change edits only the state lines and the toolbar wiring; land it first or rebase, both are small.
- [Repair function ordering differs subtly from today's two effects] -> the unit test enumerates every `raid-boss-library` scenario, including the "unknown entity with `tab` set" path that today navigates to the first entity.

## Migration Plan

Client-only, no flag. Old URLs without the new parameters behave exactly as before. Rollback is reverting the PR.
