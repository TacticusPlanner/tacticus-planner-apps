import { useTranslation } from "react-i18next"
import { BanIcon, CircleCheckIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { isRestrictingObjective } from "../model/quest-objectives"
import { useObjectiveWording, type Objective } from "./use-objective-wording"

/**
 * A battle's bonus objectives as chips with their score. Lineup restrictions carry a marker icon and
 * accessible text, so the distinction never rests on colour. `compact` is the battle-row form.
 */
export function ObjectiveChips({
  objectives,
  compact = false,
}: {
  objectives: readonly Objective[]
  compact?: boolean
}) {
  const { t, i18n } = useTranslation("quest")
  const word = useObjectiveWording()
  const number = new Intl.NumberFormat(i18n.language)
  if (objectives.length === 0) return null
  return (
    <ul
      className={cn("flex min-w-0 flex-wrap gap-1.5", compact && "gap-1")}
      data-testid="quest-objective-chips"
    >
      {objectives.map((objective, index) => {
        const restriction = isRestrictingObjective(objective.type)
        const Icon = restriction ? BanIcon : CircleCheckIcon
        return (
          <li
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5",
              compact ? "text-xs" : "text-sm",
              restriction && "border-amber-500/50 bg-amber-500/10"
            )}
            data-restriction={restriction ? "true" : undefined}
            data-testid="quest-objective-chip"
            key={`${objective.type}-${index}`}
          >
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {restriction ? (
              <span className="sr-only">{t("objectives.restriction")}: </span>
            ) : null}
            <span className="truncate">
              {t("objectives.chip", {
                text: word(objective),
                score: number.format(objective.score),
              })}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
