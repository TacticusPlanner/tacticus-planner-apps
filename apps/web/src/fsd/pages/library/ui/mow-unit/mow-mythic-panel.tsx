import { useTranslation } from "react-i18next"
import { abilityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import type { AbilityTextEntry } from "@/shared/ability-text"

import { AbilityPanel } from "../unit/ability-panel"
import { MYTHIC_MAX_LEVEL } from "./mow-unit.view-model"

/**
 * The Mythic ability panel: the ability panel at the level the blue stars give (no stepper), or an
 * "Unlocks at Mythic" pill below Mythic. Until the catalog names the ability (#204), it is titled
 * "Mythic ability" and shows the missing-text note.
 */
export function MowMythicPanel({
  name,
  abilityKey,
  text,
  level,
  rarity,
  unitName,
  factionId,
}: {
  name: string
  abilityKey: string | undefined
  text: AbilityTextEntry | undefined
  /** `undefined` below Mythic. */
  level: number | undefined
  rarity: Rarity
  unitName: string
  factionId: string
}) {
  const { t } = useTranslation("library")
  return (
    <AbilityPanel
      kind={t("mowUnit.abilities.mythic")}
      name={name}
      iconSrc={abilityKey ? abilityIcon(abilityKey) : undefined}
      text={text}
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
