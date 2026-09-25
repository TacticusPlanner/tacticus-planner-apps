import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import type { UpgradeId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import {
  getGoalTargetIssue,
  goalTargetDraftFromDetail,
  isGoalTargetDraftChanged,
  isGoalTargetEditable,
  type GoalTargetDraft,
} from "../../model/target-edit/goal-target-edit"
import { useGoalTargetSave } from "../../model/target-edit/use-goal-target-save"
import { GoalTargetFields, GoalTargetStart } from "./goal-target-fields"

/**
 * The goal detail's in-place target editor (`edit-goal-targets-in-place`). It lives beside — not inside —
 * the detail sheet's general Edit/Save flow: Save target submits only the target, using the revision the
 * goal was loaded with, and never touches an unsaved notes/strategy/project draft. Offered only for
 * Active/Paused goals of a kind that has an adjustable target. A stale-revision or collision error keeps
 * the draft; after a successful save the goal cache is replaced and the planning queries refetch, with a
 * visible warning if that refetch fails (so old estimates are never presented as current).
 */
export function GoalTargetSection({
  detail,
  upgradesById,
  portalContainer,
  onViewGoal,
  onSaved,
  onDirtyChange,
}: {
  detail: GoalDetail
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  portalContainer: HTMLElement | null
  onViewGoal: (goalId: string) => void
  onSaved: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<GoalTargetDraft | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const target = useGoalTargetSave({
    detail,
    onSaved: () => {
      setDraft(null)
      setJustSaved(true)
      onSaved()
    },
  })

  const editing = draft !== null
  const dirty = editing && isGoalTargetDraftChanged(detail, draft)
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const refreshBanner =
    target.refreshState === "refreshing" ? (
      <p className="text-muted-foreground" role="status">
        {t("goals.target.refreshing")}
      </p>
    ) : target.refreshState === "failed" ? (
      <div className="grid justify-items-start gap-2" role="alert">
        <p className="text-amber-700">{t("goals.target.planningStale")}</p>
        <Button onClick={target.retryRefresh} size="xs" variant="outline">
          {t("goals.target.retryRefresh")}
        </Button>
      </div>
    ) : justSaved ? (
      <p className="text-muted-foreground" role="status">
        {t("goals.target.saved")}
      </p>
    ) : null

  if (!isGoalTargetEditable(detail)) {
    return refreshBanner ? (
      <div className="px-4 text-sm">{refreshBanner}</div>
    ) : null
  }

  const issue = draft ? getGoalTargetIssue(detail, draft) : null
  const stored = goalTargetDraftFromDetail(detail)

  return (
    <section
      className="grid gap-3 px-4 text-sm"
      data-testid="goal-target-section"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{t("goals.target.title")}</h3>
        {!editing && stored ? (
          <Button
            data-testid="goal-detail-edit-target"
            onClick={() => {
              setJustSaved(false)
              target.clearError()
              setDraft(stored)
            }}
            size="xs"
            variant="outline"
          >
            {t("goals.target.edit")}
          </Button>
        ) : null}
      </div>

      {editing && draft ? (
        <div className="grid gap-3" data-testid="goal-target-editor">
          <p className="text-muted-foreground">{t("goals.target.hint")}</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{t("goals.target.startedFrom")}</span>
            <GoalTargetStart detail={detail} />
          </div>
          <GoalTargetFields
            detail={detail}
            draft={draft}
            onChange={(next) => {
              target.clearError()
              setDraft(next)
            }}
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

          {target.error?.kind === "stale" ? (
            <div className="grid justify-items-start gap-2" role="alert">
              <p className="text-destructive">{t("goals.target.stale")}</p>
              <Button
                data-testid="goal-target-load-current"
                onClick={() => {
                  if (target.error?.kind === "stale") {
                    target.loadCurrent(target.error.current)
                  }
                }}
                size="xs"
                variant="outline"
              >
                {t("goals.target.loadCurrent")}
              </Button>
            </div>
          ) : null}
          {target.error?.kind === "collision" ? (
            <div className="grid justify-items-start gap-2" role="alert">
              <p className="text-destructive">
                {t("goals.target.collision", {
                  project: target.error.projectName,
                })}
              </p>
              <Button
                onClick={() => {
                  if (target.error?.kind === "collision") {
                    onViewGoal(target.error.existingGoalId)
                  }
                }}
                size="xs"
                variant="outline"
              >
                {t("goals.project.reviewConflictingGoal")}
              </Button>
            </div>
          ) : null}
          {target.error?.kind === "failed" ? (
            <p className="text-destructive" role="alert">
              {target.error.message ?? t("goals.target.saveError")}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              data-testid="goal-target-cancel"
              onClick={() => {
                target.clearError()
                setDraft(null)
              }}
              size="sm"
              variant="outline"
            >
              {t("goals.target.cancel")}
            </Button>
            <Button
              data-testid="goal-target-save"
              disabled={target.isSaving || !dirty || issue !== null}
              onClick={() => void target.save(draft)}
              size="sm"
            >
              {target.isSaving
                ? t("goals.target.saving")
                : t("goals.target.save")}
            </Button>
          </div>
        </div>
      ) : null}

      {refreshBanner}
    </section>
  )
}
