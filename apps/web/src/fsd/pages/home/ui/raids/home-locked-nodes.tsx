import { lazy, Suspense } from "react"
import type { ReactNode } from "react"

import type { LockedNode } from "@/features/goal-planning"

// Goals' planning code stays out of Home's startup bundle: it loads when a material's details open.
const LockedNodesOf = lazy(() =>
  import("@/features/goal-planning").then((module) => ({
    default: module.LockedNodesOf,
  }))
)

/** Goals' `LockedNodesOf`, loaded on first use; the details show without distances meanwhile. */
export function HomeLockedNodes({
  resourceId,
  children,
}: {
  resourceId: string
  children: (nodes: readonly LockedNode[]) => ReactNode
}) {
  return (
    <Suspense fallback={children([])}>
      <LockedNodesOf resourceId={resourceId}>{children}</LockedNodesOf>
    </Suspense>
  )
}
