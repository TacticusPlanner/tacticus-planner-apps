## Context

See `proposal.md` for motivation. Relevant current state:

- The client `game-catalog` package (`tacticus-planner-apps/packages/game-catalog`) already has a mature, consistent pattern for every existing dataset: `dataset-keys.ts` (dataset key union) → `schemas/*.ts` (zod validation) → `record-types.ts` (inferred TS types) → `game-catalog-storage.ts` (one Dexie `EntityTable` per key) → `game-catalog.mapper.ts` → `game-catalog-api.ts` (manifest/ETag-aware HTTP client) → `game-catalog-sync.ts` (diff + per-dataset replace) → `queries.ts` (named selectors consumed via `dexie-react-hooks`' `useLiveQuery`). Every existing dataset is a 1:1 mirror of a backend-served dataset into its Dexie table.
- The backend (`tacticus-planner-api`, `TacticusPlanner.GameCatalog`) authors raw JSON under `Data/**`, builds the 14 currently-served datasets from it via `Denormalization/*.cs`, cross-reference-validates via `Validation/*.cs`, and hashes each dataset for the manifest (`GameCatalogHashing.cs`). This is a separate repo/submodule from where this change's specs live (`tacticus-planner-apps`); backend implementation tasks are planned here but executed there.
- V1 (`tacticusplanner`) has no reusable scheduling model. `homescreen_events/data/*.json` (27 files) hand-duplicates near-identical HSE definitions per parameter (e.g. a Faction Boost variant gets its own file per target faction) — the anti-pattern this change's definition/occurrence split removes. `LegendaryEventService.getActiveEvent()` approximates "active" via a fuzzy 7-day lookback from a single date because no end date is stored — this change's explicit `endUtc` removes the need for that kind of approximation.
- V2's home page (`apps/web/src/fsd/pages/home/ui/home-page.tsx`) is currently an authenticated placeholder ("Placeholder landing spot... while the real home page is designed") with no calendar UI anywhere in the app today.
- Naming/display conventions already established in this repo (see the `naming-conventions` and `reimplement-v1-page` skills) resolve display text and icons from stable ids via i18n namespaces and id-based icon mapping, rather than storing display strings in catalog data — this change follows that convention for events.

## Goals / Non-Goals

**Goals:**

- A definition/occurrence data model where an event's mechanic (scoring, conditions, recurrence) is authored once and reused across every scheduled instance.
- Genuine forward projection for events with a known, game-stated cadence, bounded to a fixed rolling window, without guessing at events that have no stated cadence.
- An explicit, unambiguous way to distinguish two easily-conflated event types (e.g. Faction Boost vs. Faction Focus) via required-parameter validation rather than a naming convention.
- A home page that reads the calendar directly from synced client data, with no manual authoring step in the client at all.

**Non-Goals:**

- Deciding the exact visual layout of the calendar grid (single list vs. multi-lane/swimlane rendering for concurrent events) — left as an implementation-level UI decision in tasks.md, not a spec-level requirement, since either satisfies the behavioral requirements in `specs/home-events-calendar`.
- Versioning event _definitions_ (rules) by game version — only a dated `game-version-release` marker is added to the calendar; historical reinterpretation of past occurrences under the ruleset that existed at the time is out of scope.
- Any admin/editor UI for authoring `eventOccurrences` — authoring remains a hand-edited JSON file in the backend repo, same as every other catalog dataset today.
- Arena team recommendations or any other future consumer of active-event data — confirmed to not exist yet (nav stub only); this change only needs to make the data available, not build a consumer.
- Changes to V1 (`tacticusplanner`) — its static calendar image is untouched.

## Decisions

**1. Two authored datasets (`eventDefinitions`, `eventOccurrences`) plus one server-denormalized served dataset (`eventsCalendar`), not a single combined dataset.**
This mirrors the backend's existing denormalization pattern (raw collections → served, self-contained datasets) rather than introducing a new architecture. `eventDefinitions`/`eventOccurrences` are authored by hand, same as every other catalog source file; `eventsCalendar` is computed at build time — date-indexed, with every entry carrying everything needed to identify and schedule it (`definitionId`, `confirmed`, `startUtc`/`endUtc`, `parameters`) without joining `eventOccurrences` (the raw, unmerged dataset — see Decision-equivalent note in the backend change). It does **not** carry definition-level metadata like `type`, so the client's `useEventsCalendar` hook does still join each entry against `eventDefinitions` (a small, id-keyed lookup) for anything beyond the entry's own fields — e.g. resolving `type` to pick an icon. This mirrors how every other selector in this package works (`getCampaignBattles`/`getCampaignDefinitions` are separately fetched and joined by consuming code too, not pre-joined at the query layer).

- _Alternative considered_: client-side date-expansion (compute date buckets from `eventOccurrences` at query time in `queries.ts`). Rejected — every other dataset in this pipeline is a mirror, not a computed join; doing the expansion server-side keeps the client package consistent with its existing pattern and keeps the projection logic (see Decision 3) in one place, tested once, at build time.

**2. Definitions are generic per mechanic, never per specific character/faction/content.**
An early draft modeled `le-lucius`/`hre-cezare` as their own definitions; this was corrected to generic `legendary-event`/`new-character-event` definitions with the character carried as an occurrence parameter (`featuredCharacterId`), because the underlying mechanic (milestones, chest math, track structure) doesn't change per character — only content does. This is the same principle already applied to the HSE definitions (`hse-faction-boost`, `hse-faction-focus`, etc. are each one definition covering every faction they've ever targeted).

**3. Recurrence has exactly two kinds — `Fixed` and `None` — no intermediate "approximate/soft" tier.**
`Fixed` (`{ intervalDays, durationDays }`) applies only where the game states or reliably exhibits a genuine fixed cadence: `campaign-event` (35/14, wiki-stated "recur every 5 weeks"), `incursion` (35/5, same), `legendary-event` (35/7 — the _slot_ cadence is fixed even though a single character's own iterations look irregular in isolation, because other characters occupy the intervening slots), and the two weekly standing modifiers (7/1). `None` applies to everything else: every individual Tournament Arena ruleset (`ta-faction-war`, `ta-power-ups`, `ta-conquest`, `ta-draft-power-ups`, `ta-infested-power-ups` — kept as separate definitions per ruleset, not a shared "TA slot" category, because rulesets differ mechanically, e.g. different win conditions), every `hse-*` definition (evidenced by Warp Surge's archived dates showing 6-26 week irregular gaps), `new-character-event` (one-shot per character), `game-version-release`, and one-off specials.

- _Alternative considered_: an `Approximate` kind carrying an average interval, to give HSEs/LE-adjacent events a soft projected guess. Rejected — an event with a 6-26 week variance would produce a confidently-dated placeholder that's usually wrong, which is worse for a calendar UI than showing nothing until it's actually announced.
- _Alternative considered_: anchoring `Fixed` recurrence to Battle Pass season boundaries instead of a raw day interval, reasoning it'd be more robust to schedule drift. Rejected as unnecessary — 35 days is a stated game constant, computable from any fixed epoch with the same result, and Battle Pass season data isn't known further in advance than anything else, so season-anchoring wouldn't actually extend how far projection can safely reach.

**4. `game-version-release` is its own independent, `None`-recurrence definition — not a derived parameter of `legendary-event`.**
Patch releases usually land in an LE week but not always; modeling it as a field on `legendary-event` would break the first time a release ships off-cycle. It's authored as its own occurrence (`parameters: { version }`) whenever actually known, with no attempt to derive or predict its date from LE scheduling.

**5. Projection horizon is a single flat window: now → now + 15 weeks, recomputed on every catalog build.**
Applies uniformly to every `Fixed`-kind definition — no per-definition-type special-casing (an earlier draft anchored the horizon to the nearest _confirmed_ `legendary-event` occurrence specifically, which was superseded by this simpler, uniform rule). `None`-kind definitions are never projected, at any distance.

**6. `requiredParameters` on a definition is enforced by build-time cross-reference validation, extending the existing `Validation/*.cs` pattern.**
This is what makes the Faction Boost/Faction Focus distinction concrete rather than a naming convention: `hse-faction-boost` declares `requiredParameters: ["targetFactionId"]`; an occurrence referencing it without that parameter fails the catalog build, the same way missing cross-references already fail today for other datasets.

## Risks / Trade-offs

- [Risk] Cross-repo coordination: the backend dataset/denormalizer work happens in `tacticus-planner-api`, a separate submodule from where this proposal's specs live. This change's `openspec` planning is scoped to `tacticus-planner-apps` only (its `allowedEditRoots`), so backend implementation needs its own coordinated PR in the other repo, tracked here only as a task-list item, not as spec-enforced. → Mitigation: tasks.md sequences backend work first and calls out the repo boundary explicitly at each backend task.
- [Risk] A `Fixed`-kind definition's stated cadence could itself change (e.g. Snowprint shortens Battle Pass seasons). → Mitigation: `intervalDays`/`durationDays` live on the definition, so a cadence change is a one-line authored edit, not a schema change; already-authored occurrences are unaffected since they don't derive their dates from the definition.
- [Trade-off] `eventOccurrences` requires ongoing manual authoring as events get announced (same maintenance burden V1 had per-JSON-file, now scoped to one line per occurrence instead of a whole file). → Accepted; an authoring UI is explicitly out of scope (see Non-Goals).
- [Risk] Projected placeholders for `campaign-event`/`incursion` are treated as "final" data with no confirmation step — if a slot is ever skipped or delayed by Snowprint, the calendar would show a placeholder that never becomes real. → Mitigation: acceptable for initial scope per the issue; revisit if this proves common in practice.

## Migration Plan

Additive on both sides — no existing data changes shape. Backend: new dataset files, denormalizer, and validation ship in `tacticus-planner-api` as a normal catalog release (same hashing/manifest mechanism as every other dataset addition). Client: new dataset keys added to the existing sync pipeline; first sync after deploy populates the two new Dexie tables, same as any other new dataset. Home page: placeholder content is replaced directly (small pre-production user base, no feature flag needed per this workspace's `destructive-changes-policy` for V2). Rollback is a plain revert on both repos; no data backfill or cleanup required either direction.
