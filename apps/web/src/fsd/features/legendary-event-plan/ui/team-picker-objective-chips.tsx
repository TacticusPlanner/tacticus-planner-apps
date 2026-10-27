import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
} from "@/entities/legendary-event"

/**
 * The picker's objective chips (design D1): the lane's objectives as multi-select toggles with
 * their icon, label, score and how many listed units satisfy each. Selecting chips only reorders
 * and dims the grid; it never hides a unit.
 */
export function TeamPickerObjectiveChips({
  objectives,
  selected,
  counts,
  onToggle,
}: {
  /** The lane's objectives, in catalog `index` order. */
  objectives: readonly LegendaryEventLane["unitsRestrictions"][number][]
  selected: readonly number[]
  /** Per objective index, the listed units satisfying it. */
  counts: ReadonlyMap<number, number>
  onToggle: (index: number) => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <div
      aria-label={t("teams.picker.objectives")}
      className="flex flex-wrap gap-1.5"
      data-testid="team-picker-objectives"
      role="group"
    >
      {objectives.map((objective) => {
        const { label, icon } = objectiveLabel(objective)
        const isSelected = selected.includes(objective.index)
        const count = counts.get(objective.index) ?? 0
        return (
          <button
            aria-label={t("teams.picker.objectiveChip", {
              objective: label,
              count,
            })}
            aria-pressed={isSelected}
            className={cn(
              "flex min-h-8 items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary"
                : "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            data-count={count}
            data-index={objective.index}
            data-testid="team-picker-objective-chip"
            key={objective.index}
            onClick={() => onToggle(objective.index)}
            type="button"
          >
            <ObjectiveIcon className="size-4" icon={icon} />
            <span>{label}</span>
            <span className="font-semibold tabular-nums">
              {number.format(objective.points)}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "rounded-full px-1.5 tabular-nums",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
              data-testid="team-picker-objective-count"
            >
              {number.format(count)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
