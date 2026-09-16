## 1. Event declarations

- [ ] 1.1 Add the `ActionId` closed union and the `ActionEvent`, `MenuItemSelectEvent`, and `PreferenceEvent` members to `AnalyticsEvent` in `shared/analytics/analytics-event.ts`, each with a doc comment naming the question it answers; verify `pnpm typecheck` succeeds.
- [ ] 1.2 Add the closed unions for the navigation item ids, the three navigation surfaces (`desktop_sidebar`, `mobile_header`, `desktop_search`), the `via` qualifier values, and the preference setting, so no call site can pass an improvised label; verify a deliberately wrong literal fails typecheck.
- [ ] 1.2a Derive the navigation item id union from the existing `nav-items.ts` declarations rather than restating the list, so a nav item added later cannot be reported under an undeclared id; verify a test asserts every top-level and child nav item has a reportable id.
- [ ] 1.3 Add the `captureEvent` branches for the three new event types in `analytics-provider.tsx`, mapping declared fields to snake_case vendor properties in the existing hand-written style; verify with provider tests asserting the exact property names sent for each.

## 2. Super properties

- [ ] 2.1 Register `theme`, `language`, `view_mode`, and `display_mode` as super properties in the identify path of `analytics-provider.tsx`, alongside the existing `identify` + `opt_in_capturing`; verify a test asserts they are registered only once identified and never before.
- [ ] 2.2 Re-register the affected super property when the user changes theme or language mid-session, so the value cannot go stale; verify with tests that change each and assert the updated value.
- [ ] 2.3 Derive `display_mode` from the installed-application display mode rather than the user agent, and verify tests cover both the browser and installed cases.
- [ ] 2.4 Verify `clearIdentity` leaves no super property attached to a subsequent anonymous or different-user session, with a test covering sign-out followed by a second sign-in.

## 3. Call sites

- [ ] 3.1 Report `onboarding.path_selected` from `features/account-onboarding/ui/onboarding-dialog.tsx` when the user submits either path, and verify a test asserts it fires once per submission and carries no entered key or credential.
- [ ] 3.2 Report `v1_import.opened` from `features/v1-import/ui/import-v1-dialog.tsx` on open, and verify a test asserts it fires on open rather than on import completion.
- [ ] 3.3 Report `sync.manual` from `app/providers/player-data-sync-button.tsx` when the user requests a sync, and verify a test asserts it fires on the request and carries no outcome.
- [ ] 3.4 Report `goal.create_opened` from `pages/goals/model/goal-creation-form/create-goal-launcher.tsx`, and verify a test asserts it fires on open and not on submit.
- [ ] 3.5 Report `project.create_opened` from `features/project-management/ui/new-project-fab.tsx`, and verify with an equivalent test.
- [ ] 3.6 Report `menu_item_select` from the navigation item renderers in `app/layout/desktop-layout.tsx` and `app/layout/mobile-header.tsx`, carrying the declared item id and the surface; verify tests assert the surface differs between the two, that a nested child reports its own id rather than its parent's, and that no event fires for a direct-link or history navigation.
- [ ] 3.7 Report `preference` from `app/providers/language-switcher.tsx` on a deliberate language change only, carrying the previous and chosen languages; verify a test asserts nothing fires for the language i18next detects automatically on load.

## 3a. Navigation search

- [ ] 3a.1 Report `nav_search.opened` with `via: "shortcut"` from the Cmd/Ctrl+K handler in `app/layout/desktop-layout.tsx` and with `via: "control"` from the on-screen control that sets `navigationOpen`; verify tests assert each path reports its own qualifier and that the shortcut's toggle-closed branch reports nothing.
- [ ] 3a.2 Report `menu_item_select` with `surface: "desktop_search"` from the item and child links in `app/layout/desktop-navigation-dialog.tsx`, carrying whether a query had been typed at the moment of selection; verify tests cover selecting after typing and selecting from the unfiltered list.
- [ ] 3a.3 Report `nav_search.no_results` at most once per opening, evaluated when the dialog closes with a non-empty trimmed query and no matching items; verify tests assert one event for a multi-character failed search, none when the query matched, none when the dialog is closed without typing, and none when the user selected an item.
- [ ] 3a.4 Verify by test that no reported navigation-search event carries the typed text, any fragment of it, or any value derived from its content including its length.

## 4. Guardrails

- [ ] 4.1 Add a test asserting no new event fires while unidentified — signed out, and authenticated but not yet resolved — covering each of the three new event types.
- [ ] 4.2 Add a test asserting the app behaves normally and attempts no outbound request when no project token is configured while the new events are triggered.
- [ ] 4.3 Verify no new call site touches the vendor client directly: all emission goes through `useAnalyticsActions`, and `shared/analytics/index.ts` remains the slice's only public surface.

## 5. Gates

- [ ] 5.1 Run `pnpm typecheck` and verify it passes.
- [ ] 5.2 Run `pnpm test:run` and verify all tests pass.
- [ ] 5.3 Run `pnpm lint` and verify it passes.
- [ ] 5.4 Run `pnpm lint:fsd` and verify the FSD boundary validator passes — call sites live in `app`, `features`, and `pages` and all consume `shared/analytics` through its public API.
- [ ] 5.5 Run `git diff --check` and verify it reports nothing.

## 6. Manual verification

- [ ] 6.1 With the full local stack running via the workspace Aspire AppHost and a signed-in session, exercise each of the five actions, one navigation selection, and one language switch; confirm in the analytics destination that each event arrives with the expected properties and that every event carries the four super properties. Required data state: an account that has completed onboarding, with at least one project so the project surface is reachable.
- [ ] 6.2 Repeat the navigation-selection check at one viewport below 768px and one at or above 768px, and confirm the reported surface differs between them.
- [ ] 6.2a At a viewport at or above 768px, open the navigation search by Cmd/Ctrl+K and by its on-screen control, select an item with and without typing, and close it on a query matching nothing; confirm each reports the expected qualifier, surface, and failed-search event, and that no typed text appears in any payload.
- [ ] 6.3 Sign out, exercise the same surfaces that remain reachable, and confirm no event is reported.

## 7. Notes

- No i18n work: this change adds no user-facing string. No tutorial work: it adds no page and changes no page flow — call sites attach to controls that already exist and render identically.

## 8. Deferred / out-of-session

- [ ] 8.1 Coordinate merge order with the companion `tacticus-planner-api` change `expand-analytics-event-taxonomy`, which merges and deploys first. No contract is shared, so this half builds and runs regardless; only the cross-side funnels need both deployed.
- [ ] 8.2 Open a follow-up change for `filter.changed` and the tour events, covering the debounce semantics and the filter-key enumeration across planner surfaces (see design.md — "filter.changed and tour events deferred"). Not started here by design; deferring without a tracking issue is how the GA4 gap survived this long.
