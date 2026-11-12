import { useTranslation } from "react-i18next"
import { CircleCheck, Target } from "lucide-react"

import type {
  MilestoneGap,
  MilestonePush,
  PushToken,
} from "../lib/milestone-push"

/**
 * "Close the gap" (spec: close the gap): when the run in progress falls just short of its next
 * reward step, the left-out battles (Stop here, or a team's depth lowered below its estimate) that
 * could close it, best first, each one token, with what it pushes out and what a retry would cost.
 */
export function MilestoneGapSection({ gap }: { gap: MilestoneGap }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  if (gap.pushes.length === 0) return null
  return (
    <section
      aria-labelledby={`milestone-gap-title-${gap.run}`}
      className="flex min-w-0 flex-col gap-2 rounded-lg border border-dashed p-2"
      data-testid="milestone-gap"
    >
      <h4
        className="flex items-center gap-1.5 text-sm font-semibold"
        id={`milestone-gap-title-${gap.run}`}
      >
        <Target aria-hidden="true" className="size-4 shrink-0" />
        {t("tokenPlan.closeGap.title", {
          points: number.format(gap.pointsNeeded),
          step: t(`outlook.steps.${gap.step}`),
        })}
      </h4>
      <ol className="flex flex-col gap-2">
        {gap.pushes.map((push, index) => (
          <PushRow index={index} key={index} push={push} />
        ))}
      </ol>
      {gap.combined ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="milestone-gap-combined"
        >
          {t("tokenPlan.closeGap.combined", {
            count: gap.combined.indexes.length,
            points: number.format(gap.combined.gain),
          })}
        </p>
      ) : gap.pushes.some((push) => push.closesGap) ? null : (
        <p
          className="text-xs text-muted-foreground"
          data-testid="milestone-gap-short"
        >
          {t("tokenPlan.closeGap.short")}
        </p>
      )}
    </section>
  )
}

function PushRow({ push, index }: { push: MilestonePush; index: number }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const where = (token: PushToken) =>
    t("tokenPlan.closeGap.where", {
      lane: t(`lanes.${token.laneId}`),
      battle: token.battleIndex + 1,
    })
  return (
    <li
      className="flex min-w-0 flex-col gap-0.5 text-sm"
      data-index={index}
      data-kind={push.kind}
      data-testid="milestone-gap-push"
    >
      <span className="flex flex-wrap items-center gap-x-1.5">
        {push.closesGap ? (
          <CircleCheck
            aria-label={t("tokenPlan.closeGap.closes")}
            className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
            role="img"
          />
        ) : null}
        <span className="font-medium">
          {t(`tokenPlan.closeGap.${push.kind}`, {
            team: push.token.teamName,
            where: where(push.token),
          })}
        </span>
      </span>
      <span className="text-xs text-muted-foreground">
        {push.displaced
          ? t("tokenPlan.closeGap.gainReplacing", {
              points: number.format(push.gain),
              where: where(push.displaced),
              lost: number.format(push.displaced.points),
            })
          : t("tokenPlan.closeGap.gain", { points: number.format(push.gain) })}
      </span>
      <span
        className="text-xs text-muted-foreground"
        data-testid="milestone-gap-retry"
      >
        {push.retry.displaces
          ? t("tokenPlan.closeGap.retry", {
              where: where(push.retry.displaces),
              lost: number.format(push.retry.displaces.points),
            })
          : t("tokenPlan.closeGap.retrySpare")}
      </span>
    </li>
  )
}
