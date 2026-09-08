import type { ArenaRecommendations } from "../../../model/arena-recommendations.types"
import { ArenaCategorySection } from "../arena-category-section"

/** Desktop layout: the category sections sit side by side, and each XP-mode team-size switcher is
 * shown inline as a segmented control. */
export function ArenaDesktop({
  recommendations,
  onRegenerate,
}: {
  recommendations: ArenaRecommendations
  onRegenerate: () => void
}) {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      data-testid="arena-desktop"
    >
      {recommendations.categories.map((category) => (
        <ArenaCategorySection
          key={category.id}
          category={category}
          switcherLayout="inline"
          onRegenerate={category.id === "random" ? onRegenerate : undefined}
        />
      ))}
    </div>
  )
}
