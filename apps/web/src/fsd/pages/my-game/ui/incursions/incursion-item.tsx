import { useState } from "react"
import { useTranslation } from "react-i18next"
import { factionIcon, mowIcon } from "@workspace/game-catalog"
import type { NpcStorageModel } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"

import { useDateLocale } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import {
  clearedTierCount,
  nextTierIndex,
} from "../../model/incursion-progress.model"
import type { Incursion } from "../../model/incursions.model"
import { IncursionProgressControl } from "./incursion-progress-control"
import { IncursionTierView, type TierProgress } from "./incursion-tier-view"

/**
 * One MoW's Incursion as an accordion row: its header, the player's progress, allowed factions and
 * tier explorer. The explorer opens on the next tier to play until the player picks another.
 */
export function IncursionItem({
  incursion,
  owned,
  npcsById,
  progress,
}: {
  incursion: Incursion
  owned: boolean
  npcsById: ReadonlyMap<string, NpcStorageModel>
  progress?: TierProgress
}) {
  const { t } = useTranslation(["incursions", "mows", "factions"])
  const dateLocale = useDateLocale()
  const [pickedTier, setPickedTier] = useState<number | null>(null)
  const tierIndex =
    pickedTier ?? nextTierIndex(incursion, progress?.stars ?? (() => 0))
  const testId = `incursion-${incursion.mowId}`
  const name = t(`mows:${incursion.mowId}`, { defaultValue: incursion.mowId })
  const firstRun = new Date(incursion.availableFromUtc).toLocaleDateString(
    dateLocale,
    { dateStyle: "medium" }
  )

  return (
    <AccordionItem value={incursion.mowId} data-testid={testId}>
      <AccordionTrigger
        className="items-center hover:no-underline"
        data-testid={`${testId}-trigger`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <EntityIcon
            src={mowIcon(incursion.mowId as UnitId)}
            alt=""
            className="size-10 shrink-0 rounded"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{name}</span>
              {incursion.new ? <Badge>{t("card.new")}</Badge> : null}
              {incursion.updated ? (
                <Badge variant="secondary">{t("card.revamped")}</Badge>
              ) : null}
              <Badge
                variant="outline"
                className={owned ? undefined : "text-muted-foreground"}
                data-testid={`${testId}-owned`}
              >
                {owned ? t("card.owned") : t("card.notOwned")}
              </Badge>
              {progress ? (
                <Badge
                  variant="outline"
                  className="tabular-nums"
                  data-testid={`${testId}-cleared`}
                >
                  {t("progress.badge", {
                    cleared: clearedTierCount(incursion, progress.stars),
                    total: incursion.tiers.length,
                  })}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("card.firstRun", { date: firstRun })}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        {progress ? (
          <IncursionProgressControl
            incursion={incursion}
            stars={progress.stars}
          />
        ) : null}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("card.allowedFactions")}</h4>
          <ul
            className="flex flex-wrap gap-1.5"
            data-testid={`${testId}-factions`}
          >
            {incursion.allowedFactions.map((faction) => {
              const label = t(`factions:${faction}`, { defaultValue: faction })
              return (
                <li key={faction} title={label}>
                  <EntityIcon
                    src={factionIcon(faction)}
                    alt={label}
                    className="size-7"
                  />
                </li>
              )
            })}
          </ul>
        </div>
        <IncursionTierView
          incursion={incursion}
          tierIndex={tierIndex}
          onTierChange={setPickedTier}
          npcsById={npcsById}
          progress={progress}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
