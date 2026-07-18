import { useRef, useState } from "react"
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
import { ASSET_BASE_PATH } from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"

import type { AscensionFarmingSource } from "@/entities/goal"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { EntityType } from "../model/use-create-goal-form"
import type { useProgressionPreview } from "../model/use-progression-preview"
import {
  AbilityGoalFields,
  AscensionGoalFields,
  type EstimatePreview,
  type MissingUpgrade,
} from "./goal-type-fields"

const sources: AscensionFarmingSource[] = ["Campaign", "Onslaught", "Both"]

export function AscensionFarmingFields({
  progressionStart,
  progressionEnd,
  progressionStartOptions,
  onProgressionStartChange,
  onProgressionEndChange,
  ascensionFarmingSource,
  onAscensionFarmingSourceChange,
  progressionPreview,
}: {
  progressionStart: Progression
  progressionEnd: Progression
  progressionStartOptions: readonly Progression[]
  onProgressionStartChange: (value: Progression) => void
  onProgressionEndChange: (value: Progression) => void
  ascensionFarmingSource: AscensionFarmingSource
  onAscensionFarmingSourceChange: (value: AscensionFarmingSource) => void
  progressionPreview: ProgressionPreviewResult
}) {
  const { t } = useTranslation()
  const sourceTriggerRef = useRef<HTMLButtonElement>(null)
  const [sourceContainer, setSourceContainer] = useState<HTMLElement>()
  return (
    <div className="grid gap-3">
      <AscensionGoalFields
        progressionStart={progressionStart}
        progressionEnd={progressionEnd}
        progressionStartOptions={progressionStartOptions}
        onProgressionStartChange={onProgressionStartChange}
        onProgressionEndChange={onProgressionEndChange}
      />
      <div className="grid gap-1.5">
        <Label>{t("goals.create.ascension.source")}</Label>
        {/* Radix Dialog/Sheet's scroll lock sets `pointer-events: none` on `document.body` while
            open, only re-enabling it on its own content node — a Select portaled to the default
            `document.body` is neither, so it's unclickable while this Sheet is open. Resolving the
            nearest enclosing Sheet content node at open time keeps the popover inside the lock's
            own subtree (mirrors `UpgradeGoalFields`'/`UnitCombobox`'s own copy of this fix). */}
        <Select
          onOpenChange={(open) => {
            if (open) {
              setSourceContainer(
                (sourceTriggerRef.current?.closest(
                  '[data-slot="sheet-content"]'
                ) as HTMLElement | null) ?? undefined
              )
            }
          }}
          value={ascensionFarmingSource}
          onValueChange={(value) =>
            onAscensionFarmingSourceChange(value as AscensionFarmingSource)
          }
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-ascension-source"
            ref={sourceTriggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={sourceContainer}>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {t(`goals.create.ascension.${source}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {ascensionFarmingSource !== "Campaign" ? (
        <p className="text-sm text-muted-foreground">
          {t("goals.create.ascension.onslaughtProgressHint")}{" "}
          <Link className="font-medium text-primary underline" to="/onslaught">
            {t("goals.create.ascension.editOnslaughtProgress")}
          </Link>
        </p>
      ) : null}
      <ProgressionPreview preview={progressionPreview} />
    </div>
  )
}

type ProgressionPreviewResult = ReturnType<typeof useProgressionPreview>

export function ProgressionPreview({
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
      {preview.campaign?.status === "Estimated" ? (
        <p className="flex items-center gap-1.5">
          <EntityIcon alt="" className="size-5 shrink-0" src={energyIconUrl} />
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

export function AbilityTrackFields({
  entityType,
  abilityTrack,
  onAbilityTrackChange,
  abilityActiveStart,
  abilityActiveEnd,
  abilityPassiveStart,
  abilityPassiveEnd,
  onAbilityActiveStartChange,
  onAbilityActiveEndChange,
  onAbilityPassiveStartChange,
  onAbilityPassiveEndChange,
  missingUpgrades,
  estimate,
  dailyEnergy,
}: {
  entityType: EntityType
  abilityTrack: "first" | "second"
  onAbilityTrackChange: (value: "first" | "second") => void
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  onAbilityActiveStartChange: (value: number) => void
  onAbilityActiveEndChange: (value: number) => void
  onAbilityPassiveStartChange: (value: number) => void
  onAbilityPassiveEndChange: (value: number) => void
  missingUpgrades: MissingUpgrade[]
  estimate: EstimatePreview | null
  dailyEnergy: number
}) {
  const { t } = useTranslation()
  const trackTriggerRef = useRef<HTMLButtonElement>(null)
  const [trackContainer, setTrackContainer] = useState<HTMLElement>()
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>{t("goals.create.ability.track")}</Label>
        <Select
          onOpenChange={(open) => {
            if (open) {
              setTrackContainer(
                (trackTriggerRef.current?.closest(
                  '[data-slot="sheet-content"]'
                ) as HTMLElement | null) ?? undefined
              )
            }
          }}
          value={abilityTrack}
          onValueChange={(value) =>
            onAbilityTrackChange(value as "first" | "second")
          }
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-ability-track"
            ref={trackTriggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={trackContainer}>
            <SelectItem value="first">
              {t(
                entityType === "Mow"
                  ? "goals.create.ability.primary"
                  : "goals.create.ability.active"
              )}
            </SelectItem>
            <SelectItem value="second">
              {t(
                entityType === "Mow"
                  ? "goals.create.ability.secondary"
                  : "goals.create.ability.passive"
              )}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <AbilityGoalFields
        activeStart={abilityActiveStart}
        activeEnd={abilityActiveEnd}
        passiveStart={abilityPassiveStart}
        passiveEnd={abilityPassiveEnd}
        onActiveStartChange={onAbilityActiveStartChange}
        onActiveEndChange={onAbilityActiveEndChange}
        onPassiveStartChange={onAbilityPassiveStartChange}
        onPassiveEndChange={onAbilityPassiveEndChange}
        missingUpgrades={missingUpgrades}
        estimate={estimate}
        dailyEnergy={dailyEnergy}
        costingSupported={entityType === "Mow"}
      />
    </div>
  )
}
