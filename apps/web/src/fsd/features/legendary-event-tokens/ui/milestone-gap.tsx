import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowLeftRight,
  ChevronsUp,
  CircleCheck,
  Layers,
  Target,
  Users,
} from "lucide-react"
import { legendaryEventResourceIcon } from "@workspace/game-catalog"

import { AnnotationMarkIcon } from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import type {
  MilestoneGap,
  MilestonePush,
  PushToken,
} from "../lib/milestone-push"

const pointsIcon = legendaryEventResourceIcon("points")
const tokensIcon = legendaryEventResourceIcon("tokens")

type PushKind = MilestonePush["kind"]

const KIND_ORDER: readonly PushKind[] = [
  "maybeClear",
  "stopHere",
  "belowEstimate",
]

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

/** Why a push is listed, as an icon: the Maybe clear mark, another team, or one more battle. */
function KindIcon({ kind, label }: { kind: PushKind; label?: string }) {
  const a11y = label
    ? { "aria-label": label, role: "img" as const }
    : { "aria-hidden": true as const }
  if (kind === "maybeClear") {
    return (
      <span className="inline-flex shrink-0" {...a11y}>
        <AnnotationMarkIcon status="maybeClear" />
      </span>
    )
  }
  const Icon = kind === "stopHere" ? Users : ChevronsUp
  return <Icon className="size-4 shrink-0 text-muted-foreground" {...a11y} />
}

function IconText({
  icon,
  children,
  testId,
}: {
  icon: ReactNode
  children: ReactNode
  testId?: string
}) {
  return (
    <span className="inline-flex items-center gap-1" data-testid={testId}>
      {icon}
      <span>{children}</span>
    </span>
  )
}

/**
 * "Close the gap" (spec: close the gap): when the run in progress falls just short of its next
 * reward step, the left-out battles that could close it, best first, one token each. A row is the
 * reason icon, the battle and its points gain; below it the team and, by a swap icon, the token it
 * replaces. A legend names the reason icons (and so what is checked); a failed try's cost is one
 * footer line by the token icon when every push shares it.
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
  const footIcon = "size-3.5 shrink-0"
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
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {gap.combined ? (
          <IconText
            icon={<Layers aria-hidden="true" className={footIcon} />}
            testId="milestone-gap-combined"
          >
            {t("tokenPlan.closeGap.combined", {
              count: gap.combined.indexes.length,
              points: number.format(gap.combined.gain),
            })}
          </IconText>
        ) : gap.pushes.some((push) => push.closesGap) ? null : (
          <p data-testid="milestone-gap-short">
            {t("tokenPlan.closeGap.short")}
          </p>
        )}
        {sharedRetry ? (
          <IconText
            icon={
              <EntityIcon
                alt={t("tokenPlan.forecast.summary.tokens")}
                className={footIcon}
                src={tokensIcon}
              />
            }
            testId="milestone-gap-retry"
          >
            {sharedRetry.displaces
              ? t("tokenPlan.closeGap.retry", {
                  where: where(sharedRetry.displaces),
                  lost: number.format(sharedRetry.displaces.points),
                })
              : t("tokenPlan.closeGap.retrySpare")}
          </IconText>
        ) : null}
        <p
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1"
          data-testid="milestone-gap-scope"
        >
          <span>{t("tokenPlan.closeGap.scope")}</span>
          {KIND_ORDER.map((kind) => (
            <IconText icon={<KindIcon kind={kind} />} key={kind}>
              {t(`tokenPlan.closeGap.kinds.${kind}`)}
            </IconText>
          ))}
        </p>
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
  const small = "size-3.5 shrink-0"
  return (
    <li
      className="flex min-w-0 flex-col text-sm"
      data-index={index}
      data-kind={push.kind}
      data-testid="milestone-gap-push"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <KindIcon
            kind={push.kind}
            label={t(`tokenPlan.closeGap.kinds.${push.kind}`)}
          />
          {where(push.token)}
          {push.closesGap ? (
            <CircleCheck
              aria-label={t("tokenPlan.closeGap.closes")}
              className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              role="img"
            />
          ) : null}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums">
          <EntityIcon
            alt={t("tokenPlan.forecast.summary.points")}
            className="size-4 shrink-0"
            src={pointsIcon}
          />
          {t("tokenPlan.closeGap.gain", { points: number.format(push.gain) })}
        </span>
      </span>
      <span
        className="flex flex-wrap items-center gap-x-2.5 pl-5.5 text-xs text-muted-foreground"
        data-testid="milestone-gap-details"
      >
        <span className="min-w-0">{push.token.teamName}</span>
        {push.displaced ? (
          <IconText
            icon={
              <ArrowLeftRight
                aria-label={t("tokenPlan.closeGap.replacesLabel")}
                className={small}
                role="img"
              />
            }
          >
            {t("tokenPlan.closeGap.replaces", {
              where: where(push.displaced),
              lost: number.format(push.displaced.points),
            })}
          </IconText>
        ) : null}
        {showRetry && push.retry.displaces ? (
          <IconText
            icon={
              <EntityIcon
                alt={t("tokenPlan.closeGap.retryLabel")}
                className={small}
                src={tokensIcon}
              />
            }
          >
            {t("tokenPlan.closeGap.retryRow", {
              where: where(push.retry.displaces),
            })}
          </IconText>
        ) : null}
      </span>
    </li>
  )
}
