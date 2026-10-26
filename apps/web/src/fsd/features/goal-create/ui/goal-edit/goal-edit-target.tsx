import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { rankAt } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import { ProgressionBadge, RankBadge } from "@/shared/ui"

import { hasGoalTargetStart } from "../../model/target-edit/goal-target-edit"
import { InfoHint } from "../shared/info-hint"

/** The Edit goal dialog's goal section: its heading and where the goal started (for a goal with a
 * target; an Unlock goal has neither), then the goal's card. */
export function GoalEditTarget({
  detail,
  children,
}: {
  detail: GoalDetail
  children: ReactNode
}) {
  const { t } = useTranslation()
  if (detail.goalType === "Unlock") return <section>{children}</section>

  return (
    <section className="grid gap-2" data-testid="goal-edit-target">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-1.5 font-semibold">
          {t("goals.target.title")}
          <InfoHint text={t("goals.target.reachedNote")} />
        </h3>
        {hasGoalTargetStart(detail) ? (
          <div
            className="flex items-center gap-2 text-muted-foreground"
            data-testid="goal-target-started-from"
          >
            <span>{t("goals.target.startedFrom")}</span>
            <GoalTargetStart detail={detail} />
          </div>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** The goal's stored starting point. Ability names its tracks: Active/Passive, or Primary/Secondary
 * for a Machine of War. */
function GoalTargetStart({ detail }: { detail: GoalDetail }) {
  const { t } = useTranslation()
  const { config } = detail
  const isMow = detail.entityType === "Mow"
  switch (detail.goalType) {
    case "Rank":
      return config.rank ? <RankBadge rank={rankAt(config.rank.start)} /> : null
    case "Ascension":
      return config.progression ? (
        <ProgressionBadge value={config.progression.start} />
      ) : null
    case "Ability":
      return config.ability ? (
        <span data-testid="goal-target-start-ability">
          {t("goals.create.ability.trackLevel", {
            track: t(
              isMow
                ? "goals.create.ability.tracks.primary"
                : "goals.create.ability.tracks.active"
            ),
            level: config.ability.activeStart,
          })}
          {" · "}
          {t("goals.create.ability.trackLevel", {
            track: t(
              isMow
                ? "goals.create.ability.tracks.secondary"
                : "goals.create.ability.tracks.passive"
            ),
            level: config.ability.passiveStart,
          })}
        </span>
      ) : null
    default:
      return null
  }
}
