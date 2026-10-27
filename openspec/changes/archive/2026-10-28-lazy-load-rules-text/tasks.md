# Tasks

## 1. Generators and committed game text

- [x] 1.1 Change `apps/web/scripts/generate-ability-text-i18n.mjs` to empty and rewrite `public/locales/{en,de,es,fr}/npcAbilityText/` with one `<abilityId>.json` per entry (`{ "<id>": entry }`), assert every id matches `[A-Za-z0-9_-]+` with no case-only duplicates, and delete the four monolithic files; verify by running it twice and seeing `git diff --stat` unchanged on the second run and 434 files per locale.
- [x] 1.2 Add the summon regexes to the same generator and write `public/locales/en/npcAbilitySummoners.json` (sorted id array); verify the list contains Hollan's Aberrant Hypermorph ability id.
- [x] 1.3 Change `apps/web/scripts/generate-raid-boss-i18n.mjs` to write `public/locales/en/raidBossAbilityText/<abilityId>.json` the same way and delete `raidBossAbilityText.json`; verify 152 files and an unchanged second run.
- [x] 1.4 Rewrite `shared/config/i18n/npc-ability-text-translations.test.ts` to read the directories with `import.meta.glob(..., { eager: true })`: identical id sets across locales, identical tables per id, entry count, each file holds exactly its own id, no unresolvable token; add the summoners parity test (committed list == `abilitySummons` over committed English descriptions); verify both fail when one German file is deleted or one id is removed from the list, then pass.

## 2. Non-suspending hooks

- [x] 2.1 Rework `shared/ability-text/use-ability-text.ts`: `useAbilityText(abilityIds)` and `useTraitText()` use `useTranslation(ns, { useSuspense: false })`, exclude ids listed in the generated `*Gaps.json` lists before requesting namespaces, track `failedLoading` for the namespaces they did request, and return `{ ready, failed, retry, text }`; update `i18next.d.ts` per design decision 5; verify with unit tests covering ready, failed, retry, the English fallback, and a known-gap id that triggers no request and reads as missing text (separate from the failed-download test).
- [x] 2.2 Rework `entities/raid-boss/lib/use-raid-boss-text.ts` the same way (`useRaidBossText({ abilityIds })`), keeping `raidBossTraitText` whole; verify with the same unit-test matrix.
- [x] 2.3 Replace `descriptionOf` in `pages/dailies/model/hre-summoners.ts` / `use-hre-team-recommendations.ts` with an `isSummoning(abilityId)` predicate backed by the `npcAbilitySummoners` namespace; verify `hre-summoners.test.ts` and the HRE team tests still exclude Hollan for the summon-free objective.

## 3. Panels and pages

- [x] 3.1 Add `library` keys for the panel loading line and failure line (reuse the existing `retry` key) with real de/es/fr translations in all four locale files; verify the locale-key parity test passes.
- [x] 3.2 Update `pages/library/ui/unit/ability-panel.tsx` and its callers in `character-unit-page.tsx` and `mow-unit-page.tsx` to pass the unit's ability ids, render the loading state while not ready, the failure note with retry when failed, and the existing missing-text note otherwise; keep `hasAbilityText` for the tutorial derived from the loaded text; verify `ability-panel.test.tsx`, `character-unit-page.test.tsx` and `mow-unit-page.test.tsx` cover the three states and that the page renders its header before the text namespace resolves.
- [x] 3.3 Update `pages/library/ui/npcs/npc-abilities.tsx` and `npc-traits.tsx` to request only the selected variation's ability ids and the trait namespace, with the same three states; verify the NPC page test asserts the page renders with the text pending and that no other ability namespace is requested.
- [x] 3.4 Update `pages/library/ui/raid-bosses/raid-boss-ability-panel.tsx` to pass the shown ability ids and render the three states; verify `raid-bosses-page.test.tsx` covers them.
- [x] 3.5 Confirm `character-unit.tutorial.tsx` steps still resolve when the ability text arrives after the tour starts (step list recomputes on `hasAbilityText`), and update the step or its i18n only if a target changed; verify the tutorial test passes.

## 4. Desktop verification (viewport at or above 768px)

- [ ] 4.1 With the Aspire stack running and the network throttled to Slow 3G in DevTools, open `/library/characters/<unit>`, `/library/machines-of-war/<mow>`, `/library/npcs` and a raid boss: the page header and panels paint before the rules text, each panel shows the loading state, then the text; the Network panel shows only the shown abilities' files (plus `en` fallback when the language is not English). Record the request list in this task.
- [ ] 4.2 Block `npcAbilityText/*` with a DevTools request block, reload a unit page: the panels show the failure note with retry; unblock and retry renders the text. Repeat for a raid boss with `raidBossAbilityText/*`.
- [x] 4.3 Run the character unit page tour on desktop and confirm the ability-text step appears once the text has loaded.

## 5. Mobile verification (viewport below 768px)

- [ ] 5.1 In a same-origin 420px-wide iframe on the app origin (see `tp-manual-ui-verification`), repeat 4.1 on the character, MoW, NPC and raid-boss pages: the mobile tab layout renders, the panels show the loading state and then the text, and the panels' loading and failure notes fit without horizontal overflow.
- [ ] 5.2 Repeat 4.2 in the iframe for one unit page and one raid boss.
- [x] 5.3 Run the character unit page tour in the iframe and confirm the mobile steps still target the ability panel.

## 6. Integration gates

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps`; all pass.
- [x] 6.2 Build with `pnpm --filter web build` and confirm `dist/locales/<lng>/npcAbilityText/` and `dist/locales/en/raidBossAbilityText/` are present and the two monolithic files are absent.

## Notes (as built)

- **Loader.** One shared `useRulesText` hook in `shared/ability-text` (`use-rules-text.ts`) backs
  `useAbilityText(ids)`, `useTraitText()`, `useRaidBossAbilityText(ids)` and
  `useRaidBossTraitText()`. It loads namespaces with `i18n.loadNamespaces` rather than
  `useTranslation(ns, { useSuspense: false })`, because react-i18next memoises the namespace list by
  its items and the list changes size once the gap list arrives. The design's single
  `useRaidBossText({ abilityIds })` is two hooks instead.
- **Failure detection.** `failed` is not tracked from the `failedLoading` event. Instead, a namespace
  that has settled but has no bundle in any active language counts as failed, which also holds after a
  panel remounts. Retry cannot use `reloadResources`: i18next's connector keeps a failed namespace at
  state -1 and skips it even on reload, so the hook clears those -1 entries and loads again.
- **Gap lists.** The generators write `npcAbilityTextGaps.json` and `raidBossAbilityTextGaps.json`
  (en, sorted). The raid-boss gaps are `GuildBossRunAway` and `MawClawsofThyrax`.
- **Raid-boss content kept as committed.** The sibling V1 checkout has moved on since
  `raidBossAbilityText.json` was last generated. Running `generate-raid-boss-i18n.mjs` today would
  change 1.43 content, for example the `BossAdjutant` hp tables and the `TeleportStrike` trait text.
  So the 152 per-ability raid files were written from the committed `raidBossAbilityText.json`, using
  the generator's own layout and Prettier settings. The other four raid-boss files were left as
  committed. The generator now formats its output with Prettier, and two runs in a row produce
  identical files. A content refresh is a separate change. The ability-text generator reproduces the
  committed content exactly: 434 files per locale, and two runs produce identical files.
- **Types.** No template-literal index signature or cast was needed. `npcAbilityText` and
  `raidBossAbilityText` left `i18next.d.ts`, `npcAbilitySummoners` was added, and the loader passes
  plain string namespaces to the `i18n.*` APIs.
- **Copy.** Every panel kind uses one shared pair of keys, `library:unit.ability.loadingText` and
  `unit.ability.textFailed`, plus the existing `unit.retry`. NPC ability and trait chips stay
  collapsed and expand into the loading line or failure note. Character and raid-boss trait lists show
  one note for the whole list.
- **Summoners parity test.** It lives in `features/team-recommendations/model/hre-summoners.test.ts`
  rather than in the shared translations test, because `shared` must not import `abilitySummons` from
  `features`. HRE still suspends on its namespace, which is now the 1 KB `npcAbilitySummoners` list.
- **Test i18n instance.** Bundling the ~600 nested files eagerly added about 20 s of setup to every
  test file. So `src/test/i18n-instance.ts` keeps top-level files eager and loads nested namespaces
  through a small lazy backend over `import.meta.glob`. For tests it exposes `requestedNamespaces`
  and `holdNamespaceLoads()`. `src/test/rules-text.ts` merges the English per-ability files back into
  one table for tests that read many entries. Character-page fixtures now use known-gap ids, because
  made-up ids are neither files nor gaps and would read as failed downloads.
- **Left open.** 4.x and 5.x are the manual browser checks.
- **6.2.** The worktree build failed with `ENOTEMPTY` on `dist/game_catalog` (a Windows worktree issue). Built again in the main checkout with `build:staging`: `dist/locales/{en,de,es,fr}/npcAbilityText/` holds 434 files each, `dist/locales/en/raidBossAbilityText/` holds 152, and no monolithic `*AbilityText.json` remains.
- **Flaky test.** In one full run, the unrelated `goals-list.drag-perf.test.tsx` failed its re-render
  budget. It passes when run alone and passed in the next full run (544 files, 5174 tests).

## Manual verification (2026-10-23, Aspire stack, no throttling available)

- Rules-text requests recorded per page (4.1):
  - Bellator, en: `npcTraitText`, `npcAbilityTextGaps` and its 3 abilities (`DeathFromAbove`,
    `ShockAssault`, `RelicBoltPistol`).
  - Bellator, de: the de files plus the en fallbacks.
  - Galatian MoW: gaps plus `DutyEternal`, `MacroPlasmaIncinerator`, `WisdomOfTheAncients`.
  - Roswitha NPC: only the selected variation's `BrazierOfHolyFire` and `CondemnorStake`.
  - Belisarius raid boss: `raidBossAbilityTextGaps`, `raidBossTraitText` and its 6 shown abilities.
  - No other ability file is requested on any of these pages, and all text renders.
- 4.1 / 5.1 stay open: DevTools throttling isn't available from the browser extension, so the
  loading state painting first hasn't been seen. Mobile (420px) renders all four pages with text and
  no horizontal overflow.
- 4.2 / 5.2 are blocked: they need DevTools request blocking.
- **4.3 / 5.3** The character tour runs all 5 steps, including "Abilities", on desktop and in the
  iframe.
- Minor follow-up: `npcAbilityTextGaps` is also requested for the active non-English language, where
  no file exists. The dev server answers with index.html and i18next falls back to en silently.
