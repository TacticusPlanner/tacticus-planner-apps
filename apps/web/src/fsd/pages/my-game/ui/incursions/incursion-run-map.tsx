import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { NpcStorageModel } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { TierStars } from "../../model/incursion-progress.model"
import {
  enhancementSubject,
  type Incursion,
  type IncursionBattle,
  type IncursionNode,
  type IncursionTier,
  type RunStep,
  nodeName,
} from "../../model/incursions.model"
import { IncursionNodeCard } from "./incursion-node-card"
import { IncursionNodeMarker } from "./incursion-node-marker"
import { neighbours } from "./incursions-outlet"

/**
 * The tier's run map as a compact picker, one row per step like the game's map, beside the chosen
 * node's details (enemies, board, rewards, stars) with prev/next through the nodes in map order.
 * Opens on the first battle short of 3 stars; mount it with a `key` per tier.
 */
export function IncursionRunMap({
  incursion,
  tier,
  steps,
  battlesById,
  npcsById,
  stars,
  onStarsChange,
  battlePowers,
  teamPower,
}: {
  incursion: Incursion
  tier: IncursionTier
  steps: readonly RunStep[]
  battlesById: ReadonlyMap<string, IncursionBattle>
  npcsById: ReadonlyMap<string, NpcStorageModel>
  stars?: TierStars
  onStarsChange?: (battleId: string, stars: number) => void
  battlePowers?: ReadonlyMap<string, number>
  teamPower?: number
}) {
  const { t } = useTranslation(["incursions", "traits"])
  const nodeLabel = (node: IncursionNode) => {
    if (node.kind === "battle")
      return t("battle.name", { name: nodeName(node) })
    if (node.kind === "chest") {
      const type = node.chest?.type ?? ""
      return t("chest.title", {
        type: t(`chest.type.${type}` as never, { defaultValue: type }),
      })
    }
    const enhancement = incursion.enhancements[node.enhancementId ?? ""]
    if (!enhancement) return node.name
    const subject = enhancementSubject(enhancement)
    return t(`enhancement.type.${enhancement.type}` as never, {
      defaultValue: enhancement.type,
      count: enhancement.unitAmount ?? 1,
      units: enhancement.unitAmount ?? 1,
      subject: subject ? t(`traits:${subject}`, { defaultValue: subject }) : "",
    })
  }
  const nodes = steps.flatMap((step) => step.nodes)
  // Opens on the first battle still short of 3 stars (mount with a `key` per tier).
  const [pickedIndex, setPickedIndex] = useState(
    () =>
      nodes.find(
        (node) =>
          node.kind === "battle" &&
          node.battleId &&
          (stars?.(tier.index, node.battleId) ?? 0) < 3
      )?.index
  )
  const selected = nodes.find((node) => node.index === pickedIndex) ?? nodes[0]
  const onSelect = (node: IncursionNode) => setPickedIndex(node.index)
  const at = selected ? nodes.indexOf(selected) : -1
  const { previous, next } = neighbours(nodes, at)
  const namesByIndex = new Map(
    nodes.map((node) => [node.index, nodeName(node)])
  )
  const starsOf = (node: IncursionNode) =>
    stars && node.kind === "battle" && node.battleId
      ? stars(tier.index, node.battleId)
      : undefined
  if (!selected) return null
  const selectedBattleId =
    selected.kind === "battle" ? selected.battleId : undefined
  const selectedStars = starsOf(selected)
  const stepOf = (node: IncursionNode) =>
    steps.findIndex((step) => step.nodes.includes(node))
  const branched = (steps[stepOf(selected) - 1]?.nodes.length ?? 0) > 1

  return (
    <section
      className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
      aria-label={t("map.title")}
    >
      <div className="lg:sticky lg:top-4 lg:self-start">
        <h3 className="mb-2 text-sm font-semibold">{t("map.title")}</h3>
        <ol
          className="max-h-[60vh] space-y-1 overflow-y-auto rounded-lg border bg-muted/30 p-2 lg:max-h-[calc(100vh-8rem)]"
          data-testid="incursion-map"
        >
          {steps.map((step, index) => (
            <li
              key={step.depth}
              className="flex items-center gap-2"
              data-testid={`incursion-step-${step.depth}`}
            >
              <span className="w-6 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {step.nodes.map((node, position) => {
                  const battle = node.battleId
                    ? battlesById.get(node.battleId)
                    : undefined
                  return (
                    <Fragment key={node.index}>
                      {position > 0 && step.choice ? (
                        <span
                          className="text-[10px] text-muted-foreground uppercase"
                          data-testid="incursion-step-choice"
                        >
                          {t("map.or")}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        aria-pressed={node === selected}
                        aria-label={nodeLabel(node)}
                        title={nodeLabel(node)}
                        onClick={() => onSelect(node)}
                        className={cn(
                          "rounded-md p-0.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          node === selected &&
                            "bg-accent ring-2 ring-(--primary)"
                        )}
                        data-testid={`incursion-map-node-${node.index}`}
                      >
                        <IncursionNodeMarker
                          node={node}
                          incursion={incursion}
                          challenge={battle?.challenge ?? false}
                          stars={starsOf(node)}
                          size="sm"
                        />
                      </button>
                    </Fragment>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("map.step", { number: stepOf(selected) + 1 })}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={!previous}
              onClick={() => previous && onSelect(previous)}
              data-testid="incursion-node-previous"
            >
              <ChevronLeft aria-hidden="true" />
              {t("nav.previous")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!next}
              onClick={() => next && onSelect(next)}
              data-testid="incursion-node-next"
            >
              {t("nav.next")}
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        <IncursionNodeCard
          node={selected}
          incursion={incursion}
          battlesById={battlesById}
          npcsById={npcsById}
          progress={
            selectedBattleId && selectedStars !== undefined && onStarsChange
              ? {
                  stars: selectedStars,
                  onChange: (value) => onStarsChange(selectedBattleId, value),
                }
              : undefined
          }
          power={
            selectedBattleId ? battlePowers?.get(selectedBattleId) : undefined
          }
          teamPower={teamPower}
          after={
            branched && selected.unlockedBy.length > 0
              ? selected.unlockedBy
                  .map((parent) => namesByIndex.get(parent))
                  .filter(Boolean)
                  .join(", ")
              : undefined
          }
        />
      </div>
    </section>
  )
}
