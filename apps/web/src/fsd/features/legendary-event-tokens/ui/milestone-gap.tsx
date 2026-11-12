import { useTranslation } from "react-i18next"
import { CircleCheck, Target } from "lucide-react"

import type {
  MilestoneGap,
  MilestonePush,
  PushToken,
} from "../lib/milestone-push"

const tokenKey = (token: PushToken | null) =>
  token ? `${token.laneId}:${token.battleIndex}:${token.teamId}` : "spare"

/** "Beta battle 9": a token's lane and 1-based battle. */
function useWhere() {
  const { t } = useTranslation("legendaryEvents")
  return (token: PushToken) =>
    t("tokenPlan.closeGap.where", {
      lane: t(`lanes.${token.laneId}`),
      battle: token.battleIndex + 1,
    })
}

/**
 * "Close the gap" (spec: close the gap): when the run in progress falls just short of its next
 * reward step, the left-out battles that could close it, best first, one token each: the battle
 * and its gain on one line, the team, why it was left out and what it replaces on the next. What a
 * failed try costs is one footer line when every push shares it.
 */
export function MilestoneGapSection({ gap }: { gap: MilestoneGap }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const where = useWhere()
  if (gap.pushes.length === 0) return null
  const retries = new Set(
    gap.pushes.map((push) => tokenKey(push.retry.displaces))
  )
  const sharedRetry = retries.size === 1 ? gap.pushes[0]!.retry : null
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
      <ol className="flex flex-col gap-1.5">
        {gap.pushes.map((push, index) => (
          <PushRow
            index={index}
            key={index}
            push={push}
            showRetry={sharedRetry === null}
          />
        ))}
      </ol>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {gap.combined ? (
          <p data-testid="milestone-gap-combined">
            {t("tokenPlan.closeGap.combined", {
              count: gap.combined.indexes.length,
              points: number.format(gap.combined.gain),
            })}
          </p>
        ) : gap.pushes.some((push) => push.closesGap) ? null : (
          <p data-testid="milestone-gap-short">
            {t("tokenPlan.closeGap.short")}
          </p>
        )}
        {sharedRetry ? (
          <p data-testid="milestone-gap-retry">
            {sharedRetry.displaces
              ? t("tokenPlan.closeGap.retry", {
                  where: where(sharedRetry.displaces),
                  lost: number.format(sharedRetry.displaces.points),
                })
              : t("tokenPlan.closeGap.retrySpare")}
          </p>
        ) : null}
        <p data-testid="milestone-gap-scope">{t("tokenPlan.closeGap.scope")}</p>
      </div>
    </section>
  )
}

function PushRow({
  push,
  index,
  showRetry,
}: {
  push: MilestonePush
  index: number
  /** The pushes' retries differ, so each row names its own. */
  showRetry: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const where = useWhere()
  const details = [
    t(`tokenPlan.closeGap.${push.kind}`, { team: push.token.teamName }),
    push.displaced
      ? t("tokenPlan.closeGap.replaces", {
          where: where(push.displaced),
          lost: number.format(push.displaced.points),
        })
      : null,
    showRetry && push.retry.displaces
      ? t("tokenPlan.closeGap.retryRow", {
          where: where(push.retry.displaces),
        })
      : null,
  ].filter((part) => part !== null)
  return (
    <li
      className="flex min-w-0 flex-col text-sm"
      data-index={index}
      data-kind={push.kind}
      data-testid="milestone-gap-push"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          {push.closesGap ? (
            <CircleCheck
              aria-label={t("tokenPlan.closeGap.closes")}
              className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              role="img"
            />
          ) : null}
          {where(push.token)}
        </span>
        <span className="shrink-0 font-semibold tabular-nums">
          {t("tokenPlan.closeGap.gain", { points: number.format(push.gain) })}
        </span>
      </span>
      <span
        className="text-xs text-muted-foreground"
        data-testid="milestone-gap-details"
      >
        {details.join(" · ")}
      </span>
    </li>
  )
}
