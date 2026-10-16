import { useTranslation } from "react-i18next"
import {
  abilityIcon,
  equipmentSlotIcon,
  type EquipmentStorageModel,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import type { AbilityTextEntry } from "@/shared/ability-text"

import { AbilityPanel } from "../unit/ability-panel"
import { DetailsCard } from "./character-details-sections"

const RELIC_MAX_LEVEL = 10

/** Static class names (Tailwind can't see built ones) for a relic's rarity-coloured frame. */
const RARITY_BORDER: Record<Rarity, string> = {
  Common: "border-(--rarity-common)",
  Uncommon: "border-(--rarity-uncommon)",
  Rare: "border-(--rarity-rare)",
  Epic: "border-(--rarity-epic)",
  Legendary: "border-(--rarity-legendary)",
  Mythic: "border-(--rarity-mythic)",
}

/**
 * The Relic panel: unique or shared (naming the other characters for a shared one), the relic's
 * art in a rarity-coloured frame, and its rules text by level. A character without a relic gets a
 * card saying so.
 */
export function RelicPanel({
  relic,
  characterId,
  unitName,
  factionId,
  text,
  level,
  playerLevel,
  onLevelChange,
  nameOf,
}: {
  relic: EquipmentStorageModel | undefined
  characterId: string
  unitName: string
  factionId: string
  text: AbilityTextEntry | undefined
  level: number
  playerLevel?: number
  onLevelChange: (level: number) => void
  nameOf: (unitId: string) => string
}) {
  const { t } = useTranslation(["library", "equipmentItems"])
  if (!relic)
    return (
      <DetailsCard
        title={t("characterUnit.relic.kind")}
        data-testid="unit-relic"
      >
        <p
          className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
          data-testid="unit-relic-none"
        >
          {t("characterUnit.relic.none", { name: unitName })}
        </p>
      </DetailsCard>
    )

  const sharedWith = relic.allowedUnits.filter((id) => id !== characterId)
  const icon = abilityIcon(relic.abilityId)
  return (
    <AbilityPanel
      kind={t(
        relic.isUniqueRelic
          ? "characterUnit.relic.unique"
          : "characterUnit.relic.shared"
      )}
      note={
        !relic.isUniqueRelic && sharedWith.length > 0
          ? t("characterUnit.relic.sharedWith", {
              names: sharedWith.map(nameOf).join(", "),
            })
          : undefined
      }
      name={t(`equipmentItems:${relic.id}`, { defaultValue: relic.name })}
      iconSrc={icon ?? equipmentSlotIcon(relic.type)}
      // The relic's ability art is round, so its frame is too; the slot fallback is square.
      iconClassName={cn(
        "size-11 shrink-0 border-2",
        icon ? "rounded-full" : "rounded-md",
        RARITY_BORDER[relic.rarity]
      )}
      text={text}
      rarity={relic.rarity}
      unitName={unitName}
      factionId={factionId}
      level={level}
      onLevelChange={onLevelChange}
      maxLevel={RELIC_MAX_LEVEL}
      playerLevel={playerLevel}
      chartFromZero={false}
      headingLevel="h2"
      data-testid="unit-relic"
    />
  )
}
