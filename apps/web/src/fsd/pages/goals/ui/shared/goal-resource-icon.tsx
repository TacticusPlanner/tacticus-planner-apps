import { characterIcon } from "@workspace/game-catalog"
import type { UnitId, UpgradeId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { useGoalCatalog } from "@/features/goal-planning"
import { EntityIcon, UpgradeIcon } from "@/shared/ui"

/** A plan resource's icon: an upgrade material's rarity-framed icon, or the unit's portrait for
 *  `shard:<unit>`. Decorative: the row it sits in names the resource. */
export function GoalResourceIcon({
  resourceId,
  className = "size-8",
}: {
  resourceId: string
  className?: string
}) {
  const { upgradesById } = useGoalCatalog()
  if (resourceId.startsWith("shard:")) {
    return (
      <EntityIcon
        alt=""
        className={cn("shrink-0 rounded-full", className)}
        src={characterIcon(resourceId.slice("shard:".length) as UnitId)}
      />
    )
  }
  const upgrade = upgradesById.get(resourceId as UpgradeId)
  return (
    <UpgradeIcon
      className={cn("shrink-0", className)}
      crafted={upgrade?.crafted}
      id={resourceId as UpgradeId}
      rarity={upgrade?.rarity}
    />
  )
}
