import { useTranslation } from "react-i18next"
import { BanIcon, CircleCheckIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { isRestrictingObjective } from "../model/quest-objectives"
import type { QuestObjectiveBadge } from "../model/quest-team"
import { useObjectiveWording, type Objective } from "./use-objective-wording"

/**
 * A battle's bonus objectives as chips with their score. Lineup restrictions carry a marker icon and
 * accessible text, so the distinction never rests on colour. `compact` is the battle-row form.
 */
export function ObjectiveChips({
  objectives,
  compact = false,
  badges,
  heroName = "",
}: {
  objectives: readonly Objective[]
  compact?: boolean
  /** Whether the suggested team meets each objective, in `objectives` order. */
  badges?: readonly QuestObjectiveBadge[]
  heroName?: string
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
        const badge = badges?.[index]
        const score = number.format(objective.score)
        const badgeText = (() => {
          switch (badge?.kind) {
            case "met":
              return t("team.badge.met")
            case "unreachable":
              return t("team.badge.unreachable", {
                reason: word.reason(objective, heroName),
                score,
              })
            case "noEligible":
              return t("team.badge.noEligible")
            case "dependsOnPlay":
              return t("team.badge.dependsOnPlay")
            default:
              return null
          }
        })()
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
              {t("objectives.chip", { text: word(objective), score })}
            </span>
            {badgeText ? <span className="sr-only"> · </span> : null}
            {badgeText ? (
              <span
                className={cn(
                  "min-w-0 rounded-full px-1.5 text-xs font-medium",
                  badge?.kind === "met"
                    ? "bg-green-600/15 text-green-800 dark:text-green-300"
                    : "bg-muted text-muted-foreground"
                )}
                data-badge={badge?.kind}
                data-testid="quest-objective-badge"
              >
                {badgeText}
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
