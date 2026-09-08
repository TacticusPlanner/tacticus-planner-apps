import type { UnitId } from "@workspace/game-domain"

import type { OnslaughtRecommendations } from "../../../model/onslaught-recommendations.types"
import { TeamCategorySection } from "../../team-recs/category-section"

/** Desktop layout: the Plan Team and Random Team sections sit side by side. The shard recipient
 * panel is rendered by the page above this grid. */
export function OnslaughtDesktop({
  recommendations,
  onRegenerate,
  onToggleLock,
}: {
  recommendations: OnslaughtRecommendations
  onRegenerate: () => void
  onToggleLock: (unitId: UnitId) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="onslaught-desktop">
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
