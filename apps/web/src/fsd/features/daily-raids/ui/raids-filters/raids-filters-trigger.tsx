import { useState } from "react"

import { FiltersButton } from "@/shared/ui"

import { countActiveFilterGroups } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { RaidsFiltersDialog } from "./raids-filters-dialog"

/**
 * The Raids Filters action: the shared Filters button (ui-style-guide rule 3) with the count of
 * active filter groups as a badge. Owns its dialog's open state, so a page just mounts it (Today
 * and the HSE tab share the one applied filter). Unlike other Filters panels this one applies on
 * "Apply filters": every change re-plans the day's raids, which is slow.
 */
export function RaidsFiltersTrigger({
  testId = "raids-filters",
}: {
  testId?: string
}) {
  const [open, setOpen] = useState(false)
  const [filters] = useRaidsFilters()
  const count = countActiveFilterGroups(filters)

  return (
    <>
      <FiltersButton
        aria-haspopup="dialog"
        aria-expanded={open}
        count={count}
        onClick={() => setOpen(true)}
        testId={testId}
      />
      {open ? <RaidsFiltersDialog onOpenChange={setOpen} open={open} /> : null}
    </>
  )
}
