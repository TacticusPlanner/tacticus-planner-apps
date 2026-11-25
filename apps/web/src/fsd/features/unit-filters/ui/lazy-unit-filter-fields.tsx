import { lazy, Suspense } from "react"
import type { ComponentProps } from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { UnitFilterFields } from "./unit-filter-fields"

// The fields (pickers and range selects) arrive in their own chunk on the Filters panel's first
// opening, so a list that opens them in a panel keeps them out of its first load.
const UnitFilterFieldsChunk = lazy(() =>
  import("./unit-filter-fields").then((module) => ({
    default: module.UnitFilterFields,
  }))
)

/** `UnitFilterFields`, loaded when first rendered; a placeholder shows meanwhile. */
export function LazyUnitFilterFields(
  props: ComponentProps<typeof UnitFilterFields>
) {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <UnitFilterFieldsChunk {...props} />
    </Suspense>
  )
}
