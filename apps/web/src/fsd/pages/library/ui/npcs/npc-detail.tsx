import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { rarityFromStars, useNpcLabels } from "@/entities/npc"

import { NpcAbilities } from "./npc-abilities"
import { NpcAttacks } from "./npc-attacks"
import { NpcDetailHeader } from "./npc-detail-header"
import { NpcStatCards } from "./npc-stat-cards"
import { NpcTraits } from "./npc-traits"
import type { NpcsPageViewProps } from "./npcs-page.view-model"

type NpcDetailProps = Pick<
  NpcsPageViewProps,
  | "selectedGroup"
  | "selectedName"
  | "variationOptions"
  | "selectedVariation"
  | "onVariationChange"
  | "levels"
  | "selectedLevel"
  | "onLevelChange"
  | "onClearFilters"
> & { compact?: boolean }

/**
 * The selected NPC's detail: header (identity + Variation / Level selectors), stat cards for the
 * selected level, attack rows, and traits. Renders the no-matching-variation state when the active
 * filters exclude every variation of the selected group.
 */
export function NpcDetail({
  selectedGroup,
  selectedName,
  variationOptions,
  selectedVariation,
  onVariationChange,
  levels,
  selectedLevel,
  onLevelChange,
  onClearFilters,
  compact = false,
}: NpcDetailProps) {
  const { t } = useTranslation("library")
  const { factionName } = useNpcLabels()

  if (!selectedGroup) return null

  if (!selectedVariation || !selectedLevel) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"
        data-testid="npcs-no-matching-variation"
      >
        <p>{t("npcs.noMatchingVariation")}</p>
        <Button variant="outline" onClick={onClearFilters}>
          {t("npcs.clearFilters")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="npc-detail">
      <NpcDetailHeader
        name={selectedName}
        factionId={selectedVariation.factionId}
        factionName={factionName(selectedVariation.factionId)}
        variationOptions={variationOptions}
        selectedVariationId={selectedVariation.id}
        onVariationChange={onVariationChange}
        levels={levels}
        selectedLevel={selectedLevel}
        onLevelChange={onLevelChange}
        compact={compact}
      />
      <NpcStatCards
        row={selectedLevel.row}
        movement={selectedVariation.movement}
        compact={compact}
      />
      <NpcAttacks variation={selectedVariation} compact={compact} />
      <NpcAbilities
        activeAbilities={selectedVariation.activeAbilities}
        passiveAbilities={selectedVariation.passiveAbilities}
        abilityLevel={selectedLevel.row.abilityLevel}
        unitName={selectedName}
        rarity={rarityFromStars(selectedLevel.row.stars)}
        compact={compact}
      />
      <NpcTraits
        traits={selectedVariation.traits}
        rarity={rarityFromStars(selectedLevel.row.stars)}
      />
    </div>
  )
}
