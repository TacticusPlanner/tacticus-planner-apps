import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { abilityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import type { AbilityTextEntry, RulesText } from "@/shared/ability-text"

import { AbilityPanel } from "../unit/ability-panel"
import { MYTHIC_MAX_LEVEL } from "./mow-unit.view-model"

/**
 * The Mythic ability panel: the ability panel at the level the blue stars give (no stepper), or an
 * "Unlocks at Mythic" pill below Mythic. When the catalog names no mythic ability, it is titled
 * "Mythic ability" and shows the missing-text note.
 *
 * Its values are not scaled by rarity: V1 renders this panel with `disableScaling`, and the game's
 * table values are what the level shows (Wisdom of the Ancients 10/13/16/20%).
 */
export function MowMythicPanel({
  name,
  abilityKey,
  text,
  rules,
  level,
  rarity,
  unitName,
  factionId,
}: {
  name: string
  abilityKey: string | undefined
  text: AbilityTextEntry | undefined
  /** Omitted when the catalog names no mythic ability (no text is loading for it). */
  rules?: RulesText<unknown>
  /** `undefined` below Mythic. */
  level: number | undefined
  rarity: Rarity
  unitName: string
  factionId: string
}) {
  const { t } = useTranslation("library")
  const unscaledText = useMemo(
    () => (text ? { ...text, scaled: [] } : undefined),
    [text]
  )
  return (
    <AbilityPanel
      kind={t("mowUnit.abilities.mythic")}
      name={name}
      iconSrc={abilityKey ? abilityIcon(abilityKey) : undefined}
      text={unscaledText}
      rules={rules}
      rarity={rarity}
      unitName={unitName}
      factionId={factionId}
      level={level ?? 1}
      onLevelChange={() => undefined}
      maxLevel={MYTHIC_MAX_LEVEL}
      levelControl={
        level === undefined ? (
          <span
            className="inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold"
            data-testid="unit-ability-mythic-locked"
          >
            {t("mowUnit.mythic.unlocks")}
          </span>
        ) : (
          <span
            className="text-sm text-muted-foreground"
            data-testid="unit-ability-mythic-level"
          >
            {t("mowUnit.mythic.level", { level })}
          </span>
        )
      }
      data-testid="unit-ability-mythic"
    />
  )
}
