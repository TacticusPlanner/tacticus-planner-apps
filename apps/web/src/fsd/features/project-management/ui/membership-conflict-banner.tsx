import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { MembershipConflict } from "../model/membership-conflict"
import { membershipDifference } from "../model/membership-draft"

/** Explains a rejected save in context. The draft is never touched: a stale rejection shows what changed
 * elsewhere and offers an explicit refresh; the others name the goals the server rejected. */
export function MembershipConflictBanner({
  conflict,
  baselineIds,
  goalName,
  onRefresh,
}: {
  conflict: MembershipConflict
  /** The membership the user reviewed. */
  baselineIds: readonly string[]
  goalName: (goalId: string) => string
  onRefresh: () => void
}) {
  const { t } = useTranslation()

  if (conflict.kind === "stale") {
    const { addedElsewhere, removedElsewhere } = membershipDifference(
      baselineIds,
      conflict.currentGoalIds
    )
    return (
      <div
        className="grid gap-2 rounded-xl border border-destructive p-3 text-sm"
        data-testid="add-goals-conflict"
        role="alert"
      >
        <p className="font-medium">{t("goals.project.assemblyStaleTitle")}</p>
        {addedElsewhere.length > 0 ? (
          <p data-testid="add-goals-stale-added">
            {t("goals.project.assemblyStaleAdded", {
              goals: addedElsewhere.map(goalName).join(", "),
            })}
          </p>
        ) : null}
        {removedElsewhere.length > 0 ? (
          <p data-testid="add-goals-stale-removed">
            {t("goals.project.assemblyStaleRemoved", {
              goals: removedElsewhere.map(goalName).join(", "),
            })}
          </p>
        ) : null}
        <p className="text-muted-foreground">
          {t("goals.project.assemblyStaleHint")}
        </p>
        <Button
          data-testid="add-goals-refresh"
          onClick={onRefresh}
          size="sm"
          variant="outline"
        >
          {t("goals.project.assemblyRefresh")}
        </Button>
      </div>
    )
  }

  return (
    <div
      className="grid gap-2 rounded-xl border border-destructive p-3 text-sm"
      data-testid="add-goals-conflict"
      role="alert"
    >
      <p className="font-medium">
        {conflict.kind === "lastMembership"
          ? t("goals.project.assemblyLastMembershipTitle")
          : t("goals.project.assemblySlotConflictTitle")}
      </p>
      <ul className="list-disc pl-5">
        {conflict.goalIds.map((goalId) => (
          <li key={goalId}>{goalName(goalId)}</li>
        ))}
      </ul>
    </div>
  )
}
