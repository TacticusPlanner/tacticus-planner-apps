## 1. Shared damage-type helper

- [x] 1.1 Create `apps/web/src/fsd/shared/lib/character-damage-types.ts` with
      `characterDamageTypes(view)` unioning `meleeDamage`, `rangedDamage`,
      `activeAbilityDamage ?? []`, `passiveAbilityDamage ?? []` (deduped, falsy
      dropped); export it from `shared/lib/index.ts`. Verify with a new
      `character-damage-types.test.ts` covering the melee-only, melee+ranged, and
      missing-ability-arrays cases.
- [x] 1.2 Replace the inline union in
      `pages/library/ui/character/hooks/use-character-lookup-calc.ts` (~lines
      338-350) with a call to the shared helper; verify
      `pnpm --filter web exec vitest run src/fsd/pages/library` stays green.

## 2. Engine types

- [x] 2.1 Create `pages/dailies/model/team-recommendations.types.ts`: `TeamMode`,
      `TeamPoolSpec`, `TeamPreferences`, `TeamRosterCharacter` (Arena's roster shape
  - `traits`/`damageTypes`), `TeamMemberRationale`, `TeamMember`, `TeamCategory`
    (`id: "plan" | "random"`, `poolUsed`, `broadened`, `includedCappedCharacters`,
    `requestedSize`, `deliveredSize`, `members`), `TeamRecommendations`,
    `BuildTeamRecommendationsInput`, plus `MIN_TEAM_SIZE = 3` and
    `TEAM_SIZES = [3, 4, 5]`. Verify `pnpm --filter web typecheck`.

## 3. Engine

- [x] 3.1 Create `pages/dailies/model/team-recommendations.ts` by moving
      `mulberry32`, `seededSample`, `seededWeightedSample`, `randomTeamForSeed`,
      `sameUnitSet`, `memberOf`, `orderCandidates`, `buildPlanCategory` (→
      `buildPlanTeam`), `buildRandomCategory` (→ `buildRandomTeam`),
      `collectContributions`, `mapRosterCharacter` from `arena-recommendations.ts`
      verbatim; keep exported names for the ones the hook/tests use.
- [x] 3.2 Generalize `arena-eligibility.ts`'s `expandCandidatePool` /
      `poolUnitIds` to take `pools: readonly TeamPoolSpec[]` instead of
      `primaryPool` + the `ARENA_POOL_ORDER`/`PoolParams` triple; keep the
      `isEligible`-driven widen-to-three loop and the `broadened` computation.
      Rename `contributionByUnitId` stays; drop `ARENA_POOL_ORDER`.
- [x] 3.3 Replace `contributorRankOf` with `poolRankOf(id, ctx)` =
      `pools.length - firstPoolIndexContaining(id)`; thread it through
      `orderCandidates`.
- [x] 3.4 Add the preference predicate: `matchesPrefs(id)` from
      `ctx.traitsById` / `ctx.damageTypesById`, `isEligible = modeEligible &&
matchesPrefs`; feed `isEligible` to `expandCandidatePool` and swap
      `orderCandidates`' XP tier for `isEligible`. Implement the "never fail"
      fallback in `buildPlanTeam` (fill deficit slots ignoring prefs) and the draw
      narrowing + fallback in `buildRandomTeam`.
- [x] 3.5 Add `buildTeamRecommendations(input): TeamRecommendations` assembling
      the `BuildContext` (roster maps, pool specs from `input.pools`, capped/power
      maps, trait/damage-type maps) and returning
      `{ categories: [buildPlanTeam(ctx), buildRandomTeam(input, ctx)] }`.
- [x] 3.6 Create `pages/dailies/model/team-recommendations.test.ts`: move every
      engine-behaviour case from `arena-recommendations.test.ts` (ordering, widening,
      XP-capped fillers, Power weighted draw, locks, all-locked no-op, the
      six-character collision regression) and drive them with explicit `pools`
      configs. Add: satisfiable-preference restriction; under-supplied preference
      widens + flags `broadened`; unsatisfiable preference falls back to full teams;
      Power mode + `prefs = {}` order is identical to the pre-refactor order.
      Verify `pnpm --filter web exec vitest run src/fsd/pages/dailies/model/team-recommendations.test.ts`.

## 4. Arena config over the engine

- [x] 4.1 Reduce `pages/dailies/model/arena-recommendations.ts` to
      `buildArenaRecommendations(input)`: build the `active-project` and
      `overall-goals` `TeamPoolSpec`s from the contribution maps (rationale closure
      returns the existing `{ kind: "goal", ... }`), then delegate to
      `buildTeamRecommendations`. Re-export `collectContributions` /
      `mapRosterCharacter` from the engine module for existing importers.
- [x] 4.2 Reduce `arena-recommendations.types.ts` to Arena-specific aliases
      (`ArenaMode = TeamMode`, `ArenaRecommendations`, `ArenaRecommendationsViewModel`
      extended with `preferences`, `setPreferences`, `availableTraits`,
      `availableDamageTypes`), re-exporting the rest from the engine types. Remove
      now-dead constants (`ARENA_POOL_ORDER`, `ARENA_MAX_TEAM_SIZE` if present).
- [x] 4.3 Trim `arena-recommendations.test.ts` to Arena-only concerns
      (selected-project contributors outrank other-goal contributors; the two pools
      are built from the right contribution lists). Verify it and
      `team-recommendations.test.ts` both pass.

## 5. Hook

- [x] 5.1 In `use-arena-recommendations.ts` add
      `usePersistedPreferences("arena")` — `{ trait?, damageType? }` as JSON under
      `tp.dailies.arena.preferences`, defensive parse, same try/catch shape as
      `usePersistedArenaMode`. Unit-test defaulting, round-trip, and an unknown
      stored value in `use-arena-recommendations.test.tsx`.
- [x] 5.2 Add a `getCharactersMap()` `useLiveQuery` (keyed on `retryNonce`);
      route its pending state into the existing `loading` branch and a
      `LIVE_QUERY_ERROR` into the existing `error` branch.
- [x] 5.3 Build `roster` entries with `traits` / `damageTypes` from the catalog
      map; compute `availableTraits` / `availableDamageTypes` as sorted unions over
      the owned roster; pass `preferences` into `buildArenaRecommendations`; expose
      `preferences`, `setPreferences`, `availableTraits`, `availableDamageTypes` on
      the `ready` view model. Verify `use-arena-recommendations.test.tsx` (existing
      cases unchanged behaviourally + new preference cases).

## 6. Shared UI move

- [x] 6.1 Move `arena-team.tsx` → `pages/dailies/ui/team-recs/team-list.tsx`,
      `arena-mode-toggle.tsx` → `mode-toggle.tsx`, `arena-team-size.tsx` →
      `team-size.tsx`, `arena-category-section.tsx` → `category-section.tsx`,
      `arena-state.tsx` → `team-recs-state.tsx`; update imports; each takes its i18n
      namespace via `useTranslation("teamRecs")`. Keep `data-testid` values as-is.
- [x] 6.2 Create `team-recs/preference-controls.tsx`: two `Select`s (trait,
      damage type) each with an "Any" option, options from
      `{ traits, damageTypes }` props, `traitIcon()` / `damageTypeIcon()`, labels
      from `traits:` / `damageTypes:` namespaces, `data-testid`
      `arena-preferred-trait` / `arena-preferred-damage-type`, `onChange` mapping
      "Any" → `undefined`.
- [x] 6.3 Update `arena-page.tsx` to render `<PreferenceControls>` in the header
      row beside the mode toggle / project select / team size, wired to the new view
      model fields; update `arena-desktop.tsx` / `arena-mobile.tsx` imports.
- [x] 6.4 Add a `preferences` step to `arena-page.tutorial.tsx` (7 → 8 steps)
      targeting `arena-preferred-trait`; update `arena-page.tutorial.test.tsx`
      targets.
- [x] 6.5 Verify `pnpm --filter web exec vitest run src/fsd/pages/dailies/ui/arena`
      — `arena-page.test.tsx` updated to assert both controls render at both
      viewports and that changing a control calls `setPreferences`; all other
      assertions unchanged.

## 7. i18n

- [x] 7.1 Create `apps/web/public/locales/en/teamRecs.json` with `mode.*`,
      `teamSize.*`, `lock.*`, `rationale.*`,
      `category.{broadenedNote,cappedNote,fewerThanRequested}`, `state.*`,
      `project.label`, `regenerate`, `preferences.{trait,damageType,any,note}`,
      moved out of `en/arena.json`. Leave `arena.json` with `title`, `subtitle`,
      `category.{plan,random}.*`, `tour.arena.*` (+ a `tour.arena.steps.preferences`
      entry).
- [x] 7.2 `cp en/teamRecs.json` to `de/es/fr/`; re-sync `de/es/fr/arena.json`
      with the trimmed `en/arena.json` (English copies — #113).
- [x] 7.3 Register `teamRecs` in `shared/config/i18n/i18next.d.ts`.
- [x] 7.4 Replace `arena-translations.test.ts` with `team-translations.test.ts`
      asserting leaf-key parity across `en/de/es/fr` for both `arena` and `teamRecs`,
      plus the interpolation-token spot-checks. Verify it passes.

## 8. Full verification

- [x] 8.1 `pnpm --filter web typecheck` — 0 errors.
- [x] 8.2 `pnpm --filter web lint` (eslint + knip) — clean; delete any export
      knip now flags as unused.
- [x] 8.3 `pnpm --filter web lint:fsd` — no new steiger violation (confirm no
      `pages`→`pages` import from the damage-type helper move).
- [x] 8.4 `pnpm test:run` — full suite green; diff the pass count against the
      pre-change baseline and account for every removed/added test.
- [x] 8.5 `pnpm format` and `git diff --check` — clean.
- [x] 8.6 `openspec validate refactor-dailies-team-recommendations --strict` —
      passes.

## 9. Deferred / out-of-session

- [x] 9.1 Manual verification against the running Aspire stack (Chrome "Browser
      2", signed in as Severyn Display, real synced roster): trait + damage-type
      selects render beside mode/project/size and are populated from the owned
      roster (30+ real traits, 21 damage types, icons + translated labels);
      selecting a trait re-teams both Plan and Random; an under-supplied
      trait+damage combo tops up a non-matching slot as "Added to complete the
      team" while keeping the delivered size at 5; reverting to Any restores the
      unfiltered teams; the selection is stored as `{trait,damageType}` id JSON
      under `tp.dailies.arena.preferences` and survives a full reload; no console
      errors. (<768px viewport check not repeated — the controls share the same
      markup at every breakpoint, covered by the automated desktop/mobile parity
      test.)
