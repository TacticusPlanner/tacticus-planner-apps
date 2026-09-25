import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { GoalDetail } from "@/entities/goal"

import {
  blockerReasonText,
  type BlockerReason,
  type GoalBlockers,
} from "../../model/blockers/goal-blockers"
import type { EstimateOutcome, ResourceNeed } from "@/features/goal-farming"
import type { GoalProgress } from "../../model/attainment/goal-progress"
import type { GoalProject } from "../../model/shared/types"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { GoalProjectBadges } from "../shared/goal-visuals"
import { GoalEstimateSection } from "./goal-estimate-section"

type MissingPrerequisiteReason = Extract<
  BlockerReason,
  {
    kind:
      | "MissingLevelPrerequisite"
      | "MissingAscensionPrerequisite"
      | "MissingUnlockPrerequisite"
  }
>

/**
 * Read-only view mode (plan §5's default) — everything a user can learn about a goal without
 * entering Edit. Split out of `goal-detail-sheet.tsx` to keep that file under this repo's max-lines
 * rule, mirroring how `goal-estimate-section.tsx`/`goal-projects-field.tsx` were split out.
 */
export function GoalDetailView({
  detail,
  estimate,
  isolated,
  progress,
  remaining,
  blockers,
  dependencies,
  getEntityName,
  assignedProjects,
  farmingSummary,
  potentialRatio,
  onCreatePrerequisite,
  onViewGoal,
}: {
  detail: GoalDetail
  estimate: EstimateOutcome | undefined
  isolated: boolean
  progress: GoalProgress
  remaining: ResourceNeed | null
  blockers: GoalBlockers
  dependencies: GoalDetail[]
  getEntityName: (entityType: string, entityId: string) => string
  assignedProjects: GoalProject[]
  farmingSummary: string | null
  potentialRatio?: number
  onCreatePrerequisite: (reason: MissingPrerequisiteReason) => void
  onViewGoal: (goalId: string) => void
}) {
  const { t } = useTranslation()
  // Two different unreached-prerequisite goals (or any other pair of reasons that happen to render
  // identical text, e.g. `PrerequisiteNotReached` carries a `goalId` the text never names) would
  // otherwise show the same line twice with nothing to tell them apart.
  const seenBlockerReasonTexts = new Set<string>()
  const uniqueBlockerReasons = blockers.reasons.filter((reason) => {
    const text = blockerReasonText(t, reason)
    if (seenBlockerReasonTexts.has(text)) return false
    seenBlockerReasonTexts.add(text)
    return true
  })

  return (
    <div className="grid gap-6 px-4 text-sm" data-testid="goal-detail-view">
      <section className="grid gap-2">
        <h3 className="font-semibold">{t("goals.detail.progressTitle")}</h3>
        {progress.kind === "Unknown" && remaining === null ? (
          <p className="text-muted-foreground">{t("goals.detail.none")}</p>
        ) : (
          <>
            <GoalTargetDisplay progress={progress} />
            <GoalProgressDisplay
              energy={
                estimate && estimate.status !== "Blocked"
                  ? estimate.energyTotal
                  : undefined
              }
              potentialRatio={potentialRatio}
              progress={progress}
              remaining={remaining}
            />
          </>
        )}
      </section>

      <GoalEstimateSection estimate={estimate} isolated={isolated} />

      <section className="grid gap-2" data-testid="goal-detail-blockers">
        <h3 className="font-semibold">{t("goals.detail.blockersTitle")}</h3>
        {blockers.isBlocked ? (
          <ul className="grid gap-1 text-amber-700">
            {uniqueBlockerReasons.map((reason, index) => {
              const missingPrerequisite =
                reason.kind === "MissingAscensionPrerequisite" ||
                reason.kind === "MissingUnlockPrerequisite"
                  ? reason
                  : null
              return (
                <li className="grid justify-items-start gap-2" key={index}>
                  <span>{blockerReasonText(t, reason)}</span>
                  {missingPrerequisite ? (
                    <>
                      {missingPrerequisite.existingGoalId ? (
                        <span className="text-xs">
                          {t("goals.blocked.existingPrerequisiteGuidance")}
                        </span>
                      ) : null}
                      <Button
                        onClick={() =>
                          missingPrerequisite.existingGoalId
                            ? onViewGoal(missingPrerequisite.existingGoalId)
                            : onCreatePrerequisite(missingPrerequisite)
                        }
                        size="xs"
                        variant="outline"
                      >
                        {missingPrerequisite.existingGoalId
                          ? t("goals.blocked.reviewPrerequisite")
                          : t("goals.blocked.createPrerequisite")}
                      </Button>
                    </>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("goals.detail.none")}</p>
        )}
      </section>

      <section className="grid gap-2">
        <h3 className="font-semibold">{t("goals.detail.dependenciesTitle")}</h3>
        {dependencies.length > 0 ? (
          dependencies.map((item) => (
            <p key={item.goalId}>
              {getEntityName(item.entityType, item.entityId)} ·{" "}
              {t(`goals.create.goalTypes.${item.goalType}`)}
            </p>
          ))
        ) : (
          <p className="text-muted-foreground">{t("goals.detail.none")}</p>
        )}
      </section>

      {farmingSummary ? (
        <section className="grid gap-2">
          <h3 className="font-semibold">
            {t("goals.detail.farmingSummaryTitle")}
          </h3>
          <p>{farmingSummary}</p>
        </section>
      ) : null}

      <section className="grid gap-2">
        <h3 className="font-semibold">{t("goals.detail.projectsTitle")}</h3>
        {assignedProjects.length > 0 ? (
          <GoalProjectBadges projects={assignedProjects} />
        ) : (
          <p className="text-muted-foreground">{t("goals.detail.none")}</p>
        )}
      </section>

      <section className="grid gap-2">
        <h3 className="font-semibold">{t("goals.detail.notes")}</h3>
        {detail.notes ? (
          <p>{detail.notes}</p>
        ) : (
          <p className="text-muted-foreground">{t("goals.detail.none")}</p>
        )}
      </section>

      <section className="grid gap-2">
        <h3 className="font-semibold">{t("goals.detail.historyTitle")}</h3>
        <ol className="grid gap-1">
          {detail.events.map((event, index) => (
            <li key={`${event.at}-${index}`}>
              {event.type === "TargetChanged"
                ? t("goals.target.historyChanged")
                : event.type}{" "}
              · {new Date(event.at).toLocaleString()}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
