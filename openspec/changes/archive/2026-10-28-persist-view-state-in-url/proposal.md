# Proposal

## Why

View state the user chooses on a page (Goals status and type filters, the open Edit goal dialog, the Legendary Event lane tab) lives in component `useState`, so a reload or Back loses it and nothing is shareable, while the same app already treats the Goals project scope, the master table and the Raid Bosses tab as URL state. Alongside, several forms keep a `status`/`errorMessage` pair next to a `useMutation` that already owns both, the Onslaught page hand-rolls draft and 409 handling that `useRevisionedDraft` already implements for campaign events, and the Raid Bosses page repairs its URL from two competing effects. Making URL the owner of view state and the mutation the owner of request state removes that duplicated state before `rehome-feature-logic` moves these files.

Evidence (audit 2026-10-20): `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx:68-70` (`tab`, `editGoalId`, `goalType` in `useState`); `pages/legendary-events/ui/legendary-event/legendary-event-page.tsx:72` (`selectedTab`); `pages/goals/model/projects/use-goals-project-scope.ts` (the existing URL-state helper); `pages/library/ui/raid-bosses/raid-bosses-page.tsx:1,106-160,217-260` (`eslint-disable max-lines`, two URL-repair effects that both rewrite `season`); nine `useMutation` sites that also keep `status`/`errorMessage` state (`features/account/ui/manage-account-dialog.tsx:132-136,292-294`, `features/account/ui/api-key-form.tsx:33-35`, `features/guild-access/ui/guild-registration-form.tsx:38-39`, `guild-synchronization-card.tsx:32-33`, `guild-tacticus-user-id-card.tsx:29-30`, `features/v1-import/ui/v1-import-panel.tsx:77-82`, `pages/goals/model/goal-creation-form/use-goal-submit.ts:58-60`, `pages/guild/ui/guild-purge-dialog.tsx:46-48`, `guild-registered-view.tsx:36-39`); `pages/onslaught/ui/onslaught-page.tsx:46-100` versus `shared/api/use-revisioned-draft.ts` and `pages/my-game/ui/campaign-events-page.tsx:59,210-222`; setup flow state spread over `app/account-setup-route.tsx:60-65`, `features/account/ui/account-setup-screen.tsx:67,162`, `app/setup-v1-import.tsx:59`.

## What Changes

- Goals page: the status filter and the Type filter become `status` and `type` query parameters of `/plan/goals`, written by replacing the history entry like the existing `project` parameter; a fresh load without parameters keeps today's defaults (Unfulfilled, all types). The open Edit goal dialog becomes the `goal` query parameter, pushed as a history entry so Back closes the dialog.
- Legendary Event page: the selected tab (Overview, Alpha, Beta, Gamma) becomes the `tab` query parameter of `/legendary-events/:eventId`, replacing the history entry; it still defaults to Overview and still resets when another event is opened, because the parameter is not carried across events.
- One shared search-parameter hook (value parsed and validated, invalid values dropped from the URL, replace or push) backs the above; `useGoalsProjectScope` keeps its async project-list validation and otherwise follows the same shape.
- Raid Bosses page: the two URL-repair effects collapse into one pure "repair search params" function applied by one effect; the `eslint-disable max-lines` directive is removed. No behavior change (`raid-boss-library` already specifies the repairs).
- Forms: the nine sites listed above read `isPending` and `error` from their mutation and derive the translated message at render time; the parallel `status`/`errorMessage` state is deleted. No behavior change.
- Onslaught page: draft, dirty tracking, save and 409 reload move onto `useRevisionedDraft`; the page gains the same unsaved-changes bar (Save and Discard) and leave guard that campaign events have, and loses its always-on Save button. This is a behavior change and is specified.
- Account setup flow: the four pieces of flow state (`importAwaitingContinue`, `v1Suggestion`, `submitted`, `keyImported`) move into one reducer owned by the setup route; no addressable behavior changes (`account-setup` already specifies step addresses).
- The Legendary Event plan write queue (`entities/legendary-event/model/use-plan-write-queue.ts`) stays as is; it is the third conflict idiom and converges later.
- Deliberately excluded: the Dailies and Insights project selectors. `goals-navigation` ("Project-aware browsing defaults to all goals") requires that selection to reset on a full reload and never follow the Goals scope, so putting it in the URL would reverse a stated requirement; that decision is left to its own change if wanted.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `goals-navigation`: the Goals status and Type filters are URL state with the existing defaults; the existing "Switching project scope preserves list controls" requirement is kept whole and the new persistence rule is added beside it.
- `goal-edit-dialog`: the open Edit goal dialog is addressable by the `goal` query parameter; Back closes it; an unknown id drops the parameter without opening a dialog.
- `legendary-events-hub`: the event page's selected tab is the `tab` query parameter rather than in-page state; it survives reload and Back, and still resets per event.
- `onslaught-progress-entry`: the page gains an unsaved-changes bar with Save and Discard, translated conflict and error handling over the draft's revision, and a leave confirmation while edits are unsaved.

## Impact

- `apps/web/src/fsd/shared/lib` (new search-param hook), `pages/goals/ui/goals-board/goals-page.tsx` and its toolbar, `pages/goals/model/projects/use-goals-project-scope.ts`, `pages/goals/ui/goal-edit/goal-edit-dialog.tsx`, `pages/legendary-events/ui/legendary-event/legendary-event-page.tsx`, `pages/library/ui/raid-bosses/raid-bosses-page.tsx`, `pages/onslaught/ui/onslaught-page.tsx`, the nine form sites, `app/account-setup-route.tsx`, `features/account/ui/account-setup-screen.tsx`, `app/setup-v1-import.tsx`, their tests and tutorials, and `apps/web/public/locales/*/common.json` (Onslaught bar copy).
- No API change; no companion `tacticus-planner-api` change. No dependency changes (React Router search params and existing shared hooks only).
- The "forms read request state from the mutation" item moved to `tune-client-query-caching` (same nine files, same lines); this change lands after it. It edits files that `rehome-feature-logic` will move, so it lands before that change; `memoize-render-hot-paths` touches the same Goals and Legendary Event pages at different lines.
