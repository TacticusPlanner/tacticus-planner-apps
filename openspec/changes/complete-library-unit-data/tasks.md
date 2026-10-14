## 0. Preconditions

- [x] 0.1 Confirm the companion API change `complete-library-unit-data` is applied (raw `mows[]` carry `mythicAbility`; `mythic-quests` is served); verify by reading `units-ultramarines.json` in the sibling checkout and `GET /api/v1/game-catalog/mythic-quests` on the local stack.

## 1. Ability rules-text generator

- [x] 1.1 Add `apps/web/scripts/generate-ability-text-i18n.mjs` per design D1/D2 (inputs, id set, entry rule with `trim()` and referenced-token pruning, sorted keys, uncovered-id report, `KNOWN_GAPS`, relic ability icon check, non-zero exit on gap drift), with a header comment matching the raid-boss generator's style; verify 299 of the 301 still-referenced entries come out byte-identical in all four files, `Loki_SwoopingHawk` and `SlashingDive` only gain their split-index `dmg` variable, and only `LionHelm` is removed among the existing ids.
- [x] 1.2 Run the generator on the current inputs and commit the four `npcAbilityText.json` files; verify 425 entries per locale, the counts by group in `specs/ability-rules-text/spec.md`, exit code 0, and that a second run leaves `git diff` empty.
- [x] 1.3 Extend `shared/config/i18n/npc-ability-text-translations.test.ts` per design D5 (key-set and table parity across locales, 425 entries, every token resolvable by its own tables, spot-checks `AmuletOfTheVoidwyrm`, `WisdomOfTheAncients`, `ReanimationBeam`, German `DutyEternal`); verify it fails on a hand-deleted German entry and passes on the generated files.

## 2. Catalog client support

- [x] 2.1 `packages/game-catalog`: add `mythic-quests` to `servedDatasetKeys`, a zod schema for the served shape (`unitId`, `quests[].number`, `tasks[].locaKey/target/parameters`, `rewards[]` discriminated on `type`), payload/record types, storage mapping and a `getMythicQuestsByUnitId()` query (design D3); verify `schemas.test.ts` parses a served sample (Abaddon quest 1 and an `Equipment` reward) and rejects an unknown reward `type`, and the sync tests cover the new key.
- [x] 2.2 Add optional `mythicAbility: { name }` to the MoW schema; verify `schemas.test.ts` accepts a MoW with and without it.

## 3. Icons

- [x] 3.1 Grep for the old filenames, then rename and copy the six icon files per design D4 (two-step `git mv` for case-only renames); verify `git status` shows the renames and the folders list the exact-case names.
- [x] 3.2 Add the equipment icon coverage test (design D4) with the known-gap set `I_Block_E005`, `I_Block_L005`; verify it passes, and fails when one renamed file is temporarily reverted.
- [x] 3.3 Add `KNOWN_ISSUES.md` entries for the two Power Field icons and for the 8 abilities without rules text (from the generator's `KNOWN_GAPS`).

## 4. Gates

- [x] 4.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`, and `openspec validate complete-library-unit-data --strict` all pass.

## 5. Verification (local Aspire stack)

Data states needed: the API from the companion change running; a browser whose IndexedDB catalog synced before the change (to observe the resync). No sign-in needed.

- [x] 5.1 After load, the catalog sync fetches `mythic-quests` and the new `mows` payload once, and both are stored (IndexedDB dataset store or Network tab).
- [x] 5.2 Item icons: a page on `main` that shows Daemonflesh Plate or DW-02 Advanced Burst Cannon (Library shops) loads the icon; no broken image.
- [x] 5.3 NPC Library at ≥ 768px and < 768px (same-origin iframe): an NPC ability that gained text in this change (Lhykhis's Empyric Ambush, or the Forgefiend NPC's Hades Autocannons) expands with rules text instead of its name alone, and its German text renders.
