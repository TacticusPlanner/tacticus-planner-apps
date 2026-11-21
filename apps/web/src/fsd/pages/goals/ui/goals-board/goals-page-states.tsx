import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { EmptyState } from "@/shared/ui"

import { GoalsFetchError } from "./goals-estimates-error"

/** The Goals page's non-list states: loading skeletons, fetch error, the pristine and empty-project
 *  cards, and the "filters match nothing" line (shown only when none of the others applies). */
export function GoalsPageStates({
  isLoading,
  fetchError,
  onRetry,
  showPristineEmptyState,
  showEmptyProjectState,
  showFilteredEmpty,
  onClearFilters,
}: {
  isLoading: boolean
  fetchError: string | null
  onRetry: () => void
  showPristineEmptyState: boolean
  showEmptyProjectState: boolean
  showFilteredEmpty: boolean
  /** Shown as "Clear filters" on the filtered-empty line while a status or Type filter is set. */
  onClearFilters?: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-3" data-testid="goals-page-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {fetchError ? (
        <GoalsFetchError message={fetchError} onRetry={onRetry} />
      ) : null}

      {showPristineEmptyState ? (
        <EmptyState
          description={t("goals.empty.description")}
          testId="goals-page-empty"
          title={t("goals.empty.title")}
        />
      ) : null}

      {showEmptyProjectState ? (
        <EmptyState
          description={t("goals.project.emptyProjectDescription")}
          testId="goals-page-empty-project"
          title={t("goals.project.emptyProjectTitle")}
        />
      ) : null}

      {!isLoading &&
      !fetchError &&
      !showPristineEmptyState &&
      !showEmptyProjectState &&
      showFilteredEmpty ? (
        <EmptyState
          actions={
            onClearFilters ? (
              <Button onClick={onClearFilters} variant="outline">
                {t("filtersControl.clear")}
              </Button>
            ) : undefined
          }
          description={t("goals.empty.filtered")}
          testId="goals-page-filtered-empty"
          variant="no-match"
        />
      ) : null}
    </>
  )
}
