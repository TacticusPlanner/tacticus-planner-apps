## 0. Preconditions

- [ ] 0.1 Confirm #205 and #206 are merged to `main`, and `add-mow-library-details` and `add-character-unit-details` are archived (their capabilities exist in `openspec/specs/`); verify `openspec validate complete-library-unit-pages --strict` reports no "archive would refuse" notice.
- [ ] 0.2 Confirm `complete-library-unit-data` (apps and API) is on `main`; verify `npcAbilityText` has 425 entries and `getMythicQuestsByUnitId` is exported from `@workspace/game-catalog`.

## 1. Relic and MoW panels

- [ ] 1.1 Character Relic panel: no code change expected; add a page test for Hollan's Amulet of the Voidwyrm at levels 1 and 2 (-390, next 411; -411, next 432) and for Aun'Shi's Fidelity missing-text state; verify both pass.
- [ ] 1.2 MoW ability panels: update the page tests that asserted the missing-text note for every MoW ability to the new text state (Galatian primary/secondary show stepper, text, next-level line, chart); add the Reanimator "Initial cooldown: 1 round" / "Cost: 1 munition" assertion; verify they pass.
- [ ] 1.3 MoW Mythic panel: pass the text entry with `scaled: []` (design D1) and drop the "Not served yet (#204)" comment if still present; verify page tests for Galatian at 2 blue stars (title "Wisdom of the Ancients", "-13% Damage"), Mythic Wings ("-20% Damage"), Legendary ("Unlocks at Mythic"), and a record without `mythicAbility` ("Mythic ability" + missing-text note).

## 2. Mythic quests from the catalog

- [ ] 2.1 Switch `use-mythic-quests.ts` to the catalog query (undefined when the dataset or record is absent), rename `taskParameters` → `parameters` in `mythic-quests.ts`, replace `parseMythicQuestReward` with a mapping from the served reward record, and update `mythic-quests.test.ts`; verify the Abaddon scenario (5 quests, quest 1 text and three reward chips), the Weirdboy no-card case and the dataset-absent case in `character-unit-page.test.tsx`.
- [ ] 2.2 Remove `public/locales/en/mythicQuests.json` and its entry in `shared/config/i18n/i18next.d.ts` (and any preload list); verify `pnpm typecheck` passes and `rg -n "mythicQuests\b" apps/web/src apps/web/public` finds no reference, while `rg -n mythicQuestTasks` still does.
- [ ] 2.3 Fix the two English templates in `public/locales/en/mythicQuestTasks.json` per design D3; verify page tests for Calgar quest 4 ("Defeat 1 enemy that has the Immune trait with Calgar in one battle") and Lucius quest 1 (names Lucius once, the effect once, ends "in one battle"), and a German-language test showing the English task text with German card labels.
- [ ] 2.4 i18n: confirm the change adds no new UI copy (the quest card, panels and notes reuse existing `library` keys); if implementation adds any key, add it to en/de/es/fr with real translations in the same task. `mythicQuestTasks` stays English-only by explicit user decision (proposal: Deliberate exception). Add the `KNOWN_ISSUES.md` entry for it.

## 3. Gates

- [ ] 3.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`, and `openspec validate complete-library-unit-pages --strict` all pass.

## 4. Desktop verification (≥ 768px, local Aspire stack)

Data states needed: the API from `complete-library-unit-data` running; signed out is enough for every check.

- [ ] 4.1 Hollan: Relic panel shows Amulet of the Voidwyrm text, next-level line and chart; stepping changes the value. Aun'Shi: Fidelity missing-text state.
- [ ] 4.2 Galatian at Mythic: Primary and Secondary panels with text and charts; Mythic panel "Wisdom of the Ancients" with level from blue stars, -13% at 2 blue stars, -20% at Mythic Wings via Custom; Legendary shows "Unlocks at Mythic".
- [ ] 4.3 Abaddon, Calgar and Lucius: Mythic quests card from the catalog with the fixed texts and reward icons; Weirdboy has no card.
- [ ] 4.4 Rules text in German and French on Galatian's Primary panel and Hollan's Relic panel (localized description, same values as English).
- [ ] 4.5 Unit page tours on a character and a MoW still run without missing targets.

## 5. Mobile verification (< 768px via a same-origin iframe)

- [ ] 5.1 Hollan and Galatian: Relic and Mythic sections collapsed by default; expanded, they show the same text and values as desktop; the Mythic header shows "Lv 2".
- [ ] 5.2 Abaddon: Mythic quests section header shows "5 quests"; expanded shows quest text and rewards; no horizontal scroll at 360px.
- [ ] 5.3 Unit page tours on a character and a MoW in the mobile form run without missing targets.
