import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import {
  defeatAllIcon,
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
} from "@/entities/legendary-event"

/** The cells a token clears: defeat-all as text, each objective with its icon (and name unless
 *  `compact`, where the name is the icon's tooltip). */
export function TokenObjectives({
  lane,
  clearedIds,
  compact = false,
  className,
}: {
  lane: Pick<LegendaryEventLane, "unitsRestrictions">
  clearedIds: readonly number[]
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  return (
    <ul
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}
      data-testid="token-objectives"
    >
      {clearedIds.map((id) => {
        if (id === 0) {
          const label = t("progress.defeatAll")
          return (
            <li
              className="flex items-center gap-1 text-xs"
              data-objective="0"
              key={id}
              title={label}
            >
              <ObjectiveIcon
                className={cn(
                  "overflow-hidden rounded-md",
                  compact ? "size-6" : "size-5"
                )}
                icon={{ src: defeatAllIcon }}
              />
              <span className={cn(compact && "sr-only")}>{label}</span>
            </li>
          )
        }
        const objective = lane.unitsRestrictions.find(
          (entry) => entry.index === id - 1
        )
        if (!objective) return null
        const { label, icon } = objectiveLabel(objective)
        return (
          <li
            className="flex items-center gap-1 text-xs"
            data-objective={id}
            key={id}
            title={label}
          >
            <ObjectiveIcon
              className={compact ? "size-6" : "size-5"}
              icon={icon}
            />
            <span className={cn(compact && "sr-only")}>{label}</span>
          </li>
        )
      })}
    </ul>
  )
}
