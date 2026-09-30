import { useTranslation } from "react-i18next"
import type { UpgradeId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import {
  getChangedGoalTargetIssue,
  type GoalTargetDraft,
} from "../../model/target-edit/goal-target-edit"
import { InfoHint } from "../shared/info-hint"
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
  const issue = getChangedGoalTargetIssue(detail, draft)

  return (
    <section className="grid gap-2" data-testid="goal-edit-target">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-1.5 font-semibold">
          {t("goals.target.title")}
          <InfoHint text={t("goals.target.reachedNote")} />
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{t("goals.target.startedFrom")}</span>
          <GoalTargetStart detail={detail} />
        </div>
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
      ) : null}
    </section>
  )
}
