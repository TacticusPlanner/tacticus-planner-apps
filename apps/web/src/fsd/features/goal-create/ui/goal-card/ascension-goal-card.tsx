import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Progression } from "@workspace/game-domain"

import type { useProgressionPreview } from "../../model/goal-creation-form/use-progression-preview"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { ProgressionPreview } from "../create-goal/goal-farming-fields"
import { FieldIssues } from "../create-goal/goal-form-issues"
import { fieldIssueProps } from "../create-goal/goal-form-issue-ids"
import { TargetRangeLine } from "./card-parts"
import { progressionLadderSteps } from "./ladder-steps"
import { TargetLadder } from "./target-ladder"

/**
 * An Ascension goal as both dialogs show it: the target on the progression ladder with its range and
 * shards, the shards-and-orbs preview, then the shard sources and the note. Milestones exist only at
 * creation. `preview` is null while it is loading.
 */
export function AscensionGoalCard({
  mode,
  start,
  value,
  onChange,
  takenKeys,
  issues,
  preview,
  milestones,
  sources,
  note,
}: {
  mode: "create" | "edit"
  start: Progression
  value: Progression
  onChange: (value: Progression) => void
  takenKeys: ReadonlySet<string>
  issues: readonly GoalFormIssueView[]
  preview: ReturnType<typeof useProgressionPreview>
  milestones?: ReactNode
  sources?: ReactNode
  note?: ReactNode
}) {
  const { t } = useTranslation()
  const steps = useMemo(() => progressionLadderSteps(t), [t])
  const name = (step: Progression) =>
    steps.find((candidate) => candidate.key === step)?.name ?? step

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5" data-testid="goal-card-target">
        <span className="text-xs text-muted-foreground">
          {t("goals.create.ascension.end")}
        </span>
        <TargetLadder
          fieldProps={fieldIssueProps(issues, "Ascension", "target")}
          label={t("goals.create.ascension.end")}
          onChange={(key) => onChange(key as Progression)}
          startKey={start}
          steps={steps}
          takenKeys={takenKeys}
          testId="create-goal-ascension-end"
          valueKey={value}
        />
        <FieldIssues field="target" issues={issues} kind="Ascension" />
        <TargetRangeLine
          end={name(value)}
          resources={
            preview
              ? t("goals.create.ascension.shards", {
                  regular: preview.regularShards,
                  mythic: preview.mythicShards,
                })
              : ""
          }
          start={name(start)}
          state={preview ? "content" : "loading"}
        />
      </div>
      <ProgressionPreview preview={preview} />
      {mode === "create" ? milestones : null}
      {sources}
      {note}
    </div>
  )
}
