import { useMemo, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { rankOrder, type Rank } from "@workspace/game-domain"

import type { FarmingStrategy } from "@/entities/goal"
import type { RankAdditionalTarget } from "@/features/goal-farming/@x/goal-create"
import { closestOverlayContent } from "@/shared/ui"

import { rankEndKey } from "../../model/goal-creation-form/first-free-target"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { FarmingStrategyField } from "../create-goal/farming-strategy-field"
import { FieldIssues } from "../create-goal/goal-form-issues"
import { fieldIssueProps } from "../create-goal/goal-form-issue-ids"
import {
  AdditionalTargetLabel,
  ResourcePreviewSection,
  TargetRangeLine,
  type ResourcePreview,
} from "./card-parts"
import { rankLadderSteps } from "./ladder-steps"
import { TargetLadder } from "./target-ladder"

export type RankTargetValue = { end: Rank; additional: RankAdditionalTarget }

/**
 * A Rank goal as both dialogs show it (goal-edit-dialog: edit presents a goal the same way creation
 * does): the target on the rank ladder with its range and cost, the additional target under it, the
 * farming strategy, the resources preview, then the Mythic materials and the note. Milestones exist
 * only at creation.
 */
export function RankGoalCard({
  mode,
  start,
  value,
  onChange,
  additionalTargetChoices,
  takenKeys,
  issues,
  preview,
  farmingStrategy,
  onFarmingStrategyChange,
  appliedUpgrades,
  extra,
  milestones,
  mythic,
  note,
}: {
  mode: "create" | "edit"
  start: Rank
  value: RankTargetValue
  onChange: (value: RankTargetValue) => void
  additionalTargetChoices: readonly RankAdditionalTarget[]
  /** Target keys (`goalTargetKey`) other in-flight Rank goals of the unit hold. */
  takenKeys: ReadonlySet<string>
  issues: readonly GoalFormIssueView[]
  preview: ResourcePreview
  farmingStrategy: FarmingStrategy
  onFarmingStrategyChange: (value: FarmingStrategy) => void
  /** The start rank's applied upgrade slots, when known. */
  appliedUpgrades?: { applied: number; total: number }
  /** Notes about the target shown above the strategy, such as the level it needs. */
  extra?: ReactNode
  milestones?: ReactNode
  mythic?: ReactNode
  note?: ReactNode
}) {
  const { t } = useTranslation()
  const steps = useMemo(() => rankLadderSteps(t), [t])
  const takenRanks = useMemo(
    () =>
      new Set<string>(
        rankOrder.filter((rank) => takenKeys.has(rankEndKey(rank)))
      ),
    [takenKeys]
  )
  const name = (rank: Rank) =>
    steps.find((step) => step.key === rank)?.name ?? rank

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5" data-testid="goal-card-target">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("goals.create.rank.target")}
          </span>
          {appliedUpgrades && appliedUpgrades.total > 0 ? (
            <Badge
              data-testid="create-goal-rank-applied-upgrades"
              variant="secondary"
            >
              {t("goals.create.rank.appliedUpgrades", appliedUpgrades)}
            </Badge>
          ) : null}
        </div>
        <TargetLadder
          fieldProps={fieldIssueProps(issues, "Rank", "target")}
          label={t("goals.create.rank.target")}
          onChange={(key) => onChange({ ...value, end: key as Rank })}
          startKey={start}
          steps={steps}
          takenKeys={takenRanks}
          testId="create-goal-rank-end"
          valueKey={value.end}
        />
        <FieldIssues field="target" issues={issues} kind="Rank" />
        <TargetRangeLine
          end={name(value.end)}
          resources={t("goals.card.range.materials", {
            count: preview.missingUpgrades.length,
          })}
          start={name(start)}
          state={preview.state}
        />
      </div>

      <AdditionalTargetSelect
        choices={additionalTargetChoices}
        end={value.end}
        onChange={(additional) => onChange({ ...value, additional })}
        value={value.additional}
      />

      {extra}

      <FarmingStrategyField
        abilityActiveEnd={0}
        abilityActiveStart={0}
        abilityPassiveEnd={0}
        abilityPassiveStart={0}
        context="rank"
        farmingStrategy={farmingStrategy}
        onFarmingStrategyChange={onFarmingStrategyChange}
        rankAdditionalTarget={value.additional}
        rankEnd={value.end}
        rankStart={start}
      />

      <ResourcePreviewSection
        disclaimer
        emptyText={t("goals.create.rank.noResources")}
        preview={preview}
        testId="create-goal-preview"
      />

      {mode === "create" ? milestones : null}
      {mythic}
      {note}
    </div>
  )
}

function AdditionalTargetSelect({
  choices,
  end,
  value,
  onChange,
}: {
  choices: readonly RankAdditionalTarget[]
  end: Rank
  value: RankAdditionalTarget
  onChange: (value: RankAdditionalTarget) => void
}) {
  const { t } = useTranslation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement>()

  return (
    <div className="grid max-w-xs gap-1.5">
      <label className="text-xs text-muted-foreground">
        {t("goals.create.rank.additionalTarget.label")}
      </label>
      <Select
        onOpenChange={(open) => {
          if (open) setContainer(closestOverlayContent(triggerRef.current))
        }}
        onValueChange={(next) => {
          // Radix can fire onValueChange("") while the option list regenerates; ignore non-options.
          if (next !== "") onChange(next as RankAdditionalTarget)
        }}
        value={value}
      >
        <SelectTrigger
          className="w-full"
          data-testid="create-goal-rank-additional-target"
          ref={triggerRef}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={container}>
          {choices.map((choice) => (
            <SelectItem key={choice} value={choice}>
              <AdditionalTargetLabel rank={end} value={choice} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
