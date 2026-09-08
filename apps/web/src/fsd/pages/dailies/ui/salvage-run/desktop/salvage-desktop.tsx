import type { UnitId } from "@workspace/game-domain"

import type { SalvageRecommendations } from "../../../model/salvage-recommendations.types"
import { TeamCategorySection } from "../../team-recs/category-section"

/** Desktop layout: the Plan Team and Random Team sections sit side by side. */
export function SalvageDesktop({
  recommendations,
  onRegenerate,
  onToggleLock,
}: {
  recommendations: SalvageRecommendations
  onRegenerate: () => void
  onToggleLock: (unitId: UnitId) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="salvage-desktop">
      {recommendations.categories.map((category) => (
        <TeamCategorySection
          key={category.id}
          category={category}
          testIdPrefix="salvage"
          onRegenerate={category.id === "random" ? onRegenerate : undefined}
          onToggleLock={category.id === "random" ? onToggleLock : undefined}
        />
      ))}
    </div>
  )
}
