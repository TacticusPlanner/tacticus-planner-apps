import { characterIcon } from "@workspace/game-catalog"
import type { UnitId, UpgradeId } from "@workspace/game-domain"

import { useGoalCatalog } from "@/features/goal-planning"
import { EntityIcon, UpgradeIcon } from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

/** A plan resource's icon: an upgrade material's rarity-framed icon, or the unit's portrait for
 *  `shard:<unit>`. Decorative: the row it sits in names the resource. `size` is a step on the style
 *  guide's icon scale (`icon-lg` by default). */
export function GoalResourceIcon({
  resourceId,
  size = "icon-lg",
}: {
  resourceId: string
  size?: EntityIconSize
}) {
  const { upgradesById } = useGoalCatalog()
  if (resourceId.startsWith("shard:")) {
    return (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0 rounded-full"
        src={characterIcon(resourceId.slice("shard:".length) as UnitId)}
      />
    )
  }
  const upgrade = upgradesById.get(resourceId as UpgradeId)
  return (
    <UpgradeIcon
      size={size}
      className="shrink-0"
      crafted={upgrade?.crafted}
      id={resourceId as UpgradeId}
      rarity={upgrade?.rarity}
    />
  )
}
