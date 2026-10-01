import { useTranslation } from "react-i18next"
import { FunnelX } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import type { FilteredOutNeed } from "@/features/goal-farming/@x/daily-raids"

import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"

/**
 * Explains materials the applied Raids Filters left without an allowed node, with a one-tap Reset.
 * Auto-picked materials and goals pinned to an excluded location are worded separately, because a
 * pinned goal looks like a bug ("I pinned that node") unless the pin is named as the cause.
 */
export function FilteredOutNotice({
  filteredOut,
}: {
  filteredOut: readonly FilteredOutNeed[]
}) {
  const { t } = useTranslation("dailies")
  const [, setFilters] = useRaidsFilters()
  const materials = new Set(
    filteredOut.filter((need) => !need.pinned).map((need) => need.resourceId)
  ).size
  const pinnedGoals = new Set(
    filteredOut.filter((need) => need.pinned).map((need) => need.goalId)
  ).size
  if (materials === 0 && pinnedGoals === 0) return null

  return (
    <Alert data-testid="raids-filters-filtered-out">
      <FunnelX aria-hidden="true" />
      <AlertTitle>{t("raidsFilters.filteredOut.title")}</AlertTitle>
      <AlertDescription className="space-y-2">
        {materials > 0 ? (
          <p data-testid="raids-filters-filtered-out-materials">
            {t("raidsFilters.filteredOut.materials", { count: materials })}
          </p>
        ) : null}
        {pinnedGoals > 0 ? (
          <p data-testid="raids-filters-filtered-out-pinned">
            {t("raidsFilters.filteredOut.pinned", { count: pinnedGoals })}
          </p>
        ) : null}
        <Button
          data-testid="raids-filters-filtered-out-reset"
          onClick={() => setFilters(emptyRaidsFilters)}
          size="sm"
          variant="outline"
        >
          {t("raidsFilters.filteredOut.reset")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
