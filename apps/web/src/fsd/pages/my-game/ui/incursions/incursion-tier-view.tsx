import { useId, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { NpcStorageModel } from "@workspace/game-catalog"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  runSteps,
  tierLabels,
  tierSummary,
  type Incursion,
} from "../../model/incursions.model"
import { IncursionNodeCard } from "./incursion-node-card"

/** The tier picker, the chosen tier's totals and its run map, step by step. */
export function IncursionTierView({
  incursion,
  tierIndex,
  onTierChange,
  npcsById,
}: {
  incursion: Incursion
  tierIndex: number
  onTierChange: (index: number) => void
  npcsById: ReadonlyMap<string, NpcStorageModel>
}) {
  const { t } = useTranslation(["incursions", "progression"])
  const id = useId()
  const labels = useMemo(() => tierLabels(incursion.tiers), [incursion.tiers])
  const tier =
    incursion.tiers.find((candidate) => candidate.index === tierIndex) ??
    incursion.tiers[0]
  const view = useMemo(
    () =>
      tier
        ? {
            summary: tierSummary(incursion.mowId, tier),
            steps: runSteps(tier),
            battlesById: new Map(
              tier.battles.map((battle) => [battle.id, battle])
            ),
            namesByIndex: new Map(
              tier.nodes.map((node) => [node.index, node.name])
            ),
          }
        : undefined,
    [incursion.mowId, tier]
  )
  if (!tier || !view) return null

  const tierName = (index: number) => {
    const label = labels.get(index)
    return label
      ? t("card.tierOption", {
          rarity: t(`progression:rarities.${label.rarity}` as never, {
            defaultValue: label.rarity,
          }),
          number: label.number,
        })
      : String(index + 1)
  }
  const { summary } = view

  return (
    <div className="space-y-4" data-testid="incursion-tier">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor={id} className="text-xs text-muted-foreground">
            {t("card.tier")}
          </Label>
          <Select
            value={String(tier.index)}
            onValueChange={(value) => onTierChange(Number(value))}
          >
            <SelectTrigger
              id={id}
              className="w-44"
              data-testid="incursion-tier-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {incursion.tiers.map((candidate) => (
                <SelectItem
                  key={candidate.index}
                  value={String(candidate.index)}
                >
                  {tierName(candidate.index)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ul
          className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground tabular-nums"
          data-testid="incursion-tier-summary"
        >
          <li>{t("summary.battles", { count: summary.battles })}</li>
          {summary.challenges > 0 ? (
            <li>{t("summary.challenges", { count: summary.challenges })}</li>
          ) : null}
          <li>{t("summary.chests", { count: summary.chests })}</li>
          <li>{t("summary.enhancements", { count: summary.enhancements })}</li>
        </ul>
      </div>
      <p
        className="text-sm font-medium"
        title={t("summary.bestPathHint")}
        data-testid="incursion-best-path"
      >
        {summary.bestPath.mythicShards > 0
          ? t("summary.bestPathMythic", summary.bestPath)
          : t("summary.bestPath", { shards: summary.bestPath.shards })}
        <span className="block text-xs font-normal text-muted-foreground">
          {t("summary.bestPathHint")}
        </span>
      </p>

      <section className="space-y-3" aria-label={t("map.title")}>
        <h4 className="text-sm font-semibold">{t("map.title")}</h4>
        <ol className="space-y-3">
          {view.steps.map((step, at) => {
            const branched = (view.steps[at - 1]?.nodes.length ?? 0) > 1
            return (
              <li
                key={step.depth}
                className="space-y-2"
                data-testid={`incursion-step-${step.depth}`}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">
                    {t("map.step", { number: at + 1 })}
                  </span>
                  {step.choice ? (
                    <span data-testid="incursion-step-choice">
                      · {t("map.pickOne")}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {step.nodes.map((node) => (
                    <IncursionNodeCard
                      key={node.index}
                      node={node}
                      incursion={incursion}
                      battlesById={view.battlesById}
                      npcsById={npcsById}
                      after={
                        branched && node.unlockedBy.length > 0
                          ? node.unlockedBy
                              .map((parent) => view.namesByIndex.get(parent))
                              .filter(Boolean)
                              .join(", ")
                          : undefined
                      }
                    />
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
