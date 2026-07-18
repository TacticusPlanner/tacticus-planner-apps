import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { rankAt, rankIndex, type Rank } from "@workspace/game-domain"

import type { FarmingStrategy } from "@/entities/goal"
import { RankBadge } from "@/shared/ui"
import { farmingStageTargets } from "../model/farming-stages"

const strategies: FarmingStrategy[] = [
  "TotalUpgrades",
  "EveryStep",
  "Milestones",
  "MajorMilestones",
]

// Above this many checkpoints the chain collapses to first ⋯ last — mainly for "Every step" over a
// long range, where showing every single stop would overflow the sheet.
const MAX_VISIBLE_STAGES = 6

/** The Farming Strategy select plus a live preview of what it actually produces: the checkpoint
 * chain from the current start to the current end (mirrors the backend's `MilestoneGenerator` via
 * the shared `farmingStageTargets` calc, so this is never just illustrative — it's the real
 * breakpoints this goal will get) and a one-line explanation of the selected strategy. `context`
 * picks the checkpoint unit (rank vs Mow ability level) and which of the caller's start/end pairs
 * to chart — for Ability, the track that's actually growing (mirrors the backend's own
 * `ActiveEnd > ActiveStart` pick in `CreateGoalEndpoint`). Split out of `goal-farming-fields.tsx`
 * purely for that file's own max-lines budget. */
export function FarmingStrategyField({
  context,
  rankStart,
  rankEnd,
  abilityActiveStart,
  abilityActiveEnd,
  abilityPassiveStart,
  abilityPassiveEnd,
  farmingStrategy,
  onFarmingStrategyChange,
}: {
  context: "rank" | "ability"
  rankStart: Rank
  rankEnd: Rank
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  farmingStrategy: FarmingStrategy
  onFarmingStrategyChange: (value: FarmingStrategy) => void
}) {
  const { t } = useTranslation()
  const strategyTriggerRef = useRef<HTMLButtonElement>(null)
  const [strategyContainer, setStrategyContainer] = useState<HTMLElement>()

  const [start, end] =
    context === "rank"
      ? [rankIndex(rankStart), rankIndex(rankEnd)]
      : abilityActiveEnd > abilityActiveStart
        ? [abilityActiveStart, abilityActiveEnd]
        : [abilityPassiveStart, abilityPassiveEnd]

  const targets = farmingStageTargets(context, start, end, farmingStrategy)
  const chain = targets.length > 0 ? [start, ...targets] : []

  return (
    <div className="grid gap-1.5">
      <Label>{t("goals.create.farmingStrategy.label")}</Label>
      <Select
        onOpenChange={(open) => {
          if (open) {
            setStrategyContainer(
              (strategyTriggerRef.current?.closest(
                '[data-slot="sheet-content"]'
              ) as HTMLElement | null) ?? undefined
            )
          }
        }}
        value={farmingStrategy}
        onValueChange={(value) =>
          onFarmingStrategyChange(value as FarmingStrategy)
        }
      >
        <SelectTrigger
          className="w-full"
          data-testid="create-goal-farming-strategy"
          ref={strategyTriggerRef}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={strategyContainer}>
          {strategies.map((strategy) => (
            <SelectItem key={strategy} value={strategy}>
              {t(`goals.create.farmingStrategy.${strategy}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {chain.length > 0 ? (
        <div
          className="grid gap-2 rounded-2xl border p-3"
          data-testid="create-goal-farming-strategy-preview"
        >
          <div className="flex flex-wrap items-center gap-1">
            {renderStageChain(context, chain)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(`goals.create.farmingStrategy.explanation.${farmingStrategy}`, {
              count: targets.length,
              unit: t(`goals.create.farmingStrategy.unit.${context}`),
            })}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function renderStageChain(
  context: "rank" | "ability",
  chain: number[]
): ReactNode[] {
  const shown: (number | null)[] =
    chain.length <= MAX_VISIBLE_STAGES
      ? chain
      : [chain[0]!, null, chain[chain.length - 1]!]

  return shown.flatMap((point, index) => {
    const nodes: ReactNode[] = []
    if (index > 0) {
      nodes.push(
        <ArrowRight
          className="size-3.5 shrink-0 text-muted-foreground"
          key={`arrow-${index}`}
        />
      )
    }
    nodes.push(
      point === null ? (
        <span
          className="px-0.5 text-muted-foreground"
          key={`ellipsis-${index}`}
        >
          ⋯
        </span>
      ) : context === "rank" ? (
        <RankBadge
          className="shrink-0"
          iconClassName="size-6"
          key={`stage-${index}`}
          rank={rankAt(point)}
          showLabel={false}
        />
      ) : (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
          key={`stage-${index}`}
        >
          {point}
        </span>
      )
    )
    return nodes
  })
}
