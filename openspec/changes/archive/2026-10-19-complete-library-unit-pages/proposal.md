## Why

Second half of issue [#204](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/204). The change
`complete-library-unit-data` (apps, with its API companion) lands on `main` the ability rules text for relics,
MoW and MoW mythic abilities, the `mythic-quests` dataset and `mows.mythicAbility` in the client catalog, and
the icon fixes. The Library unit pages that consume them (#205 MoW page, #206 character page) were still open
PRs then, so the page-level changes are this separate change, applied on `main` once #205 and #206 are merged.

## What Changes

- MoW Mythic panel: names the catalog's `mythicAbility` and renders its rules text **without rarity scaling**,
  as V1 does (Wisdom of the Ancients at 2 blue stars reads -13%, not -26%).
- MoW Primary/Secondary panels and the character Relic panel: no code change; their tests move from the
  missing-text state to the text state that the regenerated namespace now provides.
- Mythic quests: the character page reads quest structure from the catalog's `mythic-quests` dataset instead
  of the static `mythicQuests` namespace, which is removed; reward chips map from the served structured
  rewards. Task texts stay in the English `mythicQuestTasks` namespace, with de/es/fr falling back to English.
  Two English task texts copied from V1 are fixed (#206 review).

- Power without power data (user decision, found in live verification): the character, MoW and NPC pages
  hide power instead of showing "—" / "Power data unavailable" when the `unit-power` dataset is absent or
  has no entry. Character stats keep coming from the in-game stat step in `unit-power` (exact, checked
  against a player's Kariyan), so without it they still show "Stats data unavailable".

Deliberate exception (user decision): the mythic quest task templates are game text with no de/es/fr source
(V1 ships them English-only). They follow the existing English-only game-text namespaces (`npcTraitText`,
`raidBossTraitText`) instead of the "real de/es/fr translations" rule for UI copy. Issue #204's "all supported
languages" condition for quests is therefore **not** met.

Depends on: `complete-library-unit-data` (apps and API) applied, and #205 and #206 merged to `main`. No API
change of its own.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `character-unit-details`: Relic panel gains rules text for 32 relics (worked example and remaining gaps);
  Mythic quests read from the catalog dataset, with the fixed task texts and their absence states.
- `mow-unit-details`: MoW ability panels show rules text for all 22 abilities; the Mythic panel names the
  catalog's mythic ability and shows its text unscaled; power is hidden without power data.
- `character-unit-details` (also): power is hidden without power data.
- `npc-library`: the Power card is left out without power data.

## Impact

- `apps/web/src/fsd/pages/library`: MoW mythic panel scaling; mythic quest hook and model (reward parsing
  replaced by the served structure); page tests.
- Removed: `apps/web/public/locales/en/mythicQuests.json` and its `i18next.d.ts` entry.
- `apps/web/public/locales/en/mythicQuestTasks.json`: two template fixes.
- `KNOWN_ISSUES.md`: `mythicQuestTasks` is English-only.
- `ui/unit/unit-power-value.tsx`, `ui/unit/unit-power.model.ts`, `ui/npcs/npc-stat-cards.tsx`; the three
  `power.unavailable` keys are removed from en/de/es/fr `library.json`.
