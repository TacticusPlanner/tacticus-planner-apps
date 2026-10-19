## Context

See proposal.md. Written against the #205/#206 branches; re-check paths when applying on `main` after they
merge.

- MoW Mythic panel (`pages/library/ui/mow-unit/mow-mythic-panel.tsx`) renders through `AbilityPanel` with the
  shown rarity, so a rarity-affected variable is scaled; V1 passes `disableScaling` for this panel.
- Mythic quests: `use-mythic-quests.ts` reads `mythicQuests` (English, by character id) and `mythicQuestTasks`
  (templates by loca key); `pages/library/model/mythic-quests.ts` parses V1 reward strings.
- From `complete-library-unit-data`: `npcAbilityText` covers relic, MoW and MoW mythic abilities;
  `@workspace/game-catalog` exposes `getMythicQuestsByUnitId()` and `mows[].mythicAbility`.

## Goals / Non-Goals

**Goals:** the unit pages show the new text and read quests from the catalog; the static quest copy is gone.

**Non-Goals:** de/es/fr task templates (user decision: English fallback; no source exists). Any layout
change: panels already switch between the text and missing-text forms.

## Decisions

**D1: The MoW Mythic panel renders without rarity scaling.** `MowMythicPanel` passes the text entry with
`scaled: []` to `AbilityPanel` (no new prop on the shared panel). Matches V1 (`disableScaling`) and the game's
table values (Wisdom of the Ancients 10/13/16/20%). Primary/secondary keep scaling, as V1 does.
_Alternative:_ a `disableScaling` prop on `AbilityPanel`. Rejected: one caller; overriding the entry keeps the
shared component unchanged.

**D2: Quests come from the catalog query.** `use-mythic-quests.ts` reads `getMythicQuestsByUnitId()` through
the existing catalog query pattern (TanStack Query over Dexie). A missing dataset or record yields `undefined`
(no card). `parseMythicQuestReward` is removed; the `MythicQuestReward` union maps from the served `type`. Task
text keeps going through `mythicQuestTasks` and `mythicTaskVariables` (`taskParameters` becomes `parameters`).

**D3: Remove the `mythicQuests` namespace; keep `mythicQuestTasks` English-only.** Delete
`public/locales/en/mythicQuests.json`, its `i18next.d.ts` entry and any namespace preload entry. Fix two
English templates in `mythicQuestTasks.json`:

- `SlayEnemiesWithHeroToTraitInOneBattle_description`: the `[i2p_One]` branch gains " in one battle".
- `SlayEnemiesWithHeroToUnitEffectInOneBattle_UnitEffect_ArmourOfShriekingSouls_description`: becomes
  `Defeat {[KILL_AMOUNT]} enemies with {[HERO_NAME]} while under the <i>{[UNIT_EFFECT]}</i> effect in one
battle`. Armour of Shrieking Souls is Lucius's own ability, so "enemies that have the … effect" cannot be
  the intent; the game's own string is broken, so this wording is ours.

**D4: Archive order.** This change modifies `mow-unit-details` and `character-unit-details`, which exist in
`openspec/specs/` only after `add-mow-library-details` and `add-character-unit-details` are archived on `main`.

**D5: Power hides without power data; stats stay on the stat step.** (User decision during live
verification.) `UnitPowerValue` renders nothing when the figure is unavailable (character and MoW pages),
and the NPC page leaves its Power card out (4-column desktop row). Character stats keep the in-game stat
step from `unit-power`, which matches the game exactly (a player's Kariyan: 12,155 Health, 3,070 Armour).
_Alternative:_ V1's base-stat formula, so stats never depend on `unit-power`. Rejected: it scales all
stats alike and was clearly off (Kariyan's Damage 2,713 against 2,686).

## Risks / Trade-offs

- [The fixed Lucius text is our wording, not the game's] → Recorded in D3; re-check when the game fixes it.
- [Clients on an older API (no `mythic-quests`) lose the quest card instead of seeing the static copy] → The
  API deploys before `complete-library-unit-data`, long before this change; the card degrades, nothing breaks.
