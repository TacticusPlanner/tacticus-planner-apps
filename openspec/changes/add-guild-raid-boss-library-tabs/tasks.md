## 1. Tab state and shared page shell

- [x] 1.1 Extend the Guild Raid Boss Library orchestrator with `details`, `seasons`, and `meta` tab state while preserving the path-backed Boss/Prime selection, and verify valid shared URLs restore the active tab and selected entity.
- [x] 1.2 Implement canonical URL repair for bare/unknown entity ids, invalid tabs, invalid seasons, and invalid Comp filters, and verify route tests replace each invalid value with its specified default without losing valid unrelated query state.
- [x] 1.3 Integrate the existing detail-parity and mobile-picker plans only at their declared Details boundaries, and verify no duplicated picker/detail tasks or page-to-page FSD imports are introduced.

## 2. Seasons Config view

- [x] 2.1 Build the Seasons Config tab from the existing `raid-bosses` rotation with a URL-backed selected season and ordered tiers, sets, chest rewards, guild XP, and encounters, and verify a fixture renders the catalog order and selected `season` query value.
- [x] 2.2 Add resolved encounter names/portraits and readable image fallbacks, and verify both a resolved and unresolved encounter fixture render without a broken image.
- [x] 2.3 Deliver the distinct desktop dense view and mobile stacked expandable tier/set cards, and verify component tests cover the layout selection above and below the 768px breakpoint.

## 3. Meta recommendations and Comp guidance

- [x] 3.1 Consume only the `entities/guild-raid-meta` public API to render boss-grouped Meta and alternate exact recommendations, including ordered five-hero and Machine-of-War lineups, Comp badges, update date, known-source attribution, and readable asset fallbacks, and verify a representative recommendation card test.
- [x] 3.2 Add the optional URL-backed Comp filter and no-results behavior, and verify a recommendation appears when any of its Comp ids matches while an unknown filter is removed from the URL.
- [x] 3.3 Render accessible expandable Comp guidance with signature, core heroes, flex heroes, and suitable Machines of War in authored order, and verify expand/collapse leaves the Comp filter and URL unchanged.
- [x] 3.4 Add independent Meta loading, absent, retry-able failure, and valid-no-recommendation states without blocking Details or Seasons Config, and verify each state with catalog-query fixtures.
- [x] 3.5 Deliver distinct desktop scannable recommendation/guidance layout and mobile stacked touch-friendly cards with a horizontally usable tab control, and verify breakpoint-specific component coverage.

## 4. Terminology, localization, and tours

- [x] 4.1 Replace user-facing Library “Raid Boss(es)” wording with grammatically appropriate “Guild Raid Boss(es)” wording in navigation, collection/status, tab, season, Meta, Comp, and tour copy while keeping internal identifiers unchanged, and verify all affected `library.json` keys in en/de/es/fr have complete native translations.
- [x] 4.2 Update the co-located Guild Raid Boss Library Joyride tutorial with tab-aware desktop and mobile steps for Details, Seasons Config, and Meta (including expandable Comp guidance), and verify every step targets an element present in its active tab.
- [x] 4.3 Add automated tutorial coverage for desktop and mobile active-tab tours, and verify the localized steps include the tab control, Details-specific adjusted stats, season selection/content, and Meta filtering/guidance.

## 5. End-to-end behavior and repository verification

- [ ] 5.1 Run manual verification through the local Aspire stack at one viewport below 768px and one at or above 768px using a populated `raid-bosses` catalog plus a synced Meta fixture; verify all three tabs, deep links, filters, expansion, source link, and tours work without signed-in data.
- [ ] 5.2 Run manual failure-state verification through the local stack with a valid `raid-bosses` catalog and absent/failed `guild-raid-meta`, then with absent/failed `raid-bosses`; verify Meta alone is unavailable in the first state and the page provides the correct non-broken core-data state in the second.
- [x] 5.3 Run `pnpm test:run` and verify page, route, catalog, responsive-layout, and tour tests pass.
- [x] 5.4 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`, and verify all repository quality gates pass without FSD-boundary violations.
