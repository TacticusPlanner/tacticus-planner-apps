import type { UnitId } from "@workspace/game-domain"

import type { OnslaughtRecommendations } from "../../../model/onslaught-recommendations.types"
import { TeamCategorySection } from "../../team-recs/category-section"

/** Mobile layout: the category sections stack vertically. Same categories, teams, controls, and
 * rationales as the desktop layout; the shard recipient panel is rendered by the page above. */
export function OnslaughtMobile({
  recommendations,
  onRegenerate,
  onToggleLock,
}: {
  recommendations: OnslaughtRecommendations
  onRegenerate: () => void
  onToggleLock: (unitId: UnitId) => void
}) {
  return (
    <div className="grid gap-4" data-testid="onslaught-mobile">
      {recommendations.categories.map((category) => (
        <TeamCategorySection
          key={category.id}
          category={category}
          testIdPrefix="onslaught"
          onRegenerate={category.id === "random" ? onRegenerate : undefined}
          onToggleLock={category.id === "random" ? onToggleLock : undefined}
        />
      ))}
    </div>
  )
}
