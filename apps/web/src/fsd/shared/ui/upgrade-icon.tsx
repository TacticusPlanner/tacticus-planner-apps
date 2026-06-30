import { upgradeIcon, upgradeIconFallback } from "@workspace/game-catalog"

import { EntityIcon } from "./entity-icon"

export function UpgradeIcon({
  id,
  className = "size-8",
}: {
  id: string
  className?: string
}) {
  return (
    <EntityIcon
      src={upgradeIcon(id)}
      fallback={upgradeIconFallback}
      alt=""
      className={className}
    />
  )
}
