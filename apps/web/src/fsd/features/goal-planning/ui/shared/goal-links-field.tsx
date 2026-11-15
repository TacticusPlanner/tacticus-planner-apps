import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { goalTargetLabel, type GoalDetail } from "@/entities/goal"

/** "Counts toward": the unit's Rank (or MoW Ability) goals an Upgrade goal links to, one checkbox each.
 *  A linked goal's slots take the Upgrade goal's materials instead of needing their own. */
export function GoalLinksField({
  candidates,
  selected,
  onChange,
}: {
  candidates: readonly GoalDetail[]
  selected: readonly string[]
  onChange: (linkedGoalIds: string[]) => void
}) {
  const { t } = useTranslation()
  const hintId = useId()
  const toggle = (goalId: string, checked: boolean) =>
    onChange(
      checked
        ? candidates
            .map((goal) => goal.goalId)
            .filter((id) => id === goalId || selected.includes(id))
        : selected.filter((id) => id !== goalId)
    )
  return (
    <fieldset
      aria-describedby={hintId}
      className="grid gap-1.5"
      data-testid="goal-upgrade-links"
    >
      <legend className="mb-1 text-sm font-medium">
        {t("goals.create.upgrade.links.label")}
      </legend>
      <p className="text-xs text-muted-foreground" id={hintId}>
        {candidates.length > 0
          ? t("goals.create.upgrade.links.hint")
          : t("goals.create.upgrade.links.empty")}
      </p>
      {candidates.map((goal) => (
        <label className="flex items-center gap-3 text-sm" key={goal.goalId}>
          <Checkbox
            checked={selected.includes(goal.goalId)}
            onCheckedChange={(checked) => toggle(goal.goalId, checked === true)}
          />
          {t("goals.create.upgrade.links.option", {
            type: t(`goals.create.goalTypes.${goal.goalType}`),
            target: goalTargetLabel(t, goal) ?? "",
          })}
        </label>
      ))}
    </fieldset>
  )
}
