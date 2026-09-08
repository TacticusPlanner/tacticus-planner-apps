## Context

See `proposal.md` – Why. Relevant current state:

- `/dailies/arena` is one of the placeholder paths in
  `apps/web/src/fsd/pages/dailies/route.tsx`
  (`["onslaught", "salvage-run", "arena", "guild-raids"].map(... DailiesPlaceholderPage)`).
  `nav-items.ts` already carries the `/dailies/arena` entry with
  `dailies:tabs.arena` / `dailies:tabs.arenaDescription`, and `section-tabs.tsx`
  renders the primary tab row from `nav-items`, so no tab-bar code changes.
- The Dailies Shops page is the closest precedent for a "recommendation"
  surface: pure builder in `model/shop-recommendations.ts`, a
  `model/use-shop-recommendations.ts` hook that gathers TanStack Query +
  `useLiveQuery` data and memoizes the pure call, desktop/mobile subviews under
  `ui/shops/`, a co-located `*.tutorial.tsx`, and an explicit
  `loading | error | no-project | ready` view-model union.
- Synced player data (`@workspace/player-data/queries`) exposes
  `getPlayerCharacters()` records with `unitId`, `rank`, `progressionIndex`,
  `xpLevel`, `abilities[]`, `appliedUpgradeSlots[]`. The catalog
  (`@workspace/game-catalog/queries` `getCharactersMap()`) supplies `rarity`
  (via progression), `name`, `traits`, `faction`.
- `@/entities/goal` `GoalSummary` already carries `entityType` + `entityId`, so
  a goal's target character is known without fetching goal detail.
  `@/entities/project` `useProjects()` exposes `activeProjectId` /
  `defaultProjectId`; `projectQueries.goals(projectId)` lists a project's goal
  membership.
- `@workspace/game-domain` already hosts ported V1 stat math (`progression.ts`
  `statAtRank`, `rank.ts` `rankIndex`). There is **no** `character` / `unit`
  entity in V2.
- V1's `src/fsd/4-entities/unit/characters-power.service.ts`
  (`CharactersPowerService`) is a self-contained power formula that reads only
  rank, rarity, star tier, applied-upgrade count, and ability levels — no
  per-character base stats.

## Goals / Non-Goals

**Goals:**

- One canonical recommendation result structure that every category, mode, and
  team-size variant is derived from.
- Combat power as a pure, reusable `@workspace/game-domain` function with V1
  parity pinned by tests.
- The engine takes contributor-id sets + roster + catalog + mode as plain
  inputs, so adding the HSE pool (#111) or a preferred-trait / alliance /
  damage-type scorer (#112) later is a new input/scorer, not a rewrite.
- Match the Dailies Shops page's slice layout, view-model union, and
  memoization approach.

**Non-Goals:**

- No new FSD entity or feature slice — the engine is page-local model code.
- No server persistence and no new API calls (see `proposal.md` – Impact).
- No numeric XP projection in XP Mode; no team editing/saving; no MoW slots;
  no preferred trait / alliance / damage-type controls or scoring (#112);
  no HSE category (#111). All out of scope this change — the engine only keeps
  a seam for the #112 scorer.

## Decisions

### D1: Combat power lives in `@workspace/game-domain`, not a new entity

New `packages/game-domain/src/combat-power.ts`, exported from the package
index, with:

```
characterCombatPower(input: {
  unlocked: boolean
  rank: Rank
  progression: Progression      // yields rarity + star tier
  appliedUpgradeCount: number
  activeAbilityLevel: number
  passiveAbilityLevel: number
}): number
```

plus `characterAttributePower` / `characterAbilityPower` for testability. All
coefficient tables (`rankCoeff`, `starsCoeff` via `progressionStarsIndex`,
`rarityCoeff`, the piecewise `abilityCoeff`) are ported verbatim from
`CharactersPowerService`.

- **Why game-domain, not an entity:** the formula is pure `(rank, progression,
levels) → number`, exactly the shape of the existing `statAtRank` port, and
  `rank` / `progression` / `Rarity` already live here. game-domain must not
  know player-data `StorageModel` shapes, so the caller maps its synced record
  into the primitive input — the same pattern `use-shop-recommendations.ts`
  already uses when it builds `RosterUnit`s.
- **Alternatives:** (a) a `character-power` entity — rejected: there is no
  character entity to hang it on, and a one-function entity that only re-wraps
  a domain call adds a layer without a second concern; (b) a feature — rejected:
  entities/other features could not import it, and the page model can consume
  game-domain directly.
- The `character-combat-power` spec capability maps 1:1 to this module.

### D2: Engine is page-local model code, mirroring Shops

New files under `apps/web/src/fsd/pages/dailies/model/`:

| File                             | Role                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `arena-recommendations.ts`       | pure `buildArenaRecommendations(input) → ArenaRecommendations`                                       |
| `arena-eligibility.ts`           | pure helpers: XP-eligible predicate, contributor-set assembly, pool expansion                        |
| `use-arena-recommendations.ts`   | gathers queries + `useLiveQuery`, maps records, memoizes the pure call, returns the view-model union |
| `arena-recommendations.types.ts` | canonical result + view-model types                                                                  |

- **Why not a feature slice:** single consumer (the Arena page); Shops set the
  precedent for a recommendation surface staying in `pages/dailies/model`.
  Combat power (D1) is the only genuinely shared piece and it goes to
  game-domain.

### D3: One canonical result structure

```
ArenaRecommendations = { categories: ArenaCategory[] }

ArenaCategory = {
  id: "active-project" | "overall-goals" | "random"
  poolUsed: "active-project" | "overall-goals" | "full-roster"
  broadened: boolean                 // poolUsed wider than the category's primary pool
  emptyReason?: "no-active-project" | "no-active-goals" | "roster-too-small"
  includedCappedCharacters: boolean  // XP Mode only
  variants: ArenaTeamVariant[]       // XP Mode: sizes [3,4,5] present; Power/Random: exactly 1
}

ArenaTeamVariant = {
  size: 3 | 4 | 5
  isPrimary: boolean                 // XP Mode: the size-3 variant; else the sole variant
  members: ArenaTeamMember[]
}

ArenaTeamMember = {
  unitId: UnitId
  rationale:
    | { kind: "goal"; goalId: string; projectId?: string }
    | { kind: "strength"; combatPower: number }
    | { kind: "minimum-size" }
    | { kind: "random" }
}
```

- Rule compliance ("one canonical structure, derive summaries"): the section
  header state (`ok` / broadened note / empty state / "capped included" note)
  and the "not enough characters" whole-page state are all derived from
  `ArenaCategory` fields, not computed on a separate path. Power Mode and
  Random are the degenerate "one variant" case of the same shape.
- Name resolution and portraits are done in the `ui/` layer from `unitId` via
  the catalog + `characters` i18n namespace (same as Character Library) — the
  canonical structure stays id-only.

### D4: Candidate pools and eligibility

- **Contributor sets** (computed in the hook, passed to the builder):
  - `activeProjectContributorIds`: from `projectQueries.goals(activeProjectId)`
    → member goals with `status === "Active"` and `entityType === "Character"` →
    `entityId`.
  - `activeGoalContributorIds`: from `goalQueries` list filtered to
    `status === "Active"`, `entityType === "Character"` → `entityId`. No
    per-goal detail fetch — `GoalSummary` already has `entityId`/`entityType`.
  - `activeProjectId` comes from `useProjects()` (`selected ?? active ??
default`), same derivation as `DailiesLayout`, but Arena owns its own copy
    (it is not under `RaidsLayout` and has no project-selector row).
- **Pool expansion** (`arena-eligibility.ts`): ordered pools
  `[active-project, overall-goals, full-roster]`; for a category start at its
  primary pool index and advance while `eligibleCount < 3`. `broadened = final
index > primary index`. Random's primary pool is `full-roster`.
- **XP-eligible:** owned/unlocked (present in roster, `rank` not `Locked`) and
  `xpLevel < levelCapForProgression(progressionStep)` — the level cap is a
  function of the character's current progression tier's rarity, **not** its
  rank or a flat 60 (see D7). XP Mode orders: contributors before
  non-contributors, then XP-eligible before capped, then (tie-break) higher
  combat power. Capped characters are only appended when fewer than 3
  XP-eligible are in the expanded pool (`includedCappedCharacters = true`).
- **Power Mode:** eligibility = owned/unlocked only; order by
  `characterCombatPower` desc; take up to 5.

### D5: Mode persistence — local, per-browser

`localStorage` key `tp.dailies.arena.mode` (values `"xp"` | `"power"`,
default `"xp"`), read/written by a small `usePersistedArenaMode()` in
`use-arena-recommendations.ts` with `try/catch` around both ends (matches
`theme-provider.tsx`, which also rolls its own rather than importing a shared
hook — there is no shared `useLocalStorage`).

- **Why not `planning-setting`:** that entity is server-persisted planning
  input; the spec requires per-browser persistence and this is a lightweight
  view preference. A server round-trip is unwarranted.
- One page-level control; every category reads the same mode.

### D6: Random team + Regenerate

- `useState` nonce in the hook; `regenerate()` increments it. A memo keyed on
  `[nonce, rosterSignature]` runs a seeded Fisher–Yates over owned character
  ids and takes `3 + (nonce-based) ...` → actually a fixed pick of
  `min(5, ownedCount)` down to 3: pick size 5 when possible, else ownedCount,
  never below 3 (page falls to the "not enough characters" state under 3).
- "Different from previous": when `ownedCount > size`, exclude the exact
  previous id-set from the next draw (retry the shuffle once). With
  `ownedCount === size` a repeat is unavoidable and allowed.
- The non-random categories are memoized **without** the nonce so Regenerate
  does not recompute them.
- Not persisted: on reload the nonce resets to 0 and a fresh shuffle runs
  (spec requires a new random team each load).

### D7: Route + nav wiring

- `dailies/route.tsx`: drop `"arena"` from the placeholder `.map` list; add
  `{ path: "arena", element: <ArenaPage /> }` with a `lazy(() =>
import("./ui/arena-page")...)` alongside the other lazy pages. Arena is a
  direct child of `DailiesLayout`'s `<Outlet/>` (sibling of `ShopsPage`), not
  under `RaidsLayout`.
- `nav-items.ts`: entry already present. Confirm `dailies:tabs.arena` and
  `dailies:tabs.arenaDescription` exist in `apps/web/public/locales/*/dailies.json`;
  add if missing (the placeholder never rendered a description).

### D7a: Level cap is per progression tier, in `@workspace/game-domain`

XP-eligibility depends on a character's level cap, which is set by its current
progression tier's **rarity**, not its rank and not a flat 60 — an un-ascended
Epic tops out at 35, a Legendary at 50, etc. game-domain already models the
exact analogue for abilities (`abilityCapByRarity` / `abilityCapForProgression`
/ `minProgressionForAbilityLevel` in `progression.ts`); add the parallel:

```
levelCapByRarity: Record<Rarity, number>
  = { Common: 8, Uncommon: 17, Rare: 26, Epic: 35, Legendary: 50, Mythic: 60 }
levelCapForProgression(p: Progression): number   // levelCapByRarity[progressionRarity(p)]
```

Ported from V1's `maxLevelForRarity` (`plan-teams2/teams2.service.ts`), which
uses **65** for Mythic; V2's existing `MAX_CHARACTER_LEVEL` const is **60**.
The lower ranks (8/17/26/35/50) are unambiguous; the Mythic ceiling is the one
open value (see Open Questions) and only affects already-max characters, so it
does not change the specs or the approach.

- `MAX_CHARACTER_LEVEL` (currently in
  `pages/goals/model/goal-creation-form/goal-validation.ts`) becomes
  `levelCapByRarity.Mythic` (the absolute ceiling). Move it to
  `@workspace/game-domain` beside `maxAbilityLevel` and re-export it from
  `goal-validation.ts` for its current callers — a page must not import another
  page's internals, and the arena model needs the same value. Scope as one
  task.

### D8: Desktop / mobile

- **Same Joyride targets on both** (Shops precedent): shared `data-testid`s,
  tutorial returns `{ desktop: shared, mobile: shared }`. Targets:
  `arena-page`, `arena-mode-toggle`, `arena-category-active-project`,
  `arena-variant-switcher`, `arena-random-regenerate`.
- **Layout that genuinely differs:**
  - Desktop (≥768px): category sections in a responsive grid
    (`md:grid-cols-2 xl:grid-cols-3`); XP-mode 3/4/5 switcher is an inline
    segmented control (`ToggleGroup`/`Tabs`).
  - Mobile (<768px): sections stacked full-width; the 3/4/5 switcher is a
    compact `Select`.
  - The mode toggle, team rosters, and rationales are identical across
    viewports (spec: same categories/recommendations).
- Team display: a row of up to 5 character portraits with name + rationale
  badge; identical markup both viewports, only the container layout changes.

### D9: Data gathering, view-model, memoization

`use-arena-recommendations.ts` returns:

```
| { status: "loading" }
| { status: "error"; retry: () => void }
| { status: "no-characters" }              // owned < 3
| { status: "ready"; mode; setMode; regenerate; categories: ArenaCategoryView[] }
```

- Data: `useProjects()`, `useQuery(projectQueries.goals(activeProjectId))`,
  `useQuery(goalQueries.list active)`, `useLiveQuery(getPlayerCharacters)`,
  `useLiveQuery(getCharactersMap)`. Catalog failures ride the global
  `GameCatalogProvider` gate; wrap the Dexie reads in the `safeLiveRead`
  sentinel pattern from `use-shop-recommendations.ts` so a store failure is a
  real retryable `error`.
- The pure `buildArenaRecommendations` call is memoized on a derived key:
  sorted contributor-id sets + a roster signature
  (`id:xpLevel:rank:progressionIndex:appliedUpgradeSlots.length:abilities` per
  unit) + `mode`. Random nonce is excluded from that memo (D6).

### V1 port parity checklist (combat power only)

The Arena **page** has no V1 predecessor — nothing to port for UI/nav/layout.
Only the power formula is ported:

- **Source:** `tacticusplanner` `src/fsd/4-entities/unit/characters-power.service.ts`.
- **Reused verbatim:** `getAbilityCoeff` piecewise curve; `getRarityCoeff`
  character table; `getRankCoeff` (as `1.25 ** rankIndex`, `rankIndex(Stone1)
= 0` — V1's `Rank.Stone1` case returns `1.25 ** 0`, so the values match);
  `getStarsCoeff` character table (as `1 + 0.1 * progressionStarsIndex`);
  `attributesWeight = 3_000_000 / 9326`; `abilityWeight = 500_000 / 41_274`;
  `upgradeBoost = (1/9)(rankCoeff(rank+1) − rankCoeff(rank))`; round each
  sub-total and the sum.
- **Dropped:** all MoW branches (`isMow`) — MoWs are out of scope.
- **Edge states:** not-unlocked → 0 (kept); top rank → `upgradeBoost` clamps to
  0 via `rankAt` (kept, matches V1 where `rank+1` runs off the enum).
- **Parity test:** table-driven fixture hitting every `abilityCoeff` branch
  boundary (22, 39, 40, 44, 50, >50), `None`/`MythicWings` star tiers,
  `Stone1`/top rank, and the `proposal`/`spec` worked example (`Gold1`,
  `Epic:RedOneStar`, 3 upgrades, 20/15 → 8792).

## Risks / Trade-offs

- **Ported power formula is an estimate and can drift from the live game** →
  It is exactly V1's basis and already what players compare against; a header
  comment marks the file as the single sync point and parity tests pin V1.
- **Level cap depends on progression, not just level 60** → XP-eligibility
  uses `levelCapForProgression` (D7a): an un-ascended Epic at level 35 is
  correctly treated as XP-capped. The only soft spot is the Mythic ceiling
  (V1's `maxLevelForRarity` says 65, V2's `MAX_CHARACTER_LEVEL` says 60) — it
  only affects characters that are already maxed either way, so worst case a
  level-60–64 Mythic is mislabelled capped/uncapped. Confirm the value against
  current game data during implementation (Open Questions).
- **"Regenerate must differ" is impossible with a tiny roster** → Guaranteed
  only when `ownedCount > teamSize`; otherwise a repeat is allowed. Documented
  in the spec scenario (six-plus characters).
- **A broadened category can equal the Overall Goals Team** → Acceptable; the
  "broadened beyond the project" note tells the user why the two look alike.
- **Active-goal list can be large** → Only the summary list is read (no
  per-goal detail), filtered to `status === "Active"`; contributor mapping is
  O(goals). Reuses existing cached queries.

## Open Questions

- The Mythic-tier level cap: V1's `maxLevelForRarity` uses 65, V2's
  `MAX_CHARACTER_LEVEL` uses 60. Pick one against current game data when
  building `levelCapByRarity` (D7a). It is a single constant in one table and
  only affects already-maxed characters — no spec, approach, or task-structure
  impact.
- Whether Power Mode shows each character's combat-power number as a secondary
  line (leaning yes). Cosmetic — no spec/approach/task impact either way.
- Rationale affordance: inline badge vs. hover/press tooltip. Decided during
  implementation against the shared component set.
