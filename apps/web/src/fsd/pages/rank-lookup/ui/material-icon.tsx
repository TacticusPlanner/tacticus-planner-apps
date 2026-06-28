import { upgradeIcon, upgradeIconFallback } from "@/entities/upgrade"

import { EntityIcon } from "./entity-icon"

export function MaterialIcon({
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
