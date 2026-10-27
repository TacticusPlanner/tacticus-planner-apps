import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import type { AbilityTargetPair } from "../../model/goal-creation-form/first-free-target"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { FieldIssues } from "../create-goal/goal-form-issues"
import { fieldIssueProps } from "../create-goal/goal-form-issue-ids"
import { ResourcePreviewSection, type ResourcePreview } from "./card-parts"
import { AbilityLevelStepper } from "./ability-level-stepper"

const trackLabels = {
  Character: {
    active: "goals.create.ability.activeTarget",
    passive: "goals.create.ability.passiveTarget",
  },
  Mow: {
    active: "goals.create.ability.primaryTarget",
    passive: "goals.create.ability.secondaryTarget",
  },
} as const

/**
 * An Ability goal as both dialogs show it: a level stepper per track (Active/Passive, or
 * Primary/Secondary for a Machine of War), each starting at its own start, which leaves that track
 * unchanged; then the resources preview (a Character's ability cost isn't supported yet), the farming
 * preferences, the Mythic materials and the note. Milestones exist only at creation.
 */
export function AbilityGoalCard({
  mode,
  entityType,
  start,
  value,
  onChange,
  rarityCap,
  issues,
  preview,
  extra,
  milestones,
  sources,
  mythic,
  note,
}: {
  mode: "create" | "edit"
  entityType: "Character" | "Mow"
  start: AbilityTargetPair
  value: AbilityTargetPair
  onChange: (value: AbilityTargetPair) => void
  /** The ability cap of the unit's current rarity ("Rarity cap"). */
  rarityCap: number
  issues: readonly GoalFormIssueView[]
  /** Undefined where ability cost isn't supported (a Character). */
  preview?: ResourcePreview
  extra?: ReactNode
  milestones?: ReactNode
  sources?: ReactNode
  mythic?: ReactNode
  note?: ReactNode
}) {
  const { t } = useTranslation()
  const labels = trackLabels[entityType]
  const targetProps = fieldIssueProps(issues, "Ability", "target")

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5" data-testid="goal-card-target">
        <div className="grid gap-3 sm:grid-cols-2">
          <AbilityLevelStepper
            fieldProps={targetProps}
            label={t(labels.active)}
            onChange={(active) => onChange({ ...value, active })}
            rarityCap={rarityCap}
            start={start.active}
            testId="create-goal-ability-active-target"
            value={value.active}
          />
          <AbilityLevelStepper
            fieldProps={{
              "aria-invalid": targetProps["aria-invalid"],
              "aria-describedby": targetProps["aria-describedby"],
            }}
            label={t(labels.passive)}
            onChange={(passive) => onChange({ ...value, passive })}
            rarityCap={rarityCap}
            start={start.passive}
            testId="create-goal-ability-passive-target"
            value={value.passive}
          />
        </div>
        <FieldIssues field="target" issues={issues} kind="Ability" />
      </div>
      {mode === "create" ? milestones : null}
      {extra}
      {preview ? (
        <ResourcePreviewSection
          emptyText={t("goals.create.ability.noResources")}
          preview={preview}
          testId="create-goal-ability-preview"
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("goals.create.characterAbilityCostUnsupported")}
        </p>
      )}
      {sources}
      {mythic}
      {note}
    </div>
  )
}
