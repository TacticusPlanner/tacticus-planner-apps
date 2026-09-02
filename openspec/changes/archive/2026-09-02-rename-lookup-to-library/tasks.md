## 1. Establish the Library route foundation

- [x] 1.1 Move the public route-owning `pages/lookup` slice to `pages/library`, update its public exports and imports, and retain calculation-specific `rank-lookup` vocabulary that is unrelated to the public section name.
- [x] 1.2 Add the Library route table for all four plural collections and their `:entityId` children; make `/library` enter Characters, remove the `/lookup` route tree, and update route configuration tests.
- [x] 1.3 Add a typed NPC catalog query (and tests) alongside the existing character and Machine of War queries so Library pages can obtain ordered local records without accessing storage internals.
- [x] 1.4 Implement and unit-test the shared Library route-selection helper: read entity identity from the path, wait through loading, replace missing/invalid IDs with the first available ID, retain an empty collection URL when no records exist, preserve secondary query parameters, and remove legacy `character` query state.

## 2. Make collection selection and page state URL-backed

- [x] 2.1 Refactor the Character page's selection and calculation hook so character identity comes from the Library route and character changes write the ID to the path while rank, progression, and point-five remain query parameters.
- [x] 2.2 Add route-backed collection selectors for Machines of War and NPCs using their local catalog records, and add the Raid Boss collection no-records state without inventing a Raid Boss catalog or detail-data experience.
- [x] 2.3 Ensure every collection's select and clear interactions, direct entity links, refreshes, shared URLs, and browser back/forward navigation follow the route-selection contract.

## 3. Update shared navigation, titles, and public copy

- [x] 3.1 Replace the Lookup navigation descriptor with the Library descriptor and its Characters, Machines of War, NPCs, and Raid Bosses children; update route-entry memory, desktop flyout, mobile drawer/header tabs, navigation search, and landing-page links through their shared descriptors.
- [x] 3.2 Add an app-shell document-title effect derived from the active localized navigation context, including the active Library child title and the application name.
- [x] 3.3 Audit and update application-facing documentation, route examples, comments that describe the public section, and internal links found by a targeted Lookup-route search; leave domain-level calculation terminology untouched where it is not public navigation.

## 4. Localize the Library section and update onboarding

- [x] 4.1 Add the `library` i18n namespace to every supported locale with plural child labels, descriptions, collection no-records copy, and any selector copy; register and preload the namespace, migrate replaced public navigation keys out of `unitLookup`, and update i18n resource tests.
- [x] 4.2 Update the shared general navigation Joyride tutorial and its tests to target Library and use the new Library labels; verify no stale public Lookup target or copy remains on either desktop or mobile.

## 5. Add regression coverage

- [x] 5.1 Add focused route-selection tests covering a direct valid entity URL, missing/invalid IDs, loading, a populated collection redirect, the empty Raid Boss collection, legacy `character` query removal, preserved secondary parameters, and back/forward behavior.
- [x] 5.2 Update Character page tests for path-backed selection and add collection-page integration tests for Machines of War, NPCs, and Raid Bosses.
- [x] 5.3 Update navigation and landing-page tests to cover all four Library children, desktop breadcrumb/flyout, mobile drawer/header tabs, search results and descriptions, localized public labels, and document titles.

## 6. Verify the complete public flow

- [x] 6.1 Start the full Aspire stack and manually verify at one viewport below 768px and one at or above 768px using populated Character, Machine of War, and NPC catalog data: all navigation surfaces show Library; collection URLs canonicalize to the first record; direct entity URLs, selection changes, query-state preservation, refresh, sharing, and browser history work.
- [x] 6.2 In the same running app, manually verify the empty Raid Boss collection remains at `/library/raid-bosses` with its no-records state, and that former `/lookup/...` URLs and `character` query identity are not treated as supported Library routes.
- [x] 6.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; resolve all regressions before marking the change complete.
