import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

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
        <Card data-testid="goals-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.empty.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            {t("goals.empty.description")}
          </CardContent>
        </Card>
      ) : null}

      {showEmptyProjectState ? (
        <Card data-testid="goals-page-empty-project">
          <CardHeader>
            <CardTitle>{t("goals.project.emptyProjectTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("goals.project.emptyProjectDescription")}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading &&
      !fetchError &&
      !showPristineEmptyState &&
      !showEmptyProjectState &&
      showFilteredEmpty ? (
        <p
          className="py-10 text-center text-muted-foreground"
          data-testid="goals-page-filtered-empty"
        >
          {t("goals.empty.filtered")}
        </p>
      ) : null}
    </>
  )
}
