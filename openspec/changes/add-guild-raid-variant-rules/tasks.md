## 1. Client Catalog Contract

- [ ] 1.1 Add recommendation-id, hero-slot, role, essential, character-replacement, and Machine-of-War-replacement schemas/types matching the companion API, and verify schema tests cover complete valid data plus missing, duplicate, and structurally invalid rules.
- [ ] 1.2 Preserve the expanded arrays through the whole-object IndexedDB record and reactive full/boss queries, and verify sync/query tests assert authored order and no Comp-derived replacements.
- [ ] 1.3 Cover an older cached Meta object during rollout so exact fields remain readable while rules are reported unavailable, and verify persistence-upgrade/reload tests preserve unrelated catalog records and replace the old object atomically after sync.

## 2. Rule Presentation

- [ ] 2.1 Extend `entities/guild-raid-meta` presentation to resolve replacement characters/Machines of War and known role ids through local resources, and verify resolver tests cover known and unknown unit/role fallbacks.
- [ ] 2.2 Add role labels and rule-state copy to every supported locale with real de/es/fr translations and verify locale key parity tests pass.

## 3. Companion and Repository Gates

- [ ] 3.1 Against the applied companion API, synchronize `guild-raid-meta` and verify the downloaded record passes validation with exact recommendation/slot/replacement ordering intact.
- [ ] 3.2 Run `pnpm test:run` and verify all workspace tests pass.
- [ ] 3.3 Run `pnpm typecheck` and verify it exits successfully.
- [ ] 3.4 Run `pnpm lint` and `pnpm lint:fsd` and verify both exit successfully.
- [ ] 3.5 Run `git diff --check` and verify no whitespace errors are reported.
