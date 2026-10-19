import { Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HRE_OBJECTIVE_KINDS, type HreObjective } from "../model/hre-missions"

/** One static community-guide tip per objective kind; an unknown kind shows none. */
export function ObjectiveTips({
  objectives,
  testId,
}: {
  objectives: readonly HreObjective[]
  testId: string
}) {
  const { t } = useTranslation("hre")
  const kinds = [
    ...new Set(
      objectives
        .map((objective) => objective.kind)
        .filter((kind) => HRE_OBJECTIVE_KINDS.includes(kind))
    ),
  ]
  if (kinds.length === 0) return null
  return (
    <ul className="space-y-1" data-testid={testId}>
      {kinds.map((kind) => (
        <li
          key={kind}
          className="flex gap-2 text-xs text-muted-foreground"
          data-testid={`${testId}-${kind}`}
        >
          <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{t(`tips.${kind}`)}</span>
        </li>
      ))}
    </ul>
  )
}
