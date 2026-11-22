import { useTranslation } from "react-i18next"

import type { ObjectiveSuggestions } from "./objective-suggestions"
import { objectiveDetailId } from "./objective-detail-id"

/**
 * The current mission's suggestions in full, below the event pace: every open objective's details
 * cards in objective order, each with the id its row under the objective scrolls to.
 */
export function ObjectiveDetails({
  objectives,
}: {
  /** The open objectives with suggestions, by their index in the mission. */
  objectives: readonly { index: number; suggestions: ObjectiveSuggestions }[]
}) {
  const { t } = useTranslation("hre")
  const entries = objectives.flatMap(({ index, suggestions }) =>
    suggestions.items.map((item) => ({ index, item }))
  )
  if (entries.length === 0) return null
  return (
    <section className="space-y-3" data-testid="hre-details">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("tracker.detailsTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("tracker.detailsDescription")}
        </p>
      </div>
      {entries.map(({ index, item }) => (
        <div
          className="scroll-mt-[calc(var(--mobile-header-height)+1rem)] md:scroll-mt-4"
          data-testid={`hre-objective-${index}-detail-${item.id}`}
          id={objectiveDetailId(index, item.id)}
          key={`${index}-${item.id}`}
        >
          {item.detail}
        </div>
      ))}
    </section>
  )
}
