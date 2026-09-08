import type { UnitId } from "@workspace/game-domain"

import type { SalvageRecommendations } from "../../../model/salvage-recommendations.types"
import { TeamCategorySection } from "../../team-recs/category-section"

/** Mobile layout: the category sections stack vertically. Same categories, teams, controls, and
 * rationales as the desktop layout. */
export function SalvageMobile({
  recommendations,
  onRegenerate,
  onToggleLock,
}: {
  recommendations: SalvageRecommendations
  onRegenerate: () => void
  onToggleLock: (unitId: UnitId) => void
}) {
  return (
    <div className="grid gap-4" data-testid="salvage-mobile">
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
