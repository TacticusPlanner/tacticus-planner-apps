## Context

See proposal.md — Why. The engine and UI from `add-dailies-arena-recommendations`
are already in place (archived as `2026-09-08-add-dailies-arena-recommendations`):

- Pure engine in `apps/web/src/fsd/pages/dailies/model/`:
  `arena-recommendations.ts` (`buildArenaRecommendations`, `buildGoalCategory`,
  `buildRandomCategory`, `randomTeamForSeed`, `seededSample`, `mulberry32`),
  `arena-eligibility.ts` (`isXpCapped`, `combatPowerOf`, `expandCandidatePool`,
  `poolUnitIds`), `arena-recommendations.types.ts`.
- Data hook `use-arena-recommendations.ts` — `usePersistedArenaMode`
  (`localStorage` key `tp.dailies.arena.mode`), roster via `useLiveQuery`, goals
  via `goalQueries.list(false)` / `projectQueries.goals(activeProjectId)`,
  memoized `buildArenaRecommendations`, `regenerate` = `randomSeed++`.
- UI in `apps/web/src/fsd/pages/dailies/ui/arena/` — `arena-page.tsx`,
  `arena-mode-toggle.tsx`, `arena-category-section.tsx`, `arena-variant-switcher.tsx`
  (`Tabs` inline / `Select` compact), `arena-team.tsx` (2-col grid),
  `desktop/arena-desktop.tsx`, `mobile/arena-mobile.tsx`, `arena-page.tutorial.tsx`.
- i18n namespace `arena` in `apps/web/public/locales/{en,de,es,fr}/arena.json`;
  key parity enforced by `arena-translations.test.ts`.

Constraints: FSD dependency direction (pages must not import pages; reuse
`@/entities/project`, `@/shared/ui`, `@workspace/ui`); all copy through
`react-i18next`; desktop + mobile from one codebase (`useIsMobile`, 768px);
Joyride tour co-located and i18n-driven; Prettier (no semi, double quotes,
80 col).

The Dailies layout already owns shared project state:
`DailiesLayout` (`dailies-layout.tsx`) holds `selectedProjectId` and exposes
`{ projects, projectId, setProjectId, … }` as `DailiesOutletContext`;
`RaidsLayout` renders `<ProjectSelect>` bound to it. The Arena route is a direct
child of the Dailies layout, so it already receives this context via
`useOutletContext`.

## Goals / Non-Goals

**Goals:**

- One `Plan Team` category replacing `active-project` + `overall-goals`, driven
  by a project selector wired to the existing `DailiesOutletContext`.
- One page-level `Team size` radio group (3/4/5) replacing the per-category
  variant switcher, persisted like the mode.
- Mode-aware Random Team: XP-eligible-only pool in XP Mode; combat-power-weighted
  draw in Power Mode. Per-character locks that survive Regenerate.
- Single-column team rows carrying rarity + rank.
- Keep the engine a pure, fully unit-tested function; keep router coupling in the
  page, not the hook.

**Non-Goals:**

- HSE Team category (#111), preferred trait/alliance/damage-type controls (#112),
  real de/es/fr translations (#113).
- Persisting the Random Team or its locks across reload (unchanged).
- Changing `character-combat-power` or the level-cap model.
- Any `tacticus-planner-api` change.

## Decisions

### D1: One result shape — `ArenaCategory.members`, no variants

Drop `ArenaTeamVariant` and `ArenaCategory.variants`. `ArenaCategory` becomes
`{ id, poolUsed, broadened, includedCappedCharacters, requestedSize,
deliveredSize, members: ArenaTeamMember[] }`. The requested size is an engine
input, not an output dimension, so the "produce 3/4/5 and let the UI switch"
structure is gone. `ArenaCategoryId` becomes `"plan" | "random"`.

_Alternative:_ keep `variants` with a single entry — rejected: dead shape, and
every consumer/test still branches on it.

### D2: `Team size` is engine input + persisted UI state

`BuildArenaRecommendationsInput` gains `teamSize: number`. The hook adds
`usePersistedTeamSize()` mirroring `usePersistedArenaMode()` exactly
(`localStorage` key `tp.dailies.arena.teamSize`, parse to `3 | 4 | 5`, default
3, try/catch both ends). The `ready` view model exposes
`teamSize`, `setTeamSize`, and `availableSizes: number[]` (sizes `<= roster
length`; the UI renders 4/5 disabled when not in `availableSizes`).

Delivered size can still fall below requested when the pool is too thin — the
engine sets `deliveredSize = members.length` and the section renders a
"fewer than requested" note when `deliveredSize < requestedSize`.

_Alternative:_ per-category size — rejected by the user (one page-level control).

### D3: `Plan Team` = today's `buildGoalCategory("active-project")` with a ranked

contributor tier

`buildArenaRecommendations` calls a single `buildPlanCategory(ctx)` +
`buildRandomCategory(...)`. `buildPlanCategory` reuses `expandCandidatePool`
unchanged with `primaryPool: "active-project"` — which now means _selected_
project because the hook feeds the selected project's goals into
`activeProjectContributions`.

`orderCandidates` today ranks `isContributor` as a boolean. Replace with a
`contributorRank(id): 0 | 1 | 2` — 2 = selected-project contributor, 1 = any
active-goal contributor, 0 = neither — and sort descending on it (after the
XP-eligible tier, before combat power). This makes "selected-project
contributors rank ahead of other goal contributors" fall out of the existing
comparator.

`buildArenaRecommendations` drops the `hasActiveProject` gate and the two
`emptyReason` early-returns. Input `hasActiveProject: boolean` →
`selectedProjectId: string | undefined`; when absent, the hook simply passes no
project contributions and the primary pool degenerates to overall-goals →
roster. The `no-active-project` / `no-active-goals` `emptyReason` values and the
`ArenaCategoryEmptyReason` type are removed.

### D4: Random Team — mode-aware pool + weighted draw + locks

`buildRandomCategory(input, ctx)`:

1. **Pool by mode.** XP Mode: `rosterIds` filtered to `!cappedById.get(id)`; if
   that is fewer than `min(teamSize, rosterIds.length)`, append the capped ids
   (so the team can still fill). Power Mode: all `rosterIds`.
2. **Locks first.** `input.lockedRandomUnitIds` ∩ `rosterIds`, in roster order,
   are placed first — even if a locked id is not in the mode pool (explicit user
   choice; satisfies "Locked character kept against the mode filter"). Truncate
   to `teamSize` if over-locked.
3. **Fill remaining** `size - locked.length` slots from `pool \ locked`:
   - XP Mode: `seededSample` (flat), as today.
   - Power Mode: `seededWeightedSample(ids, weights, size, seed)` — new helper,
     weighted Fisher–Yates / roulette without replacement, weight =
     `combatPowerById.get(id) ?? 1`, driven by `mulberry32(seed)`.
4. **Distinctness.** `randomTeamForSeed` (the `e1f9795` fix) keeps its
   walk-the-seed-chain guarantee, but now (a) operates only on the _unlocked_
   fill, (b) is a no-op when `freeCandidates.length <= freeSlots` or every slot
   is locked, (c) takes the fill function so it works for both flat and weighted
   draws.

`ArenaTeamMember` gains `locked: boolean` (meaningful for the random category
only). No new rationale kind — `{ kind: "random" }` stays; the row shows a lock
control driven by the flag.

_Alternative for Power weighting:_ pick the seeded top-N by power then shuffle —
rejected: not "random weighted by power", just "random among the strong".

### D5: Locks + team size live in the hook; project comes from the router

`useArenaRecommendations` gains:

- `const [teamSize, setTeamSize] = usePersistedTeamSize()`
- `const [lockedRandomUnitIds, setLockedRandomUnitIds] = useState<UnitId[]>([])`,
  plus an effect that clears it when the roster's id set changes (compare a
  sorted-join key).
- `toggleRandomLock(unitId)` — add/remove in the array (cap at `teamSize`).
- `selectedProjectId` becomes a **parameter** of the hook. `ArenaPage` reads
  `useOutletContext<DailiesOutletContext>()` and passes
  `context.projectId` in. This keeps `react-router` out of the model layer and
  out of the hook's own tests (which mock entities, not the router).

`projectQueries.goals(selectedProjectId ?? "none")` replaces the
`activeProjectId`-derived query; `enabled` guard becomes
`Boolean(isAuthenticated && selectedProjectId)`.

Memo deps for `buildArenaRecommendations` add `teamSize`, `lockedRandomUnitIds`,
`selectedProjectId`.

### D6: UI — delete the switcher, add two controls, single-column rows

- **New `arena-team-size.tsx`** — `RadioGroup` + `Field`/`FieldLabel`/`FieldSet`
  from `@workspace/ui` (idiom: `pages/ui-kit/ui/selection-showcase.tsx`).
  Horizontal, legend `t("teamSize.label")`, three `RadioGroupItem`s labelled
  `3` / `4` / `5`; `disabled` when the value is not in `availableSizes`.
  `data-testid="arena-team-size"`, each item
  `data-testid={`arena-team-size-${n}`}`.
- **Delete `arena-variant-switcher.tsx`** and the `switcherLayout` prop threaded
  through `arena-category-section` / `arena-desktop` / `arena-mobile`.
- **`arena-team.tsx`** — `ul` goes from `grid gap-2 sm:grid-cols-2` to
  `flex flex-col gap-2`. Row adds a trailing cluster: `<RarityIcon>` +
  `<RankBadge showLabel={false}>` from `@/shared/ui`. When `onToggleLock` is
  passed (random category), a trailing icon `Button`
  (`Lock` / `LockOpen` from `lucide-react`, `aria-pressed={member.locked}`,
  `data-testid={`arena-lock-${member.unitId}`}`).
- **`arena-category-section.tsx`** — drop `preferredSize` state and the switcher;
  render `category.members` directly. Keep broadened / capped notes; add a
  "fewer than requested" note when `deliveredSize < requestedSize`. Regenerate
  `Button` gets `disabled={category.members.length > 0 && category.members.every(m => m.locked)}`.
- **`arena-page.tsx`** — header row becomes
  `ArenaModeToggle` + `ProjectSelect` (fed from `useOutletContext`) +
  `ArenaTeamSize`. Pass `context.projectId` into `useArenaRecommendations`.
- **`arena-desktop.tsx`** grid → `md:grid-cols-2` (two cards). `arena-mobile.tsx`
  unchanged apart from prop cleanup.
- **`arena-page.tutorial.tsx`** — retarget `arena-category-active-project` →
  `arena-category-plan`, `arena-variant-switcher` → `arena-team-size`; add a
  `project` step (target `arena-project-select`) and a `lock` step (target the
  first `arena-lock-*`, or a stable wrapper testid). 7 steps, `desktop` ===
  `mobile` as today.

`ProjectSelect` needs a stable `data-testid`; `RaidsLayout` already passes
`testId="dailies-project-select"`. Arena will pass
`testId="arena-project-select"` so the tour target is unambiguous when both
tabs are in the DOM tree during tests.

### D7: i18n key moves

`en/arena.json`: remove `category.active-project`, `category.overall-goals`,
`empty.*`, `variant.*`. Add `category.plan.{title,description}`,
`category.fewerThanRequested`, `teamSize.{label,option}` (`option` renders just
`{{count}}`), `project.label`, `lock.{lock,unlock}`,
`tour.arena.steps.{project,lock}.{title,content}`. Mirror the same key set into
`de/es/fr` as English copies (`#113`). `arena-translations.test.ts` spot-checks
update to the new keys.

## Risks / Trade-offs

- **Weighted sampling determinism across engines** → the helper uses only
  `mulberry32` + arithmetic, no `Array.sort` on floats; unit test pins exact
  output for a fixed seed and asserts a frequency skew over many seeds (not an
  exact distribution).
- **Over-locking vs. team size** → if locks exceed the current `teamSize`, the
  engine shows the first `teamSize` locked members and Regenerate is disabled;
  lowering size then raising it re-reveals them. Documented; `toggleRandomLock`
  also refuses to add beyond `teamSize`.
- **Removing `emptyReason` is a breaking view-model change** → all consumers are
  in-repo (`arena-category-section`, tests); knip/tsc will flag every stale
  reference. Handled in one pass.
- **Shared project state surprises** → changing the project on Arena also moves
  the Raids tabs' selection (already true between Raids sub-tabs). This is the
  intended, user-approved behavior; the tour's `project` step calls it out.
- **`arena-translations.test.ts` parity** → all four locale files must change
  together in the same commit or the suite fails.

## Open Questions

None — the ambiguous points (Power-mode random semantics, one vs. per-category
size control, project-selector scope, merged-card naming/empty behavior, and
archiving the prior change to host the delta) were resolved with the user before
this document.
