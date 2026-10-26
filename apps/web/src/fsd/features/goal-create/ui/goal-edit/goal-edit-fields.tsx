import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import type { GoalDetail } from "@/entities/goal"
import type { useGoalEditAcquisition } from "../../model/goal-edit/use-goal-edit-acquisition"
import { AcquisitionSourceField } from "../create-goal/acquisition-source-field"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { InfoHint } from "../shared/info-hint"

export function GoalEditNotesField({
  notes,
  onChange,
}: {
  notes: string
  onChange: (notes: string) => void
}) {
  const { t } = useTranslation()
  // Creation renders one per goal type card, so the id must be unique.
  const id = useId()

  return (
    <Field className="gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{t("goals.detail.notes")}</FieldLabel>
        <span className="text-xs text-muted-foreground">
          {notes.length}/200
        </span>
      </div>
      <Textarea
        className="min-h-12"
        id={id}
        maxLength={200}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        value={notes}
      />
    </Field>
  )
}

/** The farming preferences that apply to the goal's kind, beyond the Rank strategy its card shows: the
 * acquisition-source tree for Unlock/Ascension, and a farming-location list for the remaining kinds. */
export function GoalEditFarmingFields({
  detail,
  selectedLocations,
  onLocationsChange,
  allLocations,
  overrideValid,
  acquisition,
  battlesById,
}: {
  detail: GoalDetail
  selectedLocations: string[]
  onLocationsChange: (locations: string[]) => void
  allLocations: string[]
  overrideValid: boolean
  acquisition: ReturnType<typeof useGoalEditAcquisition>
  battlesById: Parameters<typeof AcquisitionSourceField>[0]["battlesById"]
}) {
  const { selection } = acquisition

  if (detail.goalType === "Rank") return null

  if (acquisition.usesAcquisitionSources) {
    return (
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
        onslaughtCurrentIsMythic={acquisition.onslaught.currentIsMythic}
        onslaughtEnabled={selection.onslaughtEnabled}
        onslaughtProgressSaved={acquisition.onslaught.progressSaved}
        onslaughtShardsPerDay={acquisition.onslaught.shardsPerDay}
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

/**
 * Checkbox list of a goal's farmable locations — either upgrade farm nodes (most costed goal types)
 * or a character's shard-drop nodes (Unlock, picked via `isUnlock`).
 */
function GoalLocationsField({
  isUnlock,
  allLocations,
  selectedLocations,
  overrideValid,
  onToggle,
}: {
  isUnlock: boolean
  allLocations: string[]
  selectedLocations: string[]
  overrideValid: boolean
  onToggle: (battleId: string, checked: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <section className="grid gap-1.5" data-testid="goal-edit-locations">
      <h3 className="flex items-center gap-1.5 font-semibold">
        {t(isUnlock ? "goals.detail.shardsTitle" : "goals.detail.farmingTitle")}
        <InfoHint
          text={t(
            isUnlock
              ? "goals.detail.shardsDescription"
              : "goals.detail.farmingDescription"
          )}
        />
      </h3>
      {allLocations.length === 0 ? (
        <p
          className="text-muted-foreground"
          data-testid="goal-edit-locations-empty"
        >
          {t("goals.detail.farmingEmpty")}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {allLocations.map((battleId) => (
          <label className="flex items-center gap-2" key={battleId}>
            <Checkbox
              checked={selectedLocations.includes(battleId)}
              onCheckedChange={(checked) =>
                onToggle(battleId, checked === true)
              }
            />
            {battleId}
          </label>
        ))}
      </div>
      {!overrideValid ? (
        <p className="text-destructive">{t("goals.detail.farmingInvalid")}</p>
      ) : null}
    </section>
  )
}
