## Context

See the proposal/spec and companion API design. `packages/game-catalog` currently accepts the exact recommendation shape as a loose object, stores the whole Meta payload in IndexedDB, and exposes reactive full/boss queries. `entities/guild-raid-meta` resolves unit/source presentation. The expanded server payload is additive but a locally cached older payload may not yet contain the rules.

## Goals / Non-Goals

**Goals:**

- Validate and retain every explicit rule without inferred substitutions.
- Expose typed rules and localized presentation through existing package/entity boundaries.
- Preserve exact readiness when rules have not synchronized yet.

**Non-Goals:**

- Selecting replacements or classifying Playable Variants.
- Scoring investment, effectiveness, damage, or synergy.
- Embedding display text in persisted catalog records.

## Decisions

### Expand the existing Meta payload schema in place

The recommendation schema gains required `id`, `heroSlots`, and `mowReplacementIds`; the slot schema mirrors the API fields. The whole object remains one record and existing boss/full-payload queries return the added typed fields. No second IndexedDB table or joined query is introduced.

### Tolerate the pre-sync cache at the feature boundary

The database record version need not change because the object store shape/key is unchanged and synchronization atomically replaces the payload. Runtime parsing/query state distinguishes an older cached payload with no rules from a valid current payload; exact recommendation fields remain usable while a catalog sync is requested. Malformed downloaded current data still fails before replacement.

### Keep presentation in `entities/guild-raid-meta`

The existing resolver expands to map replacement unit ids and role ids. Known role ids use the `dailies`/Guild Raid locale namespace; unknown ids use the existing readable fallback. Consumers receive both structural rule values and resolved unit presentation through the entity public API.

### Preserve authored order at every layer

Zod validation checks structure but does not sort. Storage, queries, and presentation map arrays in place. The future matcher can therefore use authored order as a deterministic tie-break.

### Companion and migration sequencing

Apply the API change first so a fresh sync supplies the expanded payload. Because the served change is additive, older clients ignore fields and no catalog schema-version bump is expected. The client package/types land before playable-variant UI.

## Risks / Trade-offs

- [Risk] Making new fields required rejects a cached older object → Surface a rules-unavailable state and retain exact fields until successful replacement; cover upgrade/reload behavior in tests.
- [Risk] Unknown role ids lack polished copy → Use readable fallback and keep role localization client-owned.
- [Risk] Loose outer objects can hide future fields → Continue accepting additive fields but strictly validate the fields this feature consumes.

## Migration Plan

Deploy after the companion API. Update schema/types and tests, verify existing IndexedDB upgrade paths retain unrelated catalog records, then extend the entity resolver/i18n. Rollback returns to ignoring the additive server fields; no destructive local migration is needed.
