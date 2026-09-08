## 1. Character combat power (`@workspace/game-domain`)

- [x] 1.1 Add `packages/game-domain/src/combat-power.ts` exporting
      `characterCombatPower`, `characterAttributePower`, `characterAbilityPower`
      with the coefficient tables/curve ported verbatim from V1's
      `CharactersPowerService` (design.md — D1, V1 port parity checklist). Export
      all three from `packages/game-domain/src/index.ts`. Verify `pnpm --filter
@workspace/game-domain typecheck` passes.
- [x] 1.2 Add `packages/game-domain/src/combat-power.test.ts`: table-driven
      parity fixtures hitting every `abilityCoeff` branch boundary (22, 39, 40, 44,
      50, >50), `None` and `MythicWings` star tiers, `Stone1` and top rank, the
      not-unlocked → 0 case, and the worked example (`Gold1`, `Epic:RedOneStar`, 3
      applied upgrades, active 20 / passive 15 → attribute 8114, ability 678, total
      **8792**) from `specs/character-combat-power/spec.md`. Verify `pnpm --filter
@workspace/game-domain exec vitest run src/combat-power.test.ts` passes.

## 2. Per-progression level cap (`@workspace/game-domain`)

- [x] 2.1 Add `levelCapByRarity`
      (`{ Common: 8, Uncommon: 17, Rare: 26, Epic: 35, Legendary: 50, Mythic: 60 }`,
      ported from V1's `maxLevelForRarity` — resolve the Mythic value per
      design.md — Open Questions) and `levelCapForProgression(p): number` to
      `packages/game-domain/src/progression.ts`, beside
      `abilityCapForProgression`; export both from the package index (design.md —
      D7a). Verify a colocated `progression.test.ts` case covers each rarity and
      `pnpm --filter @workspace/game-domain exec vitest run src/progression.test.ts`
      passes.
- [x] 2.2 Move `MAX_CHARACTER_LEVEL` out of
      `apps/web/src/fsd/pages/goals/model/goal-creation-form/goal-validation.ts`
      into `@workspace/game-domain` as `levelCapByRarity.Mythic` (the absolute
      ceiling), export it from the package index, and re-export/import it from
      `goal-validation.ts` so existing callers are unchanged (design.md — D7a).
      Verify `pnpm --filter web typecheck` and `pnpm lint:fsd` pass and no page
      imports another page's internal for this constant.
- [x] 2.3 Run the existing goals-page test suites that reference
      `MAX_CHARACTER_LEVEL` / `isAtMaxLevel` as a regression check. Verify `pnpm
--filter web exec vitest run src/fsd/pages/goals` passes.

## 3. Recommendation engine (page-local model)

- [x] 3.1 Add `apps/web/src/fsd/pages/dailies/model/arena-recommendations.types.ts`
      with the canonical `ArenaRecommendations` / `ArenaCategory` /
      `ArenaTeamVariant` / `ArenaTeamMember` types and the
      `use-arena-recommendations` view-model union (design.md — D3, D9). Verify
      `pnpm --filter web typecheck` passes.
- [x] 3.2 Add `apps/web/src/fsd/pages/dailies/model/arena-eligibility.ts`: pure
      XP-eligible predicate (owned/unlocked and
      `xpLevel < levelCapForProgression(progressionStep)` — per-tier cap, not a
      flat 60), contributor-set assembly, and ordered pool expansion
      (`active-project → overall-goals → full-roster`, advance while eligible < 3,
      set `broadened`) per `specs/dailies-arena-recommendations` "Minimum team size
      and candidate-pool expansion" and design.md — D4. Verify colocated
      `arena-eligibility.test.ts` covers thin-pool expansion, the <3-owned case,
      and the XP-eligible/capped split, and `pnpm --filter web exec vitest run
src/fsd/pages/dailies/model/arena-eligibility.test.ts` passes.
- [x] 3.3 Add `apps/web/src/fsd/pages/dailies/model/arena-recommendations.ts`
      `buildArenaRecommendations(input) → ArenaRecommendations`: XP Mode ordering
      (contributors → XP-eligible → combat-power tie-break), the 3/4/5 variants
      with size-3 `isPrimary`, capped-fill with `includedCappedCharacters`, Power
      Mode single top-5-by-power team, Random draw of 3–5, and per-member
      `rationale`. Categories `no-active-project` / `no-active-goals` /
      `roster-too-small` set `emptyReason`. Verify colocated
      `arena-recommendations.test.ts` covers every scenario in
      `specs/dailies-arena-recommendations/spec.md` (XP-capped deprioritised,
      size-3 primary, too-few-XP-eligible fill, Power picks top 5 in desc order,
      Power ignores cap, no-basis empty states) and `pnpm --filter web exec vitest
run src/fsd/pages/dailies/model/arena-recommendations.test.ts` passes.

## 4. Data hook + persistence

- [x] 4.1 Add `usePersistedArenaMode()` (localStorage key
      `tp.dailies.arena.mode`, default `"xp"`, `try/catch` both ends) in
      `apps/web/src/fsd/pages/dailies/model/use-arena-recommendations.ts`
      (design.md — D5). Verify a colocated test asserts default `"xp"`, round-trip
      persistence, and safe fallback when `localStorage` throws.
- [x] 4.2 Implement `use-arena-recommendations.ts`: gather `useProjects()`,
      `projectQueries.goals(activeProjectId)`, active-goal list query,
      `getPlayerCharacters()` + `getCharactersMap()` via `useLiveQuery` with the
      `safeLiveRead` sentinel pattern from `use-shop-recommendations.ts`; map
      records to builder inputs; memoize `buildArenaRecommendations` on the derived
      key (contributor id-sets + roster signature + mode, **excluding** the random
      nonce); expose `regenerate()` (nonce bump, non-random categories not
      recomputed — design.md — D6). Return
      `loading | error(retry) | no-characters | ready` (design.md — D9). Verify
      colocated `use-arena-recommendations.test.tsx` covers each status branch and
      that `regenerate()` changes only the Random team; `pnpm --filter web exec
vitest run src/fsd/pages/dailies/model/use-arena-recommendations.test.tsx`
      passes.

## 5. Arena page UI

- [x] 5.1 Add `apps/web/src/fsd/pages/dailies/ui/arena/arena-page.tsx` (the
      `status` switch + `data-testid="arena-page"`, mode toggle
      `data-testid="arena-mode-toggle"`) and shared presentational pieces: category
      section, team roster (≤5 portraits with name + rationale badge, id-resolved
      via catalog + `characters` namespace), Regenerate control
      (`data-testid="arena-random-regenerate"`), and the loading / error /
      no-characters / per-category empty states from
      `specs/dailies-arena-recommendations` "Distinct loading, failure, and empty
      states". Verify `arena-page.test.tsx` renders each state from a stubbed hook
      and `pnpm --filter web exec vitest run src/fsd/pages/dailies/ui/arena` passes.
- [x] 5.2 Add desktop and mobile subviews (design.md — D8): desktop grid +
      inline `ToggleGroup` 3/4/5 switcher (`data-testid="arena-variant-switcher"`);
      mobile stacked + compact `Select` switcher; identical categories, rosters,
      and rationales across viewports. Verify `arena-page.test.tsx` asserts both
      subviews expose the same recommended `unitId`s and the same
      `data-testid="arena-variant-switcher"`.
- [x] 5.3 Register the tutorial and confirm no FSD boundary violations
      (page-local model + `@/entities/*` public APIs + `@workspace/*` only).
      Verify `pnpm lint:fsd` passes.

## 6. Route & navigation wiring

- [x] 6.1 In `apps/web/src/fsd/pages/dailies/route.tsx` remove `"arena"` from
      the placeholder `.map` list and add a `lazy`-loaded
      `{ path: "arena", element: <ArenaPage /> }` sibling of `ShopsPage`
      (design.md — D7). Verify `dailies-pages.test.tsx` / `dailies-layout.test.tsx`
      are updated so `/dailies/arena` renders the Arena page (not the placeholder)
      with the Arena tab active, and `pnpm --filter web exec vitest run
src/fsd/pages/dailies/ui/dailies-pages.test.tsx
src/fsd/pages/dailies/ui/dailies-layout.test.tsx` passes.
- [x] 6.2 Update `openspec/specs/dailies-navigation` expectations in
      `section-tabs.test.tsx` / any placeholder test that currently asserts Arena
      shows "Under Construction". Verify `pnpm --filter web exec vitest run
src/fsd/app/layout/section-tabs.test.tsx` passes.

## 7. Internationalization

- [x] 7.1 Add a new `arena` namespace file
      `apps/web/public/locales/en/arena.json` with all Arena page copy (category
      titles/descriptions, mode toggle, variant switcher, Regenerate, rationale
      labels, every empty/error/loading/no-characters string) and
      `tour.arena.steps.*` title/content keys. Verify the page renders with no
      missing-key warnings in `arena-page.test.tsx`.
- [x] 7.2 Copy `arena.json` to `de`, `es`, `fr` as English-text placeholders
      (real translation tracked separately — see §11). Register the `arena`
      namespace in the i18next TypeScript resources type and in the i18n test that
      asserts locale-file key parity. Verify `pnpm --filter web typecheck` and the
      translations parity test (`dailies-translations.test.ts` sibling / the
      repo's locale-parity test) pass.
- [x] 7.3 Ensure `dailies:tabs.arena` and `dailies:tabs.arenaDescription`
      exist in `apps/web/public/locales/*/dailies.json` (add if the placeholder
      never defined a description). Verify the nav/section-tabs tests pass in all
      locales.

## 8. Onboarding tour

- [x] 8.1 Add `apps/web/src/fsd/pages/dailies/ui/arena/arena-page.tutorial.tsx`
      exporting `useArenaTutorial()` that targets `arena-page`,
      `arena-mode-toggle`, `arena-category-active-project`,
      `arena-variant-switcher`, `arena-random-regenerate`, registered via
      `useTourPageSteps` with `{ desktop: shared, mobile: shared }` (design.md —
      D8; Shops tutorial precedent). Copy comes from the `arena` namespace
      `tour.arena.steps.*` keys added in §7.1. Verify `arena-page.tutorial.test.tsx`
      asserts every step target resolves to a rendered element on both the desktop
      and mobile subviews, and `pnpm --filter web exec vitest run
src/fsd/pages/dailies/ui/arena/arena-page.tutorial.test.tsx` passes.

## 9. Full-suite gates

- [x] 9.1 Run and pass `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm
lint:fsd`, and `git diff --check` for the whole change. All green:
      `pnpm test:run` 921 passed / 149 files; `pnpm typecheck` 6/6; `pnpm lint`
      (eslint + knip) clean; `pnpm lint:fsd` no problems; `git diff --check` clean.

## 10. Deferred / out-of-session

- [x] 10.1 Real `de` / `es` / `fr` translations for the `arena` namespace —
      English-text placeholders ship now (structural key parity is enforced by
      `arena-translations.test.ts`); real translation tracked in
      TacticusPlanner/tacticus-planner-apps#113.
- [ ] 10.2 Manual browser verification on the full Aspire stack (`web` + `api`
      healthy), signed in, at one viewport <768px and one ≥768px, for these data
      states: (a) an active plan project with ≥3 active character goals; (b) no
      active plan but ≥1 active goal; (c) no active goals; (d) an owned roster of
      <3 characters; (e) a roster including characters sitting at their progression
      tier's level cap (e.g. an un-ascended Epic at level 35). Confirm: XP Mode
      default and its 3/4/5 variants with size-3 primary; Power Mode picks the
      strongest team and persists across a Raids→Arena round trip and a reload;
      Regenerate changes only the Random team and a reload re-randomizes it; the
      loading / error+retry / no-characters / per-category empty states; and the
      Joyride tour at both viewports.
      **NOT DONE — deferred.** Requires the running Aspire stack and a signed-in
      account seeded with data states (a)–(e); the stack was not started and no
      such account/fixtures were available in this session. Automated coverage
      stands in for the logic (engine + hook + page-render tests); this is the
      live end-to-end pass and must be run before archiving the change.
