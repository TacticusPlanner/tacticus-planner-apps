import type { UnitId } from "@workspace/game-domain"

import type { ArenaRecommendations } from "../../../model/arena-recommendations.types"
import { TeamCategorySection } from "../../team-recs/category-section"

/** Desktop layout: the Plan Team and Random Team sections sit side by side. */
export function ArenaDesktop({
  recommendations,
  onRegenerate,
  onToggleLock,
}: {
  recommendations: ArenaRecommendations
  onRegenerate: () => void
  onToggleLock: (unitId: UnitId) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="arena-desktop">
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
