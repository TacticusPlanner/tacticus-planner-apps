import { useTranslation } from "react-i18next"
import { rankAt } from "@workspace/game-domain"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

import type { FarmingStrategy, GoalDetail } from "@/entities/goal"
import { additionalTargetFromWire } from "@/features/goal-farming"

import type { useGoalEditAcquisition } from "../../model/goal-edit/use-goal-edit-acquisition"
import { AcquisitionSourceField } from "../create-goal/acquisition-source-field"
import { FarmingStrategyField } from "../create-goal/farming-strategy-field"
import { GoalLocationsField } from "../create-goal/goal-locations-field"

export function GoalEditNotesField({
  notes,
  onChange,
}: {
  notes: string
  onChange: (notes: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Field className="gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor="goal-notes">{t("goals.detail.notes")}</FieldLabel>
        <span className="text-xs text-muted-foreground">
          {notes.length}/200
        </span>
      </div>
      <Textarea
        className="min-h-12"
        id="goal-notes"
        maxLength={200}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        value={notes}
      />
    </Field>
  )
}

/** The farming preferences that apply to the goal's kind: the rank strategy for Rank goals, the
 * acquisition-source tree for Unlock/Ascension, and a farming-location list for the remaining kinds. */
export function GoalEditFarmingFields({
  detail,
  farmingStrategy,
  onFarmingStrategyChange,
  selectedLocations,
  onLocationsChange,
  allLocations,
  overrideValid,
  acquisition,
  battlesById,
}: {
  detail: GoalDetail
  farmingStrategy: FarmingStrategy
  onFarmingStrategyChange: (value: FarmingStrategy) => void
  selectedLocations: string[]
  onLocationsChange: (locations: string[]) => void
  allLocations: string[]
  overrideValid: boolean
  acquisition: ReturnType<typeof useGoalEditAcquisition>
  battlesById: Parameters<typeof AcquisitionSourceField>[0]["battlesById"]
}) {
  const isRank = detail.goalType === "Rank"
  const { selection } = acquisition

  if (isRank) {
    return detail.config.rank ? (
      <FarmingStrategyField
        abilityActiveEnd={0}
        abilityActiveStart={0}
        abilityPassiveEnd={0}
        abilityPassiveStart={0}
        context="rank"
        farmingStrategy={farmingStrategy}
        onFarmingStrategyChange={onFarmingStrategyChange}
        rankAdditionalTarget={additionalTargetFromWire(
          rankAt(detail.config.rank.end),
          detail.config.rank
        )}
        rankEnd={rankAt(detail.config.rank.end)}
        rankStart={rankAt(detail.config.rank.start)}
      />
    ) : null
  }

  if (acquisition.usesAcquisitionSources) {
    return (
      <div className="col-span-full">
        <AcquisitionSourceField
          battlesById={battlesById}
          campaignEnabled={selection.campaignEnabled}
          mythicShardLocations={
            acquisition.isAscension ? selection.mythicShardLocations : []
          }
          onCampaignEnabledChange={selection.setCampaignEnabled}
          onOnslaughtEnabledChange={selection.setOnslaughtEnabled}
          onShopsEnabledChange={selection.setShopsEnabled}
          onToggleShardLocation={selection.toggleShardLocation}
          onToggleShopOffer={selection.toggleShopOffer}
          onslaughtEnabled={selection.onslaughtEnabled}
          onslaughtProgressSaved={false}
          regularShardLocations={selection.regularShardLocations}
          selectedShardLocationIds={selection.shardLocationIds}
          selectedShopOfferIds={selection.selectedShopOfferIds}
          shopOffers={acquisition.shopOffers}
          shopsEnabled={selection.shopsEnabled}
          showCampaigns={
            selection.regularShardLocations.length > 0 ||
            selection.mythicShardLocations.length > 0
          }
          showOnslaught={
            acquisition.isAscension && detail.entityType === "Character"
          }
        />
      </div>
    )
  }

  return (
    <GoalLocationsField
      allLocations={allLocations}
      isUnlock={false}
      onToggle={(battleId, checked) =>
        onLocationsChange(
          checked
            ? [...selectedLocations, battleId]
            : selectedLocations.filter((id) => id !== battleId)
        )
      }
      overrideValid={overrideValid}
      selectedLocations={selectedLocations}
    />
  )
}
