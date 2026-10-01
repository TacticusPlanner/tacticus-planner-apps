## 1. Gate

- [x] 1.1 Pass `shopOffers` into `useEntityShardSummary` and make `unlockAvailable` true for a Character with campaign nodes or at least one non-mythic shop offer
- [x] 1.2 Unit test the gate: shop-only, campaign-only, mythic-only shop (disabled), none (disabled), owned (disabled), Mow

## 2. Shop-only Unlock behaviour

- [x] 2.1 Verify creating an Unlock goal for a shop-only unit (Kharn, Ragnar) works end to end: Shops group shown, Campaigns hidden, submit enabled, persisted `acquisitionSources` is shop-only
- [x] 2.2 Verify the Unlock requirement/energy line and resources-needed preview tolerate empty campaign locations; fix if not

## 3. Test and verify

- [x] 3.1 Add a create-goal sheet test for a shop-only Character (Unlock selectable)
- [x] 3.2 Run the web test suite and lint
- [x] 3.3 Manually verify with Kharn marked not owned in local dev; restore the record afterwards
