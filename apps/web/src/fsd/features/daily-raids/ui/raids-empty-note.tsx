import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { emptyRaidsFilters } from "../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../model/raids-filters/use-raids-filters"

/**
 * Why an event's raid list is empty, inside its card: one line, plus "Reset filters" when the raid
 * filters hid every battle. A card's note, not the page-level `EmptyState`.
 */
export function RaidsEmptyNote({
  message,
  filtered,
  testId,
  resetTestId,
}: {
  message: string
  filtered: boolean
  testId: string
  resetTestId: string
}) {
  const { t } = useTranslation("dailies")
  const [, setFilters] = useRaidsFilters()
  return (
    <div
      className="space-y-2 text-sm text-muted-foreground"
      data-testid={testId}
    >
      <p>{message}</p>
      {filtered ? (
        <Button
          data-testid={resetTestId}
          onClick={() => setFilters(emptyRaidsFilters)}
          size="sm"
          variant="outline"
        >
          {t("raidsFilters.filteredOut.reset")}
        </Button>
      ) : null}
    </div>
  )
}
