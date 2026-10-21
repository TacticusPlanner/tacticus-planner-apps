# Tasks

## 1. Generators and committed game text

- [ ] 1.1 Change `apps/web/scripts/generate-ability-text-i18n.mjs` to empty and rewrite `public/locales/{en,de,es,fr}/npcAbilityText/` with one `<abilityId>.json` per entry (`{ "<id>": entry }`), assert every id matches `[A-Za-z0-9_-]+` with no case-only duplicates, and delete the four monolithic files; verify by running it twice and seeing `git diff --stat` unchanged on the second run and 434 files per locale.
- [ ] 1.2 Add the summon regexes to the same generator and write `public/locales/en/npcAbilitySummoners.json` (sorted id array); verify the list contains Hollan's Aberrant Hypermorph ability id.
- [ ] 1.3 Change `apps/web/scripts/generate-raid-boss-i18n.mjs` to write `public/locales/en/raidBossAbilityText/<abilityId>.json` the same way and delete `raidBossAbilityText.json`; verify 152 files and an unchanged second run.
- [ ] 1.4 Rewrite `shared/config/i18n/npc-ability-text-translations.test.ts` to read the directories with `import.meta.glob(..., { eager: true })`: identical id sets across locales, identical tables per id, entry count, each file holds exactly its own id, no unresolvable token; add the summoners parity test (committed list == `abilitySummons` over committed English descriptions); verify both fail when one German file is deleted or one id is removed from the list, then pass.

## 2. Non-suspending hooks

- [ ] 2.1 Rework `shared/ability-text/use-ability-text.ts`: `useAbilityText(abilityIds)` and `useTraitText()` use `useTranslation(ns, { useSuspense: false })`, track `failedLoading` for their namespaces, and return `{ ready, failed, retry, text }`; update `i18next.d.ts` per design decision 5; verify with unit tests covering ready, failed, retry and the English fallback.
- [ ] 2.2 Rework `entities/raid-boss/lib/use-raid-boss-text.ts` the same way (`useRaidBossText({ abilityIds })`), keeping `raidBossTraitText` whole; verify with the same unit-test matrix.
- [ ] 2.3 Replace `descriptionOf` in `pages/dailies/model/hre-summoners.ts` / `use-hre-team-recommendations.ts` with an `isSummoning(abilityId)` predicate backed by the `npcAbilitySummoners` namespace; verify `hre-summoners.test.ts` and the HRE team tests still exclude Hollan for the summon-free objective.

## 3. Panels and pages

- [ ] 3.1 Add `library` keys for the panel loading line and failure line (reuse the existing `retry` key) with real de/es/fr translations in all four locale files; verify the locale-key parity test passes.
- [ ] 3.2 Update `pages/library/ui/unit/ability-panel.tsx` and its callers in `character-unit-page.tsx` and `mow-unit-page.tsx` to pass the unit's ability ids, render the loading state while not ready, the failure note with retry when failed, and the existing missing-text note otherwise; keep `hasAbilityText` for the tutorial derived from the loaded text; verify `ability-panel.test.tsx`, `character-unit-page.test.tsx` and `mow-unit-page.test.tsx` cover the three states and that the page renders its header before the text namespace resolves.
- [ ] 3.3 Update `pages/library/ui/npcs/npc-abilities.tsx` and `npc-traits.tsx` to request only the selected variation's ability ids and the trait namespace, with the same three states; verify the NPC page test asserts the page renders with the text pending and that no other ability namespace is requested.
- [ ] 3.4 Update `pages/library/ui/raid-bosses/raid-boss-ability-panel.tsx` to pass the shown ability ids and render the three states; verify `raid-bosses-page.test.tsx` covers them.
- [ ] 3.5 Confirm `character-unit.tutorial.tsx` steps still resolve when the ability text arrives after the tour starts (step list recomputes on `hasAbilityText`), and update the step or its i18n only if a target changed; verify the tutorial test passes.

## 4. Desktop verification (viewport at or above 768px)

- [ ] 4.1 With the Aspire stack running and the network throttled to Slow 3G in DevTools, open `/library/characters/<unit>`, `/library/machines-of-war/<mow>`, `/library/npcs` and a raid boss: the page header and panels paint before the rules text, each panel shows the loading state, then the text; the Network panel shows only the shown abilities' files (plus `en` fallback when the language is not English). Record the request list in this task.
- [ ] 4.2 Block `npcAbilityText/*` with a DevTools request block, reload a unit page: the panels show the failure note with retry; unblock and retry renders the text. Repeat for a raid boss with `raidBossAbilityText/*`.
- [ ] 4.3 Run the character unit page tour on desktop and confirm the ability-text step appears once the text has loaded.

## 5. Mobile verification (viewport below 768px)

- [ ] 5.1 In a same-origin 420px-wide iframe on the app origin (see `tp-manual-ui-verification`), repeat 4.1 on the character, MoW, NPC and raid-boss pages: the mobile tab layout renders, the panels show the loading state and then the text, and the panels' loading and failure notes fit without horizontal overflow.
- [ ] 5.2 Repeat 4.2 in the iframe for one unit page and one raid boss.
- [ ] 5.3 Run the character unit page tour in the iframe and confirm the mobile steps still target the ability panel.

## 6. Integration gates

- [ ] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps`; all pass.
- [ ] 6.2 Build with `pnpm --filter web build` and confirm `dist/locales/<lng>/npcAbilityText/` and `dist/locales/en/raidBossAbilityText/` are present and the two monolithic files are absent.
