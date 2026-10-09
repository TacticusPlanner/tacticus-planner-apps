## Context

See proposal.md (Why) and the three delta specs for required behavior.

Current state:

- `pages/progress/ui/campaign-events-page.tsx` owns the draft (`draftOverride`), the revisioned save and the 409 refetch inline; `event-card.tsx` resolves values as `manual ?? synced ?? 0` and labels anything non-manual "Synced".
- `features/daily-raids/model/use-eligible-campaign-battles.ts` (`useEligibleCampaignBattles`) is the single place that reads the live-progress, `campaign-events-progress` and `campaign-progress` chunks and applies `availableCampaignBattles`. It builds `campaignEventProgressByKey` from the synced Dexie chunk only (`buildCampaignEventProgressByKey` in `campaign-event-eligibility.ts`) and returns the raw chunk results so callers can gate on hydration. Three consumers use it: `useDailyRaids` (Today, Raids Plan, Home raids widget), `useHomeScreenEventLocations` (Home event tab) and `pages/goals/model/shared/use-goal-catalog.ts` (Goals, Insights, per-project estimates), which is how `partial-goal-planning`'s "one campaign node-eligibility rule" holds.
- `features/daily-raids/model/use-daily-raids.ts` already loads one override, Onslaught progress, via `onslaughtProgressQueries` with `enabled: isAuthenticated`, requires `isSuccess` before calculating and returns `{ status: "error" }` on failure.
- `pages/onslaught/ui/onslaught-page.tsx` has a second, slightly different copy of the draft/save/409 logic (it keeps `setDraft(saved)` after success, so its draft never returns to "clean").
- The app uses a data router (`createBrowserRouter`), so `useBlocker` is available.
- On mobile, `app/layout/mobile-layout.tsx` fixes a bottom nav of height `--mobile-nav-height`.
- Reusable pieces already exist: `usePersistedSelection` (shared/lib), `ConfirmationDialog` (shared/ui), and `Accordion`, `Switch`, `Tooltip`, `Slider` in `@workspace/ui`.

## Goals / Non-Goals

**Goals:**

- One resolver for effective event progress, used by both the page and the shared campaign eligibility, so every surface that picks farm nodes (Today, Raids Plan, Home, Goals, Insights) agrees with what the page shows.
- A generic, tested draft-save hook and unsaved-changes bar with no campaign-event knowledge.

**Non-Goals:**

- Migrating the Onslaught page onto the new hook/bar (a follow-up; the hook is shaped so that migration is mechanical).
- Any API or persistence change; the override payload keeps its `null`-means-unset semantics.
- Changing which event is active or the countdown (owned by `correct-campaign-event-end-countdown`).

## Decisions

### 1. Effective-progress resolver lives in `entities/player-data-override`

Add `resolveCampaignEventProgress(synced, override)` returning, per track, `{ completedBattleCount, completedChallengeBattlesIds, battleSource, challengeSource }` with sources `"manual" | "synced" | "none"`, plus a map builder keyed by `{campaignGroupId, type}`. Export it through the entity's `index.ts`.

- Both `pages/progress` and `features/daily-raids` may import an entity, so this is the lowest slice both can reach without a feature-to-feature or page-to-feature import.
- Alternative: keep it in `features/daily-raids` and re-export — rejected, pages consuming a feature's internals for a display concern couples the progress page to raid planning.
- `campaign-event-eligibility.ts` keeps its `CampaignEventProgressEntry` shape; the eligibility hook builds it from the resolver's output instead of from the synced chunk directly, so `daily-raids-calc` and its tests are untouched apart from new fixtures. The synced-only `buildCampaignEventProgressByKey` is removed.

### 2. Overrides merge inside the shared eligibility hook

A small hook, `useEffectiveCampaignEventProgress(isAuthenticated)` in `features/daily-raids/model`, reads the synced chunk, runs `useQuery({ ...campaignEventProgressQueries.current(), enabled: isAuthenticated })`, and memoises the merged map on both inputs. It returns `{ byKey, ready, isError }`.

`useEligibleCampaignBattles` calls it in place of its synced-only read and passes `byKey` to `availableCampaignBattles`. Instead of the raw `campaignEventProgressResult` it now returns two flags: `campaignEventProgressReady` and `campaignEventProgressError`.

- **Why here and not in `useDailyRaids`:** the eligibility hook exists so that every surface chooses farm nodes from the same set (`partial-goal-planning`). Merging overrides only in `useDailyRaids` would make Today and Raids Plan schedule a node that Goals and Insights call unavailable, breaking that requirement.
- **When `ready` becomes true:** once synced progress has loaded and, when signed in, the override request has settled (success or failure). Signed-out callers (Home, Goals previews) never wait for a request that is disabled.
- **What each consumer does with the flags:**
  - `useDailyRaids` (Today, Raids Plan, Home raids widget) adds `campaignEventProgressError` to its error gate and `campaignEventProgressReady` to its ready gate. This follows the Onslaught precedent: a failed override load shows the explicit error state, not a schedule silently built from synced data.
  - `useHomeScreenEventLocations` gates only on `campaignEventProgressReady`. It has no error state, so on a failed load it keeps the synced-only view.
  - The Goals catalog consumes only `availableBattles` and has no gate. It shows synced-only eligibility until overrides arrive, then recomputes.
- **Shared query key:** the key is shared with the progress page, so a save there (`setQueryData`) immediately updates every consumer without a refetch.

### 3. Generic `useRevisionedDraft` in `shared/api`

```
useRevisionedDraft<TSaved extends { revision: number }, TDraft>({
  query,                 // UseQueryResult<TSaved>
  queryKey,              // for setQueryData / refetch
  toDraft: (saved) => TDraft,
  toPayload: (draft, revision) => TSaved-shaped body,
  save: (payload) => Promise<TSaved>,
  isEqual?: (a, b) => boolean   // default: structural compare
}) -> { draft, setDraft(updater), isDirty, isSaving, save(), discard(), status }
```

- `draft` is `null` until the user edits (render from `toDraft(query.data)`), so a background refetch before any edit is picked up automatically.
- `isDirty` is a structural comparison of the draft with `toDraft(query.data)`, which is what makes "edit back to the saved value hides the bar" work; the existing `draft !== null` check cannot.
- `save()` resolves to `"saved" | "conflict" | "error"`: success writes the response with `setQueryData` and clears the draft; `ApiError` 409 refetches the query and clears the draft; any other failure keeps the draft. The hook never exposes `ApiError.message` — the caller maps the status to its own translation keys, which fixes the raw-message bug structurally.
- It is generic and domain-free, and it is an API-resource helper (TanStack Query plus `ApiError`), so it lives in `shared/api` next to `ApiError`. Placing it in `shared/lib` was tried first and rejected: the `shared/lib` barrel is imported by light-weight modules whose tests mock `react-i18next`, and pulling `shared/api` (which initialises i18n) into that barrel broke them.
- Alternative: a feature slice (`features/override-editing`) — rejected; two pages would import it, but it has no domain model, and a feature adds nothing over `shared`.

### 4. `UnsavedChangesBar` and leave guard in `shared/ui`

- `UnsavedChangesBar({ open, isSaving, message, saveLabel, discardLabel, onSave, onDiscard })` renders as the page's last child with `position: sticky` (`bottom-4` on desktop; `bottom: calc(var(--mobile-nav-height) + 1rem)` on mobile via `useIsMobile()`). Sticky rather than `fixed` + spacer: the app scrolls the window, so a sticky bar pins to the viewport bottom while staying in the page flow — it spans only the content column (no sidebar offset math) and can never cover the last card. On mobile it sits level with the scroll-to-top FAB (`nav + 1rem`) and keeps a right margin so the two never overlap. Labels are passed in, keeping the component namespace-agnostic.
- `<UnsavedChangesGuard when={isDirty} …labels />` combines `useBlocker` (blocking only pathname changes) rendered through the existing `ConfirmationDialog` (Stay / Leave) with a `beforeunload` listener registered only while dirty. It is a component rather than a hook because it renders the dialog. Leaving via the dialog proceeds the blocker; the draft is discarded implicitly by unmount.
- This desktop/mobile split is layout-only (position and offset); both forms use the same controls and the same Joyride target (`data-testid="unsaved-changes-bar"`).

### 5. Page structure

```
CampaignEventsPage
  useRevisionedDraft(...)             -> draft overrides + save state
  resolve(draft, synced)              -> per-track effective progress (Decision 1)
  buildEventView(events, resolved, activeId)
     -> { current?: EventView, list: EventView[] (unfinished first) }
  <CurrentEventSection event=current />      (expanded, not collapsible)
  <EventListToolbar hideCompleted />         (Switch, usePersistedSelection "on"/"off")
  <Accordion type="multiple"> EventCard* </Accordion>
  <UnsavedChangesBar /> + guard dialog
```

- Completion and ordering are pure functions in `model/campaign-events.model.ts`, computed from the draft-resolved values so an event moves groups while editing, and unit-tested there.
- Accordion `type="multiple"`, all collapsed; open state is in-memory only (not persisted) — the collapsed summary already carries the information.
- `buildEvents` stops filtering core characters to owned ones and instead returns `{ id, owned }` pairs.

### 6. One track editor built on the existing `Slider`

The shared `Slider` already renders a filled range, so it serves as the progress bar and slider in one; the separate `Progress` and `Input` are removed. The stepper is `−` / `count/total` / `+` / Max. `Slider` keeps its keyboard support and the enlarged hit target from `shared-slider-interaction`. "Reset to synced" is a ghost button shown only when `battleSource === "manual"` (and separately for challenges).

### 7. Challenge labels by node order

Sort each track's challenges by `nodeNumber` and label them `progress.events.challengeN` ("Challenge {{n}}"), with the battle id in a `Tooltip` and `aria-describedby`; toggles keep `aria-pressed`. This replaces the regex on the id suffix, which produced "3B"/"7B".

### 8. Tour

Add `campaign-events-page.tutorial.tsx` with `desktop` and `mobile` step arrays targeting `data-testid`s on the current-event section, the first event card summary, the first track editor, the hide-completed switch and the unsaved-changes bar. The bar is hidden when clean, so its step targets a static explanatory anchor in the toolbar instead of the bar itself on both forms. The mobile array differs only where a target is laid out differently (tracks stacked), so the step order is the same.

## Risks / Trade-offs

- [Daily raids now waits for one more request; an override outage blocks Today] → Same trade-off already accepted for Onslaught; the error state is explicit, not a silently wrong schedule.
- [During an override outage, or while the request is in flight, Home and Goals/Insights use synced-only eligibility while Today shows an error] → The surfaces never disagree on a _computed_ schedule: Today computes nothing in that state. Making Goals block on the override request too would add a loading gate to every goal estimate for a rarely-used override; revisit if mismatches are reported.
- [A stale manual override lower than real progress now hides nodes that synced data would allow] → Intended (spec assumption); the page shows Manual with "Reset to synced", and the collapsed summary flags manual values so they are easy to spot.
- [Structural `isEqual` on every render over ~a few dozen small entries] → Negligible at this size; memoise on draft and query data.
- [`useBlocker` also fires on same-page search-param changes] → The page has no URL state; the guard only compares pathname changes.
- [`correct-campaign-event-end-countdown` also modifies `daily-raids-today`] → Different requirement; whichever archives second syncs against the updated main spec.

## Migration Plan

Frontend-only; no data migration. Existing overrides are read as-is. Rollback is a revert: overrides saved by the new page have the same shape as before.
