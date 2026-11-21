import { useTranslation } from "react-i18next"
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
}: {
  isLoading: boolean
  fetchError: string | null
  onRetry: () => void
  showPristineEmptyState: boolean
  showEmptyProjectState: boolean
  showFilteredEmpty: boolean
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
          description={t("goals.empty.filtered")}
          testId="goals-page-filtered-empty"
          variant="no-match"
        />
      ) : null}
    </>
  )
}
