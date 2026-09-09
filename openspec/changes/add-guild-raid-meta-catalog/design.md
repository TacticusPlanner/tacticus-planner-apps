## Context

See `proposal.md` and `specs/guild-raid-meta-catalog/spec.md`. The API
companion adds an anonymous `guild-raid-meta` catalog payload. The existing
catalog client already treats `raid-bosses` as a single object stored in one
Dexie row and the Library resolves raid-boss presentation from ids. V1's
seven Comp profiles provide the curated guidance model, but the new Library
must remain public and must not import V1 guild-member state.

## Goals / Non-Goals

**Goals:**

- Synchronize and expose the new API contract with the same reliability and
  absence semantics as other catalog data.
- Provide reusable, id-based Meta/Comp presentation helpers to the Library.
- Retain V1's seven Comp concepts while redesigning their presentation in V2.

**Non-Goals:**

- No Meta page UI in this change; the companion Library-tabs change owns it.
- No external fetch, scraping, user roster analysis, guild membership data, or
  personal team storage.
- No new game-data i18n namespace: Meta page copy stays in the existing
  `library` namespace, while character/MoW/boss labels resolve through their
  existing id-keyed resources.

## Decisions

### 1. Store the payload as one versioned catalog record

Add the dataset key, Zod schema, storage model, manifest synchronization, and
mapper entry. Like `raid-bosses`, the payload is an object that consumers read
whole, so it is stored under a fixed `guild-raid-meta` record id and read by a
promise-returning query. The database version cascade creates the additional
store while preserving all existing stores.

Alternative rejected: flattening recommendations and Comps into separate
stores. It adds joins and invalid intermediate states even though every page
needs the complete curated snapshot.

### 2. Keep raw data in the package and presentation logic in a real entity slice

`@workspace/game-catalog` owns transport schemas, storage models, and raw
queries. A new `entities/guild-raid-meta` slice owns app-specific lookup and
presentation helpers: matching a boss group, resolving a source id, and
combining existing character/MoW/boss label and portrait resolvers into a
render-ready value. Its public API is the only surface consumed by the later
Library tab, so the page never reaches into package internals.

Alternative rejected: place this logic directly in the page. Comp/source
resolution is reusable domain behavior and should not be duplicated as the
Meta tab grows.

### 3. Preserve V1 Comp behavior, not its roster-management UI

Port the seven V1 Comp ids and their authored core/flex/MoW member sets through
the API dataset. V2 keeps the meanings—AdMech, Battlesuits, Custodes,
Laviscus, Multi-Hit, Neuro, and Z'Kar—and resolves their signature unit from
ids. It drops V1's per-member manual toggles, API-key fields, roster sorting,
and private guild filters because this data is public editorial guidance.

### 4. Attribute sources by opaque id

The API exposes only `sourceId` and `updatedOn`; an entity-level source map
maps the known initial id to the supplied Terminus Maximus URL. Link label and
fallback copy live in `library` translations. This preserves the API's id-only
contract and permits future source presentation changes without a data-schema
change.

## Risks / Trade-offs

- [API and client schema drift] -> mirror every required field in a Zod schema
  and cover a representative valid payload plus malformed cases in tests.
- [A character or MoW icon is missing] -> reuse existing id resolution and
  entity-icon fallback rather than add a source-specific asset dependency.
- [V1 Comp advice becomes stale] -> retain the API `updatedOn` revision and
  surface it to the later page; update the curated source independently of
  game encounter data.

## Migration Plan

1. Apply the API companion first and verify its manifest/OpenAPI contract.
2. Release the client storage upgrade; existing users keep all current catalog
   data and sync `guild-raid-meta` on the next manifest refresh.
3. Apply the Library-tabs change after this client query surface is available.
4. Roll back the client safely: older clients ignore the added manifest entry;
   no user data needs removal.

## V1 Comp parity checklist

- **Reuse:** the seven V1 Comp ids, their signature character/MoW ids, and
  ordered core/flex/MoW membership sets from
  `input-guild-roster-snapshots/guild-roster-snapshots.models.ts`.
- **Redesign:** V1's dense icon-toggle table becomes V2 render-ready guidance;
  it is not copied as a guild-member form.
- **Drop:** per-member overrides, roster coverage sorting, API-key handling,
  and private guild filtering; they require authenticated user data and are
  outside this public catalog capability.
- **Fallback:** a missing icon or label renders the existing readable unit
  fallback rather than omitting the Comp or showing a broken asset.
