---
name: naming-conventions
description: Naming convention for types and mapper functions that cross a boundary (network, IndexedDB, UI) in this TypeScript/FSD codebase — the Dto/StorageModel/domain/ViewModel tiers, map<X>To<Y>() mapper naming, and the role-suffixed file naming for boundary files. Use when adding a new type that represents data at a boundary, naming a mapper/adapter function, deciding what to call a new file that defines or converts such a type, or reviewing whether existing naming is consistent.
---

# Naming conventions: Dto / StorageModel / domain / ViewModel

This codebase's data flows through up to four distinct shapes as it moves from the network to the
screen. Each tier has its own suffix (or deliberately no suffix) so the tier is obvious from the type
name alone, without reading the file it's defined in.

## The four tiers

| Tier                          | Suffix         | What lives here                                                                                                                                                                                | Example                                                                 |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| API / transport               | `Dto`          | The shape validated straight off a network response — before anything is stored or transformed.                                                                                                | `PlayerDataChunkDto<K>` (`packages/player-data/src/player-data.dto.ts`) |
| Persisted row / local storage | `StorageModel` | A row/record as it's actually stored in IndexedDB (Dexie).                                                                                                                                     | `CharacterStorageModel`, `PlayerDataMetadataStorageModel`               |
| Domain                        | _(no suffix)_  | The business/domain vocabulary a feature's own logic is written against — deliberately minimal (only the fields that logic actually needs), independent of how the data was fetched or stored. | `Character`, `Upgrade`, `Battle`                                        |
| UI projection                 | `ViewModel`    | A shape assembled specifically for one screen/component — already formatted/labeled/grouped for display, not reused as a general-purpose domain type.                                          | `BaseUpgradeViewModel`, `UnitProfileViewModel`                          |

A given feature does not always need all four — e.g. a value that's stored, read, and displayed
identically doesn't need a separate domain type just to have one. Introduce a tier only when something
actually differs across it (a field rename, a subset of fields, an aggregation, a display-only
computed field). Don't create `FooDto` → `FooStorageModel` → `Foo` → `FooViewModel` for a value that's
the same shape end-to-end.

### Why the domain tier has no suffix

The domain tier is the vocabulary the feature's own logic (calc functions, business rules) is written
against — it should read like plain business language, not like infrastructure. It's usually also the
_narrowest_ of the four shapes: a domain type declares only the fields its consumer actually needs
(see `Character` — 3 fields — vs. `CharacterStorageModel`, which has 15+). This is a deliberate
consumer-defined "role interface" (Martin Fowler's term), not an oversight — resist the urge to add a
`Domain` suffix "for symmetry" with the other three tiers.

## Mapper naming: `map<X>To<Y>()`

Name a mapper after its source and destination tiers, not after the entity alone:

```ts
// ✅
mapCharacterStorageToDomain(record: CharacterStorageModel): Character
mapDatasetRowToStorageModel(row: unknown): CharacterStorageModel

// ❌ — ambiguous once a type has 3-4 tiers
mapCharacter()
convertCharacter()
toCharacter()
```

**Exception — keep generic, key-driven dispatch as-is.** Where a schema/transform is already looked up
generically by a runtime key (`playerDataChunkPayloadSchemas[chunk.key]` in
`packages/player-data/src/player-data.schema.ts`, `datasetToStorageModels[datasetKey]` in
`packages/game-catalog/src/game-catalog.mapper.ts`), do **not** "fix" this into one hand-written
`map<Entity>StorageToDomain()`/`parse<Entity>Dto()` per entity. The generic dispatch exists specifically
to avoid that boilerplate across 10+ chunk/dataset keys — one generic function beats N hand-declared
ones when the shape of the work is identical per key. Reserve named `map<X>To<Y>()`
functions for mappers that do real per-field work (renames, aggregation, filtering), like
`mapCharacterStorageToDomain`.

## File naming

Boundary files — files whose job is to _define a tier's shape_ or _convert between two tiers_ — are
named with the matching role suffix:

- `<domain>.dto.ts` — API/transport type definitions
- `<domain>.storage.ts` — persisted-row type definitions
- `<domain>.domain.ts` — domain type definitions
- `<domain>.view-model.ts` — UI-projection type definitions
- `<domain>.mapper.ts` — mapper functions between tiers
- `<domain>.schema.ts` — zod schemas (the runtime validators the `Dto`/`StorageModel` types are
  inferred from)

**Access/repository/logic files are not role-suffixed.** A file whose job is _behavior_ rather than
_shape_ — Dexie CRUD (`game-catalog-storage.ts`, `player-data-storage.ts`), an HTTP client
(`player-data-api.ts`), a sync loop (`player-data-sync.ts`), pure calc functions
(`rank-lookup-calc.ts`), React hooks — keeps its current descriptive, domain-based name. Only rename a
file when its primary content is a set of tier-shape type definitions or mapper functions.

> **Note on `feature-sliced-design`'s rule 4-4** ("no technical-role file names" — see
> `.agents/skills/feature-sliced-design/SKILL.md`): the six suffixes above are a deliberate, scoped
> exception to that rule, made because boundary code benefits more from role-at-a-glance naming than
> domain-logic files do. FSD's own rule 4-4 targets vague catch-all names (`types.ts`, `utils.ts`,
> `helpers.ts`) that mix unrelated domains in one file — a `character.storage.ts` is still
> domain-scoped (it's about `character`, specifically its storage shape), just also role-tagged. The
> two rules aren't actually in tension once the suffix is read as "which domain, which tier" rather
> than "generic technical bucket."

## Collision avoidance

Two different bounded contexts sometimes want the same plain English word for their domain type — e.g.
a static-catalog `Character` (the game's definition of a unit) vs. a synced player-progress character
(what a specific account has unlocked/ranked). When a bare domain name would collide or be ambiguous
across contexts like this, prefix it with the bounded context instead of reusing the bare name:
`CatalogCharacter` / `PlayerCharacter`, not two different files both exporting `Character`. This
mirrors the API repo's own `PlayerCharacterRecord` naming (prefixed for exactly this reason).

## Quick-reference checklist (adding a new type)

1. Which tier is this? (Did it come off the network → `Dto`; is it a persisted row → `StorageModel`;
   is it what a feature's calc logic is written against → no suffix; is it assembled for one
   screen/component → `ViewModel`.)
2. Does a mapper already exist between these two tiers for this entity? If not, name the new one
   `map<Source>To<Destination>()` and put it in the matching `*.mapper.ts`.
3. Is this genuinely a new tier for this entity, or does an existing tier already serve the purpose?
   Don't add a tier "for completeness" — see "why a given feature does not always need all four" above.
4. Would the bare domain name collide with another bounded context's use of the same word? If so,
   prefix with the bounded context.
5. Is the file whose primary content is this type/mapper role-suffixed correctly, and is any
   behavior/access code in that file better split into its own, non-suffixed file?

## Relationship to `feature-sliced-design` / Steiger

This skill governs **type naming** (what to call a shape and the function that produces it).
`feature-sliced-design` and the `steiger` linter (`apps/web/steiger.config.ts`, run via
`pnpm lint:fsd`) govern **folder/layer placement** (which FSD layer/slice a file lives in, and whether
a slice's public API is respected). They're complementary — a correctly-tiered `CharacterStorageModel`
still needs to live in a layer-appropriate location per FSD; renaming a file's role suffix never
changes which FSD layer it belongs in.
