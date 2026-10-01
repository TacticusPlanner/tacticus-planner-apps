import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ListFilter } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { countActiveFilterGroups } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { RaidsFiltersDialog } from "./raids-filters-dialog"

/**
 * The Raids Filters action: icon plus label on desktop, icon-only with an accessible name below the
 * 768px breakpoint, with the count of active filter groups as a badge. Owns its dialog's open state,
 * so a page just mounts it (Today and the HSE tab share the one applied filter).
 */
export function RaidsFiltersTrigger({
  testId = "raids-filters",
}: {
  testId?: string
}) {
  const { t } = useTranslation("dailies")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [filters] = useRaidsFilters()
  const count = countActiveFilterGroups(filters)

  return (
    <>
      <Button
        aria-label={
          count > 0
            ? t("raidsFilters.triggerActive", { count })
            : t("raidsFilters.trigger")
        }
        data-testid={testId}
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <ListFilter data-icon="inline-start" />
        {isMobile ? null : t("raidsFilters.trigger")}
        {count > 0 ? (
          <Badge data-testid={`${testId}-badge`} variant="secondary">
            {count}
          </Badge>
        ) : null}
      </Button>
      {open ? <RaidsFiltersDialog onOpenChange={setOpen} open={open} /> : null}
    </>
  )
}
