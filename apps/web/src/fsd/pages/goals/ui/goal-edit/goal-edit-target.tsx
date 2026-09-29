import { useTranslation } from "react-i18next"
import type { UpgradeId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import {
  getGoalTargetIssue,
  type GoalTargetDraft,
} from "../../model/target-edit/goal-target-edit"
import { GoalTargetFields, GoalTargetStart } from "./goal-target-fields"

/** The target editors rendered inline in the Edit goal dialog: no Edit/Save/Cancel of their own — the
 * dialog's one Save submits the target with everything else. */
export function GoalEditTarget({
  detail,
  draft,
  onChange,
  portalContainer,
  upgradesById,
}: {
  detail: GoalDetail
  draft: GoalTargetDraft
  onChange: (draft: GoalTargetDraft) => void
  portalContainer: HTMLElement | null
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
}) {
  const { t } = useTranslation()
  const issue = getGoalTargetIssue(detail, draft)

  return (
    <section className="grid gap-3" data-testid="goal-edit-target">
      <h3 className="font-semibold">{t("goals.target.title")}</h3>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{t("goals.target.startedFrom")}</span>
        <GoalTargetStart detail={detail} />
      </div>
      <GoalTargetFields
        detail={detail}
        draft={draft}
        onChange={onChange}
        portalContainer={portalContainer}
        upgradesById={upgradesById}
      />
      {issue ? (
        <p className="text-destructive" data-testid="goal-target-issue">
          {t(`goals.target.issues.${issue}`)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("goals.target.reachedNote")}
        </p>
      )}
    </section>
  )
}
