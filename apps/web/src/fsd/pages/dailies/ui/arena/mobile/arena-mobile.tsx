import type { UnitId } from "@workspace/game-domain"

import type { ArenaRecommendations } from "../../../model/arena-recommendations.types"
import { TeamCategorySection } from "../../team-recs/category-section"

/** Mobile layout: the category sections stack vertically. Same categories, teams, controls, and
 * rationales as the desktop layout. */
export function ArenaMobile({
  recommendations,
  onRegenerate,
  onToggleLock,
}: {
  recommendations: ArenaRecommendations
  onRegenerate: () => void
  onToggleLock: (unitId: UnitId) => void
}) {
  return (
    <div className="grid gap-4" data-testid="arena-mobile">
      {recommendations.categories.map((category) => (
        <TeamCategorySection
          key={category.id}
          category={category}
          onRegenerate={category.id === "random" ? onRegenerate : undefined}
          onToggleLock={category.id === "random" ? onToggleLock : undefined}
        />
      ))}
    </div>
  )
}
