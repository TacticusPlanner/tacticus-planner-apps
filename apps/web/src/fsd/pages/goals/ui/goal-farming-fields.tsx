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
import type { useProgressionPreview } from "../model/use-progression-preview"
import { AscensionGoalFields } from "./goal-type-fields"

const sources: AscensionFarmingSource[] = ["Campaign", "Onslaught", "Both"]

export function AscensionFarmingFields({
  progressionStart,
  progressionEnd,
  onProgressionEndChange,
  ascensionFarmingSource,
  onAscensionFarmingSourceChange,
  progressionPreview,
}: {
  progressionStart: Progression
  progressionEnd: Progression
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
