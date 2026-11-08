## 1. Power sort

- [x] 1.1 Add `power` to `collectionSorts` and a `power` row key (−1 when unowned or unavailable) with its comparator, tie-broken by the Rarity order.
- [x] 1.2 Pass the power figures through `CollectionExtras.power`, built from `useUnitPowerContext` only while the Power sort is selected; hold the loading state while that context loads.
- [x] 1.3 Add the `power` sort label in every locale.
- [x] 1.4 Tests: the Power order (Machine of War among characters, unknown power last) and the unowned order under the Power sort.
