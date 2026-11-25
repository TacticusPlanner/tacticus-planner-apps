import type { ReactNode } from "react"

import { useLockedNodes } from "../../model/unlock-paths/use-locked-nodes"
import type { LockedNode } from "../../model/unlock-paths/use-locked-nodes"

/** Renders `children` with the locked nodes that drop `resourceId`, closest first. A component
 *  rather than a hook so a popover reads the unlock data only while it is open. */
export function LockedNodesOf({
  resourceId,
  children,
}: {
  resourceId: string
  children: (nodes: readonly LockedNode[]) => ReactNode
}) {
  const nodesOf = useLockedNodes()
  return children(nodesOf(resourceId))
}
