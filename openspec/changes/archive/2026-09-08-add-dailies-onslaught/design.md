## Context

The shared `dailies-team-recommendations` engine (PR #116) already takes a
pre-narrowed roster and an ordered priority-pool list and emits one **Plan Team**
plus one **Random Team**. Salvage Run (PR #117) added the per-alliance-track
scaffolding: `usePersistedSalvageTrack`, the `SalvageTrack` type / `SALVAGE_TRACKS`
list / `isSalvageTrack` guard (`model/salvage-recommendations.types.ts`), the
`AllianceTrackSelector` (`ui/salvage-run/track-selector.tsx`), the shared
`ui/team-recs/track-shortfall.tsx` insufficient-roster panel, and the generic
persisted mode / size / preference hooks in `model/team-recommendation-prefs.ts`.
`salvage-recommendations.ts` is a ~20-line config that filters the roster to the
track's alliance and delegates to `buildArenaRecommendations`.

Onslaught (#78) is the same shape plus two things that are genuinely new:

1. a **highest-priority pool** of characters being ascended via Onslaught shard
   farming — which needs each candidate goal's `config` (`acquisitionSources`,
   Ascension `progression` target), and `listGoals` only returns `GoalSummary`
   (no `config`); and
2. a **post-battle shard recipient** — a single unit (Character _or_ Machine of
   War) to pick for the shard reward, ranked by project / goal priority and
   remaining shards. #78 is explicit that this is _not_ a team slot and MoWs
   stay out of the team engine, so it is a separate domain service.

Onslaught and Salvage Run are both routes in the `pages/dailies` slice, so
intra-slice reuse (as `salvage-recommendations.ts` already imports
`arena-recommendations.ts`) is allowed and preferred over new abstractions.

## Goals / Non-Goals

**Goals:**

- Onslaught page as a thin config over the shared engine + the Salvage Run track
  scaffolding, reusing the track selector, `track-shortfall.tsx`, the persisted
  control hooks, and the desktop/mobile layout split unchanged in shape.
- One new priority pool (Onslaught-farming Ascension goals) and one new pool
  rationale variant, wired through the existing engine seams.
- One new pure domain service for the shard recipient, unit-tested in isolation.

**Non-Goals:**

- The **Home Screen Event team** category #78 lists — deferred to #111, which
  will add one shared HSE pool to Arena, Salvage Run, and Onslaught together.
- Any Onslaught **token / sector / tier** economy (`onslaughtReward`,
  `progressForAlliance`): the shard recipient ranks on remaining shards only, so
  none of that data is read here.
- Multiple Plan-team categories. #78's "Onslaught Farming Team / Active Project
  Team / Overall Goals Team" are modelled as priority _tiers within the one Plan
  Team_, exactly as Arena already collapses its project/goals teams (PR #115).
- Changing the shard math: the service calls
  `calculateGoalResourceNeed` from `@/features/goal-farming` rather than
  re-deriving ascension costs.

## Decisions

### 1. Onslaught-farming goals are a priority pool, not a new category

`buildOnslaughtRecommendations` builds a `TeamPoolSpec` with `id:
"onslaught-ascension"` and prepends it to the two Arena pools, then delegates to
`buildTeamRecommendations` (not `buildArenaRecommendations`, which hard-codes its
two pools — so the shared Arena pool-building is lifted into a small helper both
call, or the pool list is assembled in the Onslaught config and passed through a
new `extraLeadingPools` parameter on `buildArenaRecommendations`). Chosen: add an
optional `leadingPools?: TeamPoolSpec[]` arg to `buildArenaRecommendations` —
smallest diff, keeps Arena's contribution-to-pool mapping in one place, Salvage
Run passes nothing and is unchanged.

_Alternative — emit `plan-onslaught` / `plan-project` / `plan-goals` categories:_
rejected. It forks the engine's category model for one page and breaks the
"widen one team through ordered pools" rule the spec is built on.

### 2. New rationale kind `onslaught-goal`

`TeamMemberRationale` gains `{ kind: "onslaught-goal"; goalId: string;
projectId?: string }`. The Onslaught pool's `rationaleFor` returns it; every
other pool is unchanged. `team-recommendations.ts` `rationaleFor` already returns
whatever the winning pool supplies, so no engine logic changes — only the union
type widens. `TeamList.rationaleText`'s `switch` gains a `case "onslaught-goal"`
→ `t("teamRecs:rationale.onslaughtGoal")`. The `switch` is exhaustive (no
`default`), so the compiler flags the missing case — that is the guard.

_Alternative — reuse `{ kind: "goal" }` with an `onslaught: true` flag:_
rejected. A discriminated union with an exhaustive render switch is the
established pattern here and gives a compile error if a renderer forgets it.

### 3. Fetch `GoalDetail` only for Ascension summaries

The hook keeps the Salvage Run data set (roster via `getPlayerCharacters`,
catalog via `getCharactersMap`, `goalQueries.list(false)`,
`projectQueries.goals(projectId)`), and adds:

- `getPlayerMows()`, `getMowsMap()`, `getAscensionCostsMap()` via `useLiveQuery`;
- `useQueries` over `goalQueries.detail(goalId)` for **only** the summaries with
  `goalType === "Ascension"` — bounding the fan-out to ascension goals, the same
  `useQueries(goalQueries.detail(...))` pattern `use-shop-recommendations.ts`
  uses.

A detail query still pending or errored routes into the page's existing
loading / error states. The Onslaught pool and the shard recipient are both
derived from the resolved `GoalDetail[]`, filtered to
`config.acquisitionSources?.some(s => s.kind === "Onslaught")` and the track's
alliance (character alliance from `getCharactersMap`, MoW alliance from
`getMowsMap`).

### 4. Shard recipient is a pure service `recommendOnslaughtShardRecipient`

`model/onslaught-shard-recipient.ts`, no React, no queries. Signature:

```ts
recommendOnslaughtShardRecipient(input: {
  track: SalvageTrack
  ascensionGoals: readonly GoalDetail[]        // Active Ascension goals, any alliance
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  playerCharacterById: ReadonlyMap<string, { shards; mythicShards; progressionIndex } | undefined>
  playerMowById: ReadonlyMap<string, { shards; mythicShards; progressionIndex } | undefined>
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  selectedProjectGoalPriority: ReadonlyMap<string, number>  // goalId -> priority, selected project only
  overallGoalOrder: readonly string[]           // goalId order from listGoals
}): OnslaughtShardRecipientResult
```

`OnslaughtShardRecipientResult` is `{ status: "none" } | { status: "ready";
recipient: OnslaughtShardCandidate; alternates: OnslaughtShardCandidate[] }`.
Each candidate carries `unitId`, `unitKind: "character" | "mow"`, `goalId`,
`projectId?`, `currentRarity`, `targetRarity`, `currentShards`,
`requiredShards`, `remainingShards`, and the `reason` discriminant.

Filtering: keep goals whose target unit's alliance equals `track`, whose
`acquisitionSources` include Onslaught, and whose
`calculateGoalResourceNeed({ detail, playerCharacter, playerMow,
ascensionCostsById, ... })` yields `shards + mythicShards > 0` (still owes
shards). `remainingShards = need.shards + need.mythicShards`;
`currentShards` = the owned count for the relevant tier (regular pre-Mythic,
`mythicShards` once `progressionIndex` is `Mythic:*`); `requiredShards =
currentShards + remainingShards`.

Ranking comparator, first difference wins:

1. goal is in the selected project (`selectedProjectGoalPriority.has(goalId)`) —
   `true` before `false`;
2. `selectedProjectGoalPriority.get(goalId)` ascending (lower = higher priority);
3. `overallGoalOrder.indexOf(goalId)` ascending;
4. `remainingShards` ascending — **fewer remaining first**, i.e. finish the
   nearest goal. #78 only says "Remaining shards required"; this picks the
   interpretation that completes a goal soonest, and the design note records it
   so it can be revisited.
5. `goalId` lexical — deterministic final tiebreak (stands in for "user-defined
   farming priority", which V2 exposes only as project goal order today).

### 4a. Reason discriminants

`reason` is one of `in-selected-project` (won on rank 1–2),
`overall-goal-priority` (won on rank 3), `fewest-remaining-shards` (won on rank
4), rendered from `onslaught:recipient.reason.*`. The comparator records which
rank produced the decisive difference against the runner-up (or a fixed reason
when it is the only candidate: `only-candidate`).

### 5. Reuse the track selector by promoting it to `ui/team-recs/`

`ui/salvage-run/track-selector.tsx` → `ui/team-recs/track-selector.tsx`
(unchanged code; it is already generic over `SALVAGE_TRACKS`). Salvage Run's one
import path updates. `SalvageTrack` / `SALVAGE_TRACKS` / `isSalvageTrack` stay in
`salvage-recommendations.types.ts` and are imported by the Onslaught modules
directly — renaming them to an alliance-neutral name is churn across the whole
Salvage Run change for no behaviour gain, and a 4th consumer can do that lift if
it ever exists.

`usePersistedSalvageTrack` is generalised to `usePersistedTrack(storageKey)` in
`team-recommendation-prefs.ts` (alongside the mode/size/preference hooks);
Salvage Run and Onslaught each wrap it with their own key
(`tp.dailies.salvage.track`, `tp.dailies.onslaught.track`).

### 6. Desktop / mobile split

Mirrors Salvage Run exactly: `ui/onslaught/onslaught-page.tsx` picks
`useIsMobile()` between `desktop/onslaught-desktop.tsx` and
`mobile/onslaught-mobile.tsx`, both composing the shared `team-recs`
components with `testIdPrefix="onslaught"`. The **shard recipient panel**
(`ui/onslaught/shard-recipient-panel.tsx`) is the only new surface: it renders
above the team sections in both layouts (it is relevant even in the
insufficient-roster state), full-width on mobile, and in the left/top region on
desktop. Tour targets (`data-testid`) are identical across desktop and mobile,
including `onslaught-shard-recipient`.

### 7. i18n

New `onslaught` namespace (en/de/es/fr), lazy-loaded (not added to `i18n.ts`
preload), registered in `i18next.d.ts`: `title`, `subtitle`, `track.{label,
imperial, chaos, xenos}` (reusing the same track keys shape as `salvageRun`),
`recipient.{title, none, unitKind.character, unitKind.mow, currentRarity,
targetRarity, shards, remaining, project, goal, reason.*}`, and
`tour.onslaught.steps.{purpose, track, mode, project, teamSize, preferences,
plan, shardRecipient, locks, regenerate}.{title, content}`. One key added to
`teamRecs.json`: `rationale.onslaughtGoal` ("Targeted by an Onslaught Ascend
goal.").

## Risks / Trade-offs

- **Ascension-goal detail fan-out** → one `goalQueries.detail` request per
  Ascension goal. Mitigation: filtered to Ascension summaries only, cached by
  TanStack Query (shared cache key with the Shops page), and gated behind
  `isAuthenticated`. Typical accounts have a handful of active Ascension goals.
- **"Remaining shards" tie-break direction is a judgement call** (#78 is
  silent). Mitigation: isolated in the comparator, covered by a dedicated unit
  test, and documented in Decision 4 so a product call can flip it in one line.
- **`leadingPools` parameter on `buildArenaRecommendations`** widens that
  function's surface. Mitigation: optional, defaulted to `[]`, and Salvage
  Run / Arena call sites are unchanged; the alternative (a second
  pool-assembly copy) is worse.
- **Shard recipient uses player shard state from `getPlayerCharacters()` /
  `getPlayerMows()`** (the list reads) rather than per-unit
  `getPlayerCharacter(id)`. Those list rows already carry `shards`,
  `mythicShards`, and `progressionIndex`, so a per-id fetch would only add
  latency. If a row is ever missing those fields the candidate is dropped
  (treated as "no data"), never shown with wrong numbers.

## Open Questions

None that block implementation. The remaining-shards tie-break direction
(Decision 4, step 4) is a product-tunable, not a blocker.
