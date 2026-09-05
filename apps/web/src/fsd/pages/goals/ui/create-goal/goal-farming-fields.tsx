import { useTranslation } from "react-i18next"
import { ASSET_BASE_PATH } from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"

import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { useProgressionPreview } from "../../model/goal-creation-form/use-progression-preview"
import { AscensionGoalFields } from ".//goal-type-fields"

export function AscensionFarmingFields({
  progressionStart,
  progressionEnd,
  onProgressionEndChange,
  progressionPreview,
}: {
  progressionStart: Progression
  progressionEnd: Progression
  onProgressionEndChange: (value: Progression) => void
  progressionPreview: ProgressionPreviewResult
}) {
  return (
    <div className="grid gap-3">
      <AscensionGoalFields
        progressionStart={progressionStart}
        progressionEnd={progressionEnd}
        onProgressionEndChange={onProgressionEndChange}
      />
      <ProgressionPreview preview={progressionPreview} />
    </div>
  )
}

type ProgressionPreviewResult = ReturnType<typeof useProgressionPreview>

function ProgressionPreview({
  preview,
}: {
  preview: ProgressionPreviewResult
}) {
  const { t } = useTranslation()
  if (!preview) return null
  return (
    <div
      className="grid gap-1 rounded-2xl border p-3 text-sm"
      data-testid="create-goal-progression-preview"
    >
      <p className="font-medium">{t("goals.create.previewTitle")}</p>
      <p className="flex items-center gap-1.5">
        <EntityIcon
          alt=""
          className="size-5"
          src={`${ASSET_BASE_PATH}/misc/ui_icon_character_shard_empty.png`}
        />
        {t("goals.create.ascension.shards", {
          regular: preview.regularShards,
          mythic: preview.mythicShards,
        })}
      </p>
      {Object.entries(preview.orbsByType).map(([rarity, count]) => (
        <p className="flex items-center gap-1.5" key={rarity}>
          <EntityIcon
            alt=""
            className="size-6"
            src={`${ASSET_BASE_PATH}/resources/ui_hero_ascension_orbs_${rarity.toLowerCase()}.png`}
          />
          {rarity} {t("goals.create.ascension.orbs", { count })}
        </p>
      ))}
      {/* Ascension's own energy-for-remaining-shards line (plan: shard-location selector) —
          isolated to Ascension's net regular-shard need, distinct from the combined `preview`
          below (which also folds in an enabled Unlock's own shard need, plus every selected
          acquisition source, for the shared farm-day simulation). */}
      {preview.ascensionShardEnergy ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <EntityIcon alt="" className="size-5 shrink-0" src={energyIconUrl} />
          {preview.ascensionShardEnergy.status === "Blocked"
            ? t(`goals.estimate.blocked.${preview.ascensionShardEnergy.reason}`)
            : t("goals.create.shardLocations.remainingEnergy", {
                energy: preview.ascensionShardEnergy.energyTotal,
              })}
        </p>
      ) : null}
      {preview.combined?.status === "Estimated" ? (
        <p className="flex items-center gap-1.5">
          <EntityIcon alt="" className="size-5 shrink-0" src={energyIconUrl} />
          {t("goals.create.acquisitionSources.combinedEstimate", {
            energy: preview.combined.energyTotal,
            raids: preview.combined.raidsTotal,
            days: preview.combined.days,
          })}
        </p>
      ) : preview.combined?.status === "Blocked" ? (
        <p className="text-muted-foreground">
          {t(`goals.estimate.blocked.${preview.combined.reason}`)}
        </p>
      ) : null}
      <p className="font-medium">
        {t("goals.create.ascension.combinedEstimate", {
          days: preview.combinedDays.toFixed(1),
        })}
      </p>
    </div>
  )
}
