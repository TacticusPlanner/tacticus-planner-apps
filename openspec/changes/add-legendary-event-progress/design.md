# Design

## Context

See proposal.md — Why. This change builds on `add-legendary-events-hub` (must be applied, synced and merged first): the `entities/legendary-event` slice with its hooks and objective labels, the `pages/events` event page orchestrator that passes `laneIds` to lane-scoped sections, the named catalog and player-data queries, and the `legendaryEvents` i18n namespace.

Relevant current state beyond that:

- Catalog characters expose `alliance`, `faction`, `traits` (ids such as `SuppressiveFire`, `Resilient`), `meleeDamage`, `rangedDamage | null`, `meleeHits`, `rangedHits | null`, `activeAbilityDamage`, `passiveAbilityDamage`. `shared/lib/characterDamageTypes` unions those damage sources. V1's `damage-profile-exclusions.ts` (two units) has no V2 counterpart yet. Ability damage arrays are populated for some characters only (server-side gap).
- The objective filter kinds in the served data are `Alliance`, `Faction`, `Trait`, `DamageType`, `MinHits`, `MaxHits`, `AttackType` (target `Ranged`). V1 matched these in `3-features/lre/model/filters.ts` + `objective-dispatch.ts` and also had a `NoSummons` kind the catalog does not use.
- The synced `lre-progress` lane record carries `encounters[{ objectivesCleared, highScore, encounterPoints }]` and nothing else; no objective definitions.
- Roster: `getPlayerCharacters()` from `@workspace/player-data/queries`; rarity from `progressionRarity(progressionIndex)` and `rank` from the record; `RankBadge` / `RarityIcon` in `shared/ui`.

## Goals / Non-Goals

**Goals:**

- Deterministic, catalog-driven matching with tests over the real served datasets, so a new objective kind or renamed trait id fails CI instead of silently emptying an objective.
- One points model that every total derives from, including the hub and Home totals in later stages.
- Points earned always from synced `encounterPoints`, never recomputed from cleared flags, so a game-side scoring change cannot make the app disagree with the game.

**Non-Goals:**

- Any write path (annotations, manual cleared entry) — sync-wins.
- Team-aware projections ("projected clears") — Stage 2.
- Virtualised lists; measured in verification first.

## Decisions

**D1 — Four new pure libraries in `entities/legendary-event/lib`, exported from the slice index, plus the internal `damage-profile-exclusions.ts` helper (consumed by `objective-match.ts`, not exported).**

- `objective-match.ts`: `matchesObjectiveFilter(unit, filter) → boolean` (spec table; unknown kind → `false`), `isUnitAllowedOnLane(unit, lane)`, `objectivesSatisfied(unit, lane) → number[]` (objective indices).
- `damage-profile-exclusions.ts`: `{ votanChampion: ["Psychic", "Direct", "DirectDamage"], thousSekhetar: ["Psychic"] }` and `unitDealtDamageTypes(unit)` = `characterDamageTypes(unit)` minus exclusions. `shared/lib`'s helper stays generic; the Legendary-Event-specific correction lives here, as V1's placement note intended.
- `unit-potential.ts`: `unitLanePotential(unit, lane) → { points, slots, satisfied }` and `buildLaneLeaderboard(lane, characters, roster | undefined) → LeaderboardRow[]` (owned / locked / unknown ownership; default order points → slots → name).
- `lane-points-model.ts`: `buildLanePointsModel(lane) → LanePointsModel` (`battles[{ index, battlePoints, defeatAllPoints, objectiveScores[], maxPoints }]`, `maxPoints`).
- `synced-lane-progress.ts`: `buildSyncedLaneProgress(model, laneRecord | null) → LaneProgressView` (per battle cleared flags for defeat-all + five objectives, `pointsEarned`, `highScore`, `complete`; lane `pointsEarned`).

**D2 — Matching semantics port V1 exactly, with two deliberate differences.**
(1) `MinHits` / `MaxHits` use `rangedHits ?? meleeHits` (V1: `rangeHits || meleeHits`). (2) Unknown kinds match nothing and are caught by a test that walks every objective in the real `lres` fixtures and asserts each kind is supported — V1 threw at runtime. `DirectDamage` is added to V1's `Direct` since that is the id the V2 catalog emits.

**D3 — Sync-to-grid mapping is by objective index, asserted against real data.**
Index 0 = defeat-all, k ∈ 1..5 = objective with `index k−1`. V1 proved the game order equals the datamined bonus-objective order (its converter mapped by type/target and skipped the `Acing` objective at 0). V2 cannot re-verify at runtime, so a manual verification task compares `encounterPoints` against the model's per-battle points for the cleared set on a real synced account; a mismatch means the mapping must move server-side before Stage 3.

**D4 — Sections render into the orchestrator's lane-scoped slot; shared state stays in the orchestrator.**
`pages/events/ui/legendary-event/leaderboard/` (`leaderboard-table.tsx` desktop, `leaderboard-list.tsx` mobile, `leaderboard-controls.tsx`) and `progress/` (`progress-grid.tsx` desktop, `progress-rows.tsx` mobile) take `laneIds` from the orchestrator like Lane overview. The orchestrator adds the roster read and owns sort / "Only unlocked" state shared by the three lanes, discarded on unmount. Rows are computed once per roster / catalog change with `useMemo`.

| | Desktop (≥768) | Mobile (<768) |
| --- | --- | --- |
| Leaderboard | Table per lane (`@workspace/ui` table), sortable headers | Row cards per unit, compact sort/filter bar |
| Progress grid | 18 rows × 6 columns per lane | Compact rows, sticky icon header |
| Tour targets | `legendary-event-leaderboard`, `legendary-event-progress-grid` (appended after the Lane overview step) | same, after the lane selector and Lane overview steps |

**D5 — Owned / locked / unknown is a three-state, not a boolean.**
A roster read failure must not render every unit as locked (which would hide them behind "Only unlocked"); `buildLaneLeaderboard` takes `roster | undefined` and emits `ownership: "owned" | "locked" | "unknown"`, and the toggle is disabled for `unknown`.

**D6 — V1-parity checklist (this reimplements V1's points table and progress read-view).**

- Assets / icons: rank / rarity via `RankBadge` / `RarityIcon`; objective icons via the Stage-1 `useObjectiveLabel`.
- Layout: V1's ag-grid points table with "Characters: All / Unlocked / Selected" → table / row cards with "Only unlocked" (kept) and "Selected" (needs teams, Stage 2); V1's ten tile display toggles → dropped, rows always show portrait, name, rarity, rank; V1's "points calculation: unearned / all / estimated" → Stage 7 master table.
- Secondary states: V1 objective checkbox states (cleared / maybe / stop / partial) → read-only cleared / not-cleared (sync-wins), partial scores shown as high score and points; V1 per-cell tooltips → accessible cell text.

## Risks / Trade-offs

- [Objective index order differs from catalog `index` order for some event] → D3's manual verification before archive; if it fails, an API-side objective map in a follow-up change gates the grid.
- [Character ability damage arrays partly unpopulated server-side] → eligibility may under-count ability-only damage types for some units; tests pin the behaviour on current data and the gap is noted for the next catalog refresh.
- [~100 allowed units × 3 lanes on mobile] → plain list items, memoised; measured in verification; virtualise only if it drops frames.
- [Synced `encounterPoints` disagreeing with the computed maximum] → the header shows earned of computed maximum; a value above the maximum is clamped for the bar but shown as-is in text, and logged in the verification notes.
