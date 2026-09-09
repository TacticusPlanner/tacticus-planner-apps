## 1. Game-catalog synchronization

- [x] 1.1 Add the `guild-raid-meta` manifest key, Zod contract, mapper, and typed exports to `@workspace/game-catalog`, and verify representative valid Meta/alternate/Comp payload tests preserve all authored ordering and ids.
- [x] 1.2 Add the versioned Dexie store and fixed-record query surface for the complete Meta object plus boss-id lookup, and verify a database-upgrade test preserves existing catalog records while an absent Meta record remains distinguishable from a boss with no group.
- [x] 1.3 Make malformed Guild Raid Meta downloads fail atomically during synchronization, and verify schema and sync tests leave no partial local record after invalid payloads.

## 2. Entity-level presentation resolution

- [x] 2.1 Create the `entities/guild-raid-meta` public API that resolves a boss group, ordered five-hero/Machine-of-War lineup, Comp signature, and readable fallbacks from existing id-based catalog resources, and verify entity tests cover known and missing presentation assets.
- [x] 2.2 Add the known source-id mapping for the supplied Terminus Maximus Guild Raid Boss Meta Guide URL plus safe generic handling for unknown sources, and verify the resolver never invents an outbound link.
- [x] 2.3 Port the seven V1 Comp ids and their ordered signature/core/flex/Machine-of-War memberships into the API-backed dataset contract without importing V1 roster or guild-member state, and verify a parity fixture covers AdMech, Battlesuits, Custodes, Laviscus, Multi-Hit, Neuro, and Z'Kar.

## 3. Contract coordination and regression coverage

- [x] 3.1 Verify the `@workspace/game-catalog` schema against the API companion's generated `guild-raid-meta` payload/OpenAPI contract, and record any mutually required contract adjustment in both paired change branches before applying this client change.
- [x] 3.2 Add focused catalog and entity regression tests for independently changed Meta manifest hashes, no recommendation for a known boss, and malformed cross-reference-safe presentation, and verify the tests pass.

## 4. Repository verification

- [x] 4.1 Run `pnpm test:run` and verify catalog, entity, and existing web tests pass.
- [x] 4.2 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`, and verify all repository quality gates pass without FSD-boundary violations.
