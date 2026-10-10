## 1. Effective event progress (shared by page and campaign eligibility)

- [x] 1.1 Add `resolveCampaignEventProgress` and its keyed map builder to `entities/player-data-override` and export them from the entity's `index.ts`; verify with unit tests covering manual-over-synced, synced-only, neither (source `none`), a lower manual value winning, and battle count vs challenge ids resolving independently
- [x] 1.2 Add `useEffectiveCampaignEventProgress(isAuthenticated)` in `features/daily-raids/model`. It loads `campaignEventProgressQueries.current()` (enabled when authenticated), merges overrides over synced progress with the resolver, and returns `{ byKey, ready, isError }`. `ready` waits for synced data and, when signed in, for the override request to settle. Use it inside `useEligibleCampaignBattles` in place of the synced-only read, and expose `campaignEventProgressReady` and `campaignEventProgressError` instead of the raw result. Gate `useDailyRaids` on both flags (error, then ready) and `useHomeScreenEventLocations` on ready. Verify with hook tests that an override makes a node without synced data eligible, a lower override excludes a synced-reached node, and an override load failure returns `{ status: "error" }` from `useDailyRaids`
- [x] 1.3 Add regression tests for existing consumers: Today, Raids Plan and the Home raids widget still render schedules unchanged when no overrides exist; verify `pnpm --filter web test:run` passes for `features/daily-raids`, `pages/dailies` and `pages/home`
- [x] 1.4 Keep the Goals catalog consumers green: extend the `@/entities/player-data-override` mocks in the create-goal sheet, goals page and insights page tests with `campaignEventProgressQueries` and `buildEffectiveCampaignEventProgress`; verify `pnpm --filter web test:run` passes for `pages/goals`

## 2. Shared draft-save hook and unsaved-changes UI

- [x] 2.1 Add `useRevisionedDraft` to `shared/api` (draft, structural `isDirty`, `save()` returning `saved | conflict | error`, `discard()`) and export it; verify with unit tests for: clean until edited, editing back to the saved value is clean, successful save writes query data and clears the draft, 409 refetches and clears the draft, other errors keep the draft, and no API message is exposed
- [x] 2.2 Add `UnsavedChangesBar` to `shared/ui` (hidden when not dirty, Save/Discard, saving state, sticky desktop bottom offset vs mobile offset above `--mobile-nav-height`); verify with component tests for visibility, disabled state while saving, and the mobile offset class under `useIsMobile()`
- [x] 2.3 Add `UnsavedChangesGuard` (component, `when={isDirty}`) to `shared/ui` using `useBlocker` with `ConfirmationDialog` and a `beforeunload` listener only while dirty; verify with a memory-router test that navigation is blocked when dirty (Stay keeps the page, Leave proceeds), is not blocked when clean, and the listener is removed when clean

## 3. Campaign Events page model

- [x] 3.1 Update `pages/progress/model/campaign-events.model.ts`: core characters as `{ id, owned }`, challenges sorted by `nodeNumber`, per-event summary from resolved values, `isEventCompleted` (tracks with no battles count as completed), and `buildEventView` splitting the active event from the list ordered unfinished first in catalog order; verify with model unit tests for each rule, including the `Standard 12/30 · Extremis 0/30 · Challenges 2/5` summary example and the B, C, A ordering example

## 4. Campaign Events page UI

- [x] 4.1 Replace the inline draft/save logic in `campaign-events-page.tsx` with `useRevisionedDraft`, map `saved`/`conflict`/`error` to translated messages, remove the header Save button, and render `UnsavedChangesBar` plus the leave guard; verify with page tests for Save, Discard, 409 conflict, and a non-409 API error showing the translated message rather than the API text
- [x] 4.2 Add the current-event section (from `live-progress.activeCampaignEventId`, expanded, excluded from the list, omitted when none) and verify with page tests for active, none, and an active id missing from the catalog
- [x] 4.3 Render the list as a multi-open `Accordion` of collapsed event cards with summary line and manual/no-data indication, plus a "Hide completed events" `Switch` persisted via `usePersistedSelection`, and the all-completed message; verify with page tests that collapsing keeps edits, ordering updates as a draft completes an event, and the option survives a remount
- [x] 4.4 Rewrite the track editor in `event-card.tsx`: stepper with `count/total`, Max, `Slider` as the progress bar, removed `Input`/`Progress`, bounds disabling, honest source labels for regular and challenges, "Reset to synced" only when manual, "Challenge N" labels with node-id tooltip and `aria-pressed`, and labelled core characters with unowned ones de-emphasised; verify with component tests for each spec scenario in "One compact editor per track", "Understandable challenge labels" and "Labelled core characters"
- [x] 4.5 Add loading, load-error and no-events states; verify with page tests for pending data, an override load failure, and a catalog with no event campaigns
- [x] 4.6 Apply the responsive layout (two columns at or above 768px, stacked below, wrapping summaries, no horizontal scroll); verify with a test rendering under `useIsMobile()` true and false

## 5. Copy and tour

- [x] 5.1 Add and remove `progress.events.*` keys in `apps/web/public/locales/{en,de,es,fr}/common.json` (source labels incl. "No synced data", "Reset to synced", "Challenge {{n}}", "Core characters", "Not owned", "Current event", "Hide completed events", all-completed and no-events messages, unsaved-changes bar, leave dialog, save success/conflict/error, load error) with real de/es/fr translations, and delete keys no longer used (`useSynced`, `regularProgress`, and any other orphaned keys); verify the i18n type check and the `progress-translations` key-parity test pass
- [x] 5.2 Add `pages/progress/ui/campaign-events-page.tutorial.tsx` with desktop and mobile steps (current event, event summary, track editor, hide-completed switch, unsaved-changes explanation), register it with `useTourPageSteps`, add `data-testid` targets, and add `tour.campaignEvents.steps.*` keys in all four locales with real translations; verify with a tutorial test asserting every step target exists in both forms

## 6. Shared verification (data and rules)

Required data states: a signed-in profile with synced player data where live progress reports an active event; at least one event track with no synced entry; one track with a manual override; one fully completed event. Run on the full local stack through the workspace Aspire AppHost.

- [x] 6.2 Save from a second tab, then save in the first tab, and confirm the conflict message and reloaded values
- [x] 6.3 With the API stopped or a request blocked, confirm the page and Today each show their translated error state and no raw API text

## 7. Desktop verification (viewport at or above 768px)

- [x] 7.1 Confirm the current-event section, collapsed cards with summaries, side-by-side tracks when expanded, and the "Hide completed events" option persisting across reload
- [x] 7.2 Edit via stepper, Max, slider drag and keyboard arrows; confirm the unsaved-changes bar appears within the content area, does not cover the last card, disappears when edited back, and Discard restores values
- [x] 7.3 With unsaved edits, switch Progress tabs (confirm Stay/Leave dialog) and reload the tab (confirm browser prompt)
- [x] 7.4 Run the page tour and confirm every step highlights a visible element

## 8. Mobile verification (viewport below 768px)

- [x] 8.1 Confirm the current-event section, collapsed summaries wrapping without breaking a track's figure, stacked tracks, and no horizontal scroll
- [x] 8.2 Edit via stepper, Max and slider drag; confirm the unsaved-changes bar sits directly above the bottom navigation without overlapping it and does not cover the last card
- [x] 8.3 With unsaved edits, navigate via the bottom navigation and confirm the Stay/Leave dialog
- [x] 8.4 Run the page tour and confirm every step highlights a visible element

## 9. Gates

- [x] 9.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, and confirm all pass

## 10. Deferred / out-of-session

- [ ] 10.1 (was 6.1) Set a manual Extremis count on the active event for a track with no synced data, save, open Dailies → Today and confirm that event's Extremis nodes up to count + 1 now appear as farmable; then "Reset to synced", save, and confirm they disappear
      **NOT DONE — deferred.** Needs a live campaign event; none was running during verification, and the game API reports event progress only while an event is live. Tracked in TacticusPlanner/tacticus-planner-apps#194.
- [ ] 10.2 (was 6.4) With the 10.1 override saved, confirm the newly reachable Extremis node also appears on the Home event tab's active-event list and in a goal's farm locations on Goals (a material that drops only there is no longer reported unavailable); then "Reset to synced", save, and confirm both revert
      **NOT DONE — deferred.** Needs a live campaign event; none was running during verification, and the game API reports event progress only while an event is live. Tracked in TacticusPlanner/tacticus-planner-apps#194.
