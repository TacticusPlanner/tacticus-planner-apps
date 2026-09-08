## 1. Engine types and result shape

- [x] 1.1 In `arena-recommendations.types.ts`: change `ArenaCategoryId` to
      `"plan" | "random"`; remove `ArenaTeamVariant`, `ArenaCategory.variants`,
      `ArenaCategoryEmptyReason`, and `ArenaCategory.emptyReason`; add
      `members: ArenaTeamMember[]`, `requestedSize: number`, `deliveredSize: number`
      to `ArenaCategory`. Verify `pnpm --filter web typecheck` lists only the
      expected downstream break sites (engine, hook, UI, tests).
- [x] 1.2 Add `rank: Rank`, `rarity: Rarity`, and `locked: boolean` to
      `ArenaTeamMember`; import `Rarity` from `@workspace/game-domain`. Verify it
      typechecks in isolation (`tsc` on the model dir).
- [x] 1.3 Replace `hasActiveProject: boolean` with
      `selectedProjectId: string | undefined` and add `teamSize: number` and
      `lockedRandomUnitIds: readonly UnitId[]` to `BuildArenaRecommendationsInput`;
      update `ArenaRecommendationsViewModel["ready"]` with `teamSize`, `setTeamSize`,
      `availableSizes`, `toggleRandomLock`, `lockedRandomUnitIds`, and
      `selectedProjectId`. Verify by updating the type-only imports in the test
      files compile.

## 2. Engine — Plan Team

- [x] 2.1 In `arena-recommendations.ts` collapse `buildGoalCategory` for the two
      goal categories into one `buildPlanCategory(ctx)` producing id `"plan"`;
      delete the `overall-goals` category and the `hasActiveProject` /
      `emptyReason` early-returns in `buildArenaRecommendations`. Verify the engine
      compiles and `buildArenaRecommendations` returns exactly
      `[planCategory, randomCategory]`.
- [x] 2.2 Replace the boolean `isContributor` ordering in `orderCandidates` with
      a `contributorRank(id) -> 0 | 1 | 2` (2 = selected-project contributor,
      1 = any active-goal contributor, 0 = neither) sorted after the XP-eligible
      tier and before combat power. Verify with a unit test: a selected-project
      contributor outranks an equal-power other-goal contributor.
- [x] 2.3 Apply `teamSize` as the take count:
      `members = ordered.slice(0, min(requestedSize, ordered.length, xpMode ?
max(ARENA_MIN_TEAM_SIZE, eligibleCount) : ordered.length))`; set
      `deliveredSize = members.length`; keep `includedCappedCharacters`. Verify unit
      tests: requested 5 with 4 eligible delivers 4; requested 3 unaffected.

## 3. Engine — Random Team (mode-aware, weighted, locks)

- [x] 3.1 Add `seededWeightedSample(ids, weightOf, size, seed)` (roulette /
      weighted Fisher–Yates without replacement, `mulberry32(seed)`-driven).
      Verify a unit test pins its exact output for one fixed seed and asserts a
      frequency skew toward high-weight ids across many seeds.
- [x] 3.2 Rework `buildRandomCategory`: XP-Mode pool = non-capped ids (topped up
      with capped ids only if fewer than `min(teamSize, roster)`); Power-Mode pool =
      full roster with `seededWeightedSample` weighted by `combatPowerById`. Verify
      unit tests: XP-Mode random team excludes capped chars when enough eligible;
      Power-Mode favors stronger chars over many regenerations.
- [x] 3.3 Place `lockedRandomUnitIds ∩ roster` (roster order, truncated to
      `teamSize`) first — including ids outside the current mode pool — then fill the
      remaining slots from `pool \ locked`. Verify unit tests: locked ids always
      present; a locked capped id in XP Mode is kept.
- [x] 3.4 Update `randomTeamForSeed` to walk the seed chain over the **unlocked
      fill only**, be a no-op when free candidates ≤ free slots or all slots locked,
      and accept the fill function (flat vs weighted). Verify the existing
      "distinct consecutive regenerations" + 6-char collision regression tests pass,
      adapted to locks.

## 4. Data hook

- [x] 4.1 Add `usePersistedTeamSize()` to `use-arena-recommendations.ts`
      mirroring `usePersistedArenaMode()` (`localStorage` key
      `tp.dailies.arena.teamSize`, parse to `3|4|5`, default 3, try/catch both
      ends). Verify unit tests: default 3, round-trips a set value, throw-safe.
- [x] 4.2 Make `selectedProjectId` a parameter of `useArenaRecommendations`;
      swap the `activeProjectId` goals query for
      `projectQueries.goals(selectedProjectId ?? "none")` with the matching
      `enabled` guard. Verify the hook test's project mock drives the selected-project
      path.
- [x] 4.3 Add `lockedRandomUnitIds` state + `toggleRandomLock` (cap at
      `teamSize`) + an effect clearing locks when the roster id-set changes; extend
      the `buildArenaRecommendations` memo deps and the `ready` view model with the
      new fields and `availableSizes` (sizes ≤ roster length). Verify hook tests:
      toggling a lock, regenerate keeps locked ids, `availableSizes` reflects a
      4-character roster.

## 5. UI — controls

- [x] 5.1 Create `ui/arena/arena-team-size.tsx` — `RadioGroup` + `Field*` from
      `@workspace/ui`, horizontal, legend `t("teamSize.label")`, items `3/4/5` with
      `disabled` when not in `availableSizes`, `data-testid="arena-team-size"` and
      `arena-team-size-${n}`. Verify a render test: three options, 5 disabled for a
      4-character roster, `onChange` fires.
- [x] 5.2 Delete `ui/arena/arena-variant-switcher.tsx` and remove the
      `switcherLayout` prop from `arena-category-section.tsx`,
      `desktop/arena-desktop.tsx`, `mobile/arena-mobile.tsx`. Verify
      `pnpm --filter web lint` (knip) reports no dangling export and typecheck is
      clean.
- [x] 5.3 Wire `ProjectSelect` (from `@/entities/project`,
      `testId="arena-project-select"`) and `<ArenaTeamSize>` into `arena-page.tsx`
      beside `<ArenaModeToggle>`, feeding `ProjectSelect` from
      `useOutletContext<DailiesOutletContext>()` and passing `context.projectId`
      into `useArenaRecommendations`. Verify a page test: selector present, changing
      it rebuilds the Plan Team.

## 6. UI — team rows and category section

- [x] 6.1 `arena-team.tsx`: single column (`flex flex-col gap-2`); add trailing
      `<RarityIcon>` + `<RankBadge showLabel={false}>` from `@/shared/ui` per row.
      Verify a render test asserts rarity/rank nodes appear for each member.
- [x] 6.2 `arena-team.tsx`: when an `onToggleLock` prop is present, render a
      `Lock`/`LockOpen` icon `Button` per row (`aria-pressed`,
      `data-testid="arena-lock-${unitId}"`). Verify a test toggles a lock and sees
      `aria-pressed` flip.
- [x] 6.3 `arena-category-section.tsx`: drop `preferredSize`/switcher; render
      `category.members`; add the "fewer than requested" note when
      `deliveredSize < requestedSize`; disable Regenerate when every member is
      locked. Verify a test: note shows for a clamped team; Regenerate disabled when
      all locked.
- [x] 6.4 `desktop/arena-desktop.tsx` grid → `md:grid-cols-2`; confirm
      `arena-mobile.tsx` still stacks. Verify `arena-page.test.tsx` sees two cards
      (`arena-category-plan`, `arena-category-random`) at both viewports.

## 7. Tour + i18n

- [x] 7.1 Update `arena-page.tutorial.tsx`: retarget the category step to
      `arena-category-plan` and the size step to `arena-team-size`; add a `project`
      step (`arena-project-select`) and a `lock` step; keep desktop === mobile.
      Verify `arena-page.tutorial.test.tsx` covers all 7 targets at both viewports.
- [x] 7.2 Update `en/arena.json`: remove `category.active-project`,
      `category.overall-goals`, `empty.*`, `variant.*`; add `category.plan.*`,
      `category.fewerThanRequested`, `teamSize.{label,option}`, `project.label`,
      `lock.{lock,unlock}`, `tour.arena.steps.{project,lock}.*`. Verify
      `pnpm --filter web exec vitest run src/fsd/pages/dailies/model/arena-translations.test.ts`.
- [x] 7.3 Mirror the exact key set into `de/es/fr` `arena.json` as English
      placeholders (real translation tracked in #113). Verify the translation
      parity test passes for all four locales.

## 8. Test sweep

- [x] 8.1 Rewrite `arena-recommendations.test.ts` around the two categories:
      selected-project ranking, widening flag, requested-size honored/clamped,
      XP-mode random pool, Power-mode weighted draw determinism + skew, locks
      surviving regenerate, all-locked no-op, adjacent-seed distinctness. Verify the
      file passes.
- [x] 8.2 Update `arena-eligibility.test.ts`, `use-arena-recommendations.test.tsx`,
      `arena-page.test.tsx`, `arena-page.tutorial.test.tsx`, and
      `dailies-layout.test.tsx` for the new shape/controls. Verify
      `pnpm --filter web exec vitest run src/fsd/pages/dailies` is green.

## 9. Gates

- [x] 9.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      `git diff --check`, `pnpm format` — all clean.
- [x] 9.2 `openspec validate refine-dailies-arena-team-controls --strict` passes.

## 10. Deferred / out-of-session

- [ ] 10.1 Manual browser verification on the full Aspire stack
      (`web` + `api`), signed in, at one viewport < 768px and one ≥ 768px, covering
      data states: (a) active plan with project goals; (b) no active plan but a
      default project; (c) a project whose owned contributors number fewer than the
      team size (broaden note); (d) a roster of exactly four characters (size 5
      disabled + clamp note); (e) XP Mode random team with some capped characters
      owned; (f) lock two random members, Regenerate, confirm they stay; (g) change
      the project on Arena, open Raids, confirm the selection carried. **Requires the
      running Aspire stack and a suitably seeded account — deferred; tracked
      alongside the archived change's task 10.2.**
- [ ] 10.2 Real `de`/`es`/`fr` `arena.json` translations — tracked in issue #113.
