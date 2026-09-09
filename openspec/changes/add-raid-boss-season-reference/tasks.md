## 1. Season and encounter domain model

- [ ] 1.1 Add an entity-owned, pure season-board projection from the served raid-boss payload that validates the usable rotation, orders tiers and sets descending, and preserves authored encounter order. Export its public types and resolver through the raid-boss entity API. Verify focused unit tests cover default-season selection, missing season data, tier/set ordering, and Crystal/boss encounter order.
- [ ] 1.2 Add a complete encounter-location type and resolver that validates `season`, `tier`, `set`, `encounter`, and the selected entity identity together. Extend the modifier-context, field-enemy, and adjusted-stats resolvers to accept a resolved exact location while retaining catalog-wide representative selection without one. Verify focused unit tests prove exact-context data wins, a tampered/incomplete location falls back atomically, and existing direct-detail behavior remains covered.
- [ ] 1.3 Add a progression-index helper or page-facing result that converts an exact encounter's 1-based index to a clamped detail step. Verify unit coverage for first, in-range, and over-ladder indices.

## 2. Route state and catalog view model

- [ ] 2.1 Replace raid-boss use of the generic entity-route selection hook with page-local route state: the bare route owns a validated `season` selection, an entity path owns detail selection, and invalid entity paths return to the reference. Preserve unrelated query parameters and canonicalize invalid season/context parameters as specified. Verify route-level tests cover bare default, non-default shared season link, invalid season, unknown entity, contextual card link, and direct entity link.
- [ ] 2.2 Extend the raid-boss catalog/page view model to combine entity-owned season-board locations with existing resolved names and portrait fallbacks, without putting season-tree traversal in a page component. Verify a focused test proves playable-prime names and portrait fallbacks are retained on board cards.
- [ ] 2.3 Thread validated exact encounter context through detail initialization and all detail-derived data. Contextual cards start at their encounter progression step; direct detail links retain the highest-known-step default; selecting an unrelated entity through detail navigation clears the exact context. Verify page tests for all three flows.

## 3. Season-reference and detail UI

- [ ] 3.1 Create the desktop season-reference UI: a season selector, semantic descending tier sections, descending set groups, and horizontally grouped encounter cards using `RaidBossPortrait` and localized rarity/set labels. Cards navigate with complete context. Verify component tests assert all ordering, accessible card names, context-bearing navigation, and initials fallback.
- [ ] 3.2 Create the mobile season-reference UI so every selected season's tier, set, and encounter is reachable in the vertical document flow with touch-sized cards and no horizontal-only content. Verify component/page coverage at a mobile viewport and keyboard/tap selection behavior.
- [ ] 3.3 Update the shared page orchestrator and desktop/mobile detail forms so the bare route renders the season board while valid entity routes retain an all-entity navigation affordance plus the existing detailed content. Reconcile with `add-raid-boss-mobile-picker` if it has landed: use its mobile picker rather than duplicating a mobile entity chooser. Verify desktop and mobile route-render tests cover both landing and detail forms.

## 4. Localization and onboarding

- [ ] 4.1 Add all season-reference, tier, set, no-season, context-navigation, and tour copy to the existing `library` namespace with complete human translations in `en`, `de`, `es`, and `fr`. Remove superseded copy only when no current page or active change uses it. Verify `pnpm --filter web test:run library-translations` and `pnpm --filter web typecheck` pass.
- [ ] 4.2 Update `raid-bosses.tutorial.tsx` and its tests with route-aware desktop and mobile steps: season selector and board on the landing view; entity navigation, progression, modifiers, and adjusted stats on a detail. Include the new localized tour keys in the task's verification and verify every step targets an element mounted for that route and viewport.

## 5. Integration verification

- [ ] 5.1 Reconcile the implementation with the active `refine-raid-boss-detail-parity` and `add-raid-boss-mobile-picker` changes, preserving their ownership boundaries and updating shared raid-boss-library tests only for still-valid expectations. Verify the combined diff has one coherent route, detail context, and mobile navigation path.
- [ ] 5.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` from `tacticus-planner-apps`; resolve failures attributable to this change.
- [ ] 5.3 Start or reuse the full Aspire stack and manually verify with synced raid-boss catalog data at one viewport below 768px and one at or above 768px: default and changed season selection, descending tier/set board, a boss and a Crystal-prime card opening exact contextual details, direct entity-link fallback, and the route-appropriate tour. Record the verified season, tier, set, and encounter state in the implementation handoff.
