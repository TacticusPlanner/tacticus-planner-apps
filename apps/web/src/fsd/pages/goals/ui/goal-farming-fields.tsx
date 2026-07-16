import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { AscensionFarmingSource, FarmingStrategy } from "@/entities/goal"
import type { useCreateGoalForm } from "../model/use-create-goal-form"
import { AbilityGoalFields, AscensionGoalFields } from "./goal-type-fields"

type GoalForm = ReturnType<typeof useCreateGoalForm>

const strategies: FarmingStrategy[] = [
  "TotalUpgrades",
  "EveryStep",
  "Milestones",
  "MajorMilestones",
]
const sources: AscensionFarmingSource[] = ["Campaign", "Onslaught", "Both"]

export function AscensionFarmingFields({ form }: { form: GoalForm }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3">
      <AscensionGoalFields
        progressionStart={form.progressionStart}
        progressionEnd={form.progressionEnd}
        progressionStartOptions={form.progressionStartOptions}
        onProgressionStartChange={form.setProgressionStart}
        onProgressionEndChange={form.setProgressionEnd}
      />
      <div className="grid gap-1.5">
        <Label>{t("goals.create.ascension.source")}</Label>
        <Select
          value={form.ascensionFarmingSource}
          onValueChange={(value) =>
            form.setAscensionFarmingSource(value as AscensionFarmingSource)
          }
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-ascension-source"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {t(`goals.create.ascension.${source}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {form.ascensionFarmingSource !== "Campaign" ? (
        <p className="text-sm text-muted-foreground">
          {t("goals.create.ascension.onslaughtProgressHint")}{" "}
          <Link className="font-medium text-primary underline" to="/onslaught">
            {t("goals.create.ascension.editOnslaughtProgress")}
          </Link>
        </p>
      ) : null}
      <ProgressionPreview form={form} />
    </div>
  )
}

export function ProgressionPreview({ form }: { form: GoalForm }) {
  const { t } = useTranslation()
  const preview = form.progressionPreview
  if (!preview) return null
  return (
    <div
      className="grid gap-1 rounded-2xl border p-3 text-sm"
      data-testid="create-goal-progression-preview"
    >
      <p className="font-medium">{t("goals.create.previewTitle")}</p>
      <p>
        {t("goals.create.ascension.shards", {
          regular: preview.regularShards,
          mythic: preview.mythicShards,
        })}
      </p>
      {Object.entries(preview.orbsByType).map(([rarity, count]) => (
        <p key={rarity}>
          {rarity} {t("goals.create.ascension.orbs", { count })}
        </p>
      ))}
      {preview.campaign?.status === "Estimated" ? (
        <p>
          {t("goals.create.ascension.campaignEstimate", {
            energy: preview.campaign.energyTotal,
            raids: preview.campaign.raidsTotal,
            days: preview.campaign.days,
          })}
        </p>
      ) : null}
      {preview.onslaughtTokens > 0 ? (
        <p>
          {t("goals.create.ascension.onslaughtEstimate", {
            tokens: preview.onslaughtTokens,
            days: preview.onslaughtDays.toFixed(1),
          })}
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

export function AbilityTrackFields({ form }: { form: GoalForm }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>{t("goals.create.ability.track")}</Label>
        <Select
          value={form.abilityTrack}
          onValueChange={(value) =>
            form.setAbilityTrack(value as "first" | "second")
          }
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-ability-track"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">
              {t(
                form.entityType === "Mow"
                  ? "goals.create.ability.primary"
                  : "goals.create.ability.active"
              )}
            </SelectItem>
            <SelectItem value="second">
              {t(
                form.entityType === "Mow"
                  ? "goals.create.ability.secondary"
                  : "goals.create.ability.passive"
              )}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <AbilityGoalFields
        activeStart={form.abilityActiveStart}
        activeEnd={form.abilityActiveEnd}
        passiveStart={form.abilityPassiveStart}
        passiveEnd={form.abilityPassiveEnd}
        onActiveStartChange={form.setAbilityActiveStart}
        onActiveEndChange={form.setAbilityActiveEnd}
        onPassiveStartChange={form.setAbilityPassiveStart}
        onPassiveEndChange={form.setAbilityPassiveEnd}
        missingUpgrades={form.missingUpgrades}
        estimate={form.estimatePreview}
        dailyEnergy={form.planningSettings.dailyEnergy}
        costingSupported={form.entityType === "Mow"}
      />
    </div>
  )
}

export function FarmingStrategyField({ form }: { form: GoalForm }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-1.5">
      <Label>{t("goals.create.farmingStrategy.label")}</Label>
      <Select
        value={form.farmingStrategy}
        onValueChange={(value) =>
          form.setFarmingStrategy(value as FarmingStrategy)
        }
      >
        <SelectTrigger
          className="w-full"
          data-testid="create-goal-farming-strategy"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {strategies.map((strategy) => (
            <SelectItem key={strategy} value={strategy}>
              {t(`goals.create.farmingStrategy.${strategy}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
