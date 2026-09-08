import type { ArenaRecommendations } from "../../../model/arena-recommendations.types"
import { ArenaCategorySection } from "../arena-category-section"

/** Mobile layout: the category sections stack vertically and each XP-mode team-size switcher is a
 * compact dropdown. Same categories, teams, and rationales as the desktop layout. */
export function ArenaMobile({
  recommendations,
  onRegenerate,
}: {
  recommendations: ArenaRecommendations
  onRegenerate: () => void
}) {
  return (
    <div className="grid gap-4" data-testid="arena-mobile">
      {recommendations.categories.map((category) => (
        <ArenaCategorySection
          key={category.id}
          category={category}
          switcherLayout="compact"
          onRegenerate={category.id === "random" ? onRegenerate : undefined}
        />
      ))}
    </div>
  )
}
