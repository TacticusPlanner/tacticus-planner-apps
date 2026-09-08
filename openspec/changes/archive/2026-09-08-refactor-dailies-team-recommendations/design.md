## Context

See `proposal.md` — Why. The Arena engine today lives in
`apps/web/src/fsd/pages/dailies/model/arena-recommendations{,.types}.ts` with
supporting helpers in `arena-eligibility.ts`, a hook in
`use-arena-recommendations.ts`, and UI under `pages/dailies/ui/arena/`. It has
~940 tests. Salvage Run and Onslaught are placeholder routes in the same
`pages/dailies` slice (`route.tsx`).

Key existing shapes:

- `expandCandidatePool({ primaryPool, rosterIds, ownedProjectContributorIds,
ownedGoalContributorIds, isEligible })` walks the fixed
  `ARENA_POOL_ORDER = ["active-project","overall-goals","full-roster"]`,
  widening while `candidateIds.filter(isEligible).length < ARENA_MIN_TEAM_SIZE`.
- `contributorRankOf(id, ctx): 0 | 1 | 2` — selected-project vs any-goal vs
  neither.
- `buildRandomCategory` already branches XP pool / Power weighted draw and takes
  a `fill(seed)` closure through `randomTeamForSeed`.
- `characterView.traits` is populated; `characterView.meleeDamage` /
  `.rangedDamage` are populated; `.activeAbilityDamage` / `.passiveAbilityDamage`
  default to `[]`. `use-character-lookup-calc.ts:338-350` already unions the
  four into one `damageTypes` set.
- Catalog reads go through `getCharactersMap()` from
  `@workspace/game-catalog/queries`, consumed with `useLiveQuery` (see
  `use-shop-recommendations.ts`).

## Goals / Non-Goals

**Goals:**

- One engine module, config-driven, that Arena, Salvage Run and Onslaught can
  all call. Arena's externally observable behaviour unchanged except for the two
  #112 controls.
- Trait / damage-type preferences as composable eligibility predicates, so they
  reuse the widening machinery and the "broadened" note verbatim.
- The existing Arena test suite passes with import-path edits only (minus the
  files that assert the two new controls) — the extraction's regression guard.

**Non-Goals:**

- Salvage Run and Onslaught themselves (separate changes).
- #112's alliance dimension and team-level faction composition (dropped /
  deferred — see proposal).
- Any scoring bias / weighting for preferences — they are pass/fail filters.
- Moving the engine out of `pages/dailies` into `features/` (only warranted once
  a non-Dailies page needs it).

## Decisions

### 1. Pool config as `TeamPoolSpec[]`, not an enum order

`expandCandidatePool` takes `pools: readonly TeamPoolSpec[]` (highest priority
first); the engine appends the full mode-eligible roster as the implicit last
pool. `TeamPoolSpec = { id: string; unitIds: ReadonlySet<UnitId>; rationaleFor:
(id: UnitId) => TeamMemberRationale }`. `contributorRankOf` becomes
`poolRankOf(id) = pools.length - firstIndexOfPoolContaining(id)` (0 = only in
the implicit roster pool). Arena builds two specs (`active-project`,
`overall-goals`) from its contribution maps; the rationale closure returns the
existing `{ kind: "goal", goalId, projectId? }` / falls through to
`strength` / `minimum-size`. Alternative rejected: keep the enum and let each
page register order — more indirection, and the enum values leak game-mode
concepts into the shared module.

### 2. Preferences are predicates on `TeamRosterCharacter`

`TeamRosterCharacter` gains `traits: readonly string[]` and `damageTypes:
readonly string[]`, filled by the hook from the catalog map. The engine builds

```ts
const matchesPrefs = (id) =>
  (!prefs.trait || traitsById.get(id)?.includes(prefs.trait)) &&
  (!prefs.damageType || damageTypesById.get(id)?.includes(prefs.damageType))
const isEligible = (id) => modeEligible(id) && matchesPrefs(id)
```

`isEligible` feeds `expandCandidatePool` unchanged. `orderCandidates` replaces
its XP-capped/eligible tier with `isEligible` (so in Power mode, where
`modeEligible` is constant `true`, ordering is unchanged when no preference is
set). The "never fail" clause: after widening, if `< 3` candidates satisfy
`isEligible`, the Plan builder falls back to ordering the widened pool by
`modeEligible` only for the deficit slots — i.e. it takes the preference-matching
ones first, then tops up ignoring preferences. `buildRandomCategory` narrows
`freeCandidates` with `matchesPrefs`, falling back to the un-narrowed pool when
`matches.length < size` — mirrors the existing XP-capped fallback.

With `prefs = {}` every added term short-circuits to `true`, so the engine is
byte-for-byte the current behaviour. Alternative rejected: a `preferenceScore`
that scales combat power (the original plan-doc sketch) — the user chose
filter-with-widening; it is also simpler to reason about and needs no Power-mode
special-casing.

### 3. Shared damage-type helper in `shared/lib`

Extract `use-character-lookup-calc.ts:338-350` into
`shared/lib/character-damage-types.ts`:
`characterDamageTypes(view: { meleeDamage: string; rangedDamage: string | null;
activeAbilityDamage?: string[]; passiveAbilityDamage?: string[] }): string[]`,
keeping the `?? []` guards. `pages/library` and `pages/dailies` both import from
`@/shared/lib`. `pages`→`pages` is a steiger violation; `shared` is allowed.

### 4. Namespace split: new `teamRecs`, keep `arena`

Shared strings (`mode.*`, `teamSize.*`, `lock.*`, `rationale.*`,
`category.{broadenedNote,cappedNote,fewerThanRequested}`, `state.*`,
`project.label`, `regenerate`) move to `teamRecs.json`; `arena.json` keeps
`title`, `subtitle`, `category.{plan,random}.*`, `tour.arena.*`, and gains
nothing — the new `preferences.*` keys go in `teamRecs.json` so Salvage
Run / Onslaught inherit them. `teamRecs` registered in `i18next.d.ts`. de/es/fr
= `cp` of en (#113). Name is `teamRecs` not `teams` — `teams` is reserved for
the future Teams feature (#26). Components take an explicit namespace via
`useTranslation("teamRecs")` / `useTranslation("arena")`; the page passes both.

### 5. UI move keeps the composition seam at the page

`arena-team.tsx` → `team-recs/team-list.tsx`; `arena-mode-toggle.tsx` →
`mode-toggle.tsx`; `arena-team-size.tsx` → `team-size.tsx`;
`arena-category-section.tsx` → `category-section.tsx`; `arena-state.tsx` →
`team-recs-state.tsx`. New `team-recs/preference-controls.tsx` — two
`Select`s + "Any", options from a passed `{ traits: string[]; damageTypes:
string[] }`, `traitIcon()` / `damageTypeIcon()`, `data-testid`
`arena-preferred-trait` / `arena-preferred-damage-type` (kept `arena-` prefixed
for now; Salvage Run will pass its own testId prefix as a prop). `arena-page.tsx`,
`arena-desktop.tsx`, `arena-mobile.tsx`, `arena-page.tutorial.tsx` stay put and
compose the moved components; tutorial gains one `preferences` step (7 → 8).

### 6. Hook changes

`use-arena-recommendations.ts`:

- add `const catalog = useLiveQuery(() => getCharactersMap(), [retryNonce])`;
  fold its absence into the existing loading state and a read failure into the
  existing error state (reuse the `LIVE_QUERY_ERROR` sentinel pattern).
- `usePersistedPreferences(pageKey: string): [TeamPreferences, (p) => void]` —
  JSON in `localStorage` under `tp.dailies.${pageKey}.preferences`, same
  try/catch shape as `usePersistedArenaMode`; parse defensively, drop unknown
  values to `undefined`.
- build `roster` entries with `traits` / `damageTypes` from the catalog map;
  compute `availableTraits` / `availableDamageTypes` as sorted unions over the
  owned roster for the control options.
- pass `preferences` into `buildArenaRecommendations` and expose
  `preferences` + `setPreferences` + the two option lists on the `ready` view
  model.

## Risks / Trade-offs

- **[Extraction drift]** A subtle behaviour change slips in during the move →
  keep `arena-recommendations.test.ts`'s existing assertions running against the
  Arena config unchanged; only _add_ preference cases. Any existing test needing
  a behavioural edit means the refactor is wrong.
- **[`orderCandidates` eligibility tier in Power mode]** Swapping the XP-capped
  tier for `isEligible` must be a true no-op when `prefs = {}`. Covered by an
  explicit test: Power mode + no prefs produces the identical order to today.
- **[Namespace split breaks a missed string]** `team-translations.test.ts` key
  parity across en/de/es/fr for both namespaces catches drops; a manual grep for
  `t("` / `i18nKey` under `ui/arena/` and `ui/team-recs/` confirms every key
  resolves to the namespace now passed.
- **[Cached catalog without the damage-type default]** Devices synced before the
  schema's `.default([])` was added can have `activeAbilityDamage === undefined`
  → the `?? []` guards in the shared helper handle it; a missing catalog row for
  an owned unit contributes no traits/damage types (character simply never
  matches a preference), which is acceptable.
- **[knip]** Removing `ARENA_POOL_ORDER` / renaming exports may leave unused
  entries → run `pnpm --filter web lint` and delete or re-export as needed.
