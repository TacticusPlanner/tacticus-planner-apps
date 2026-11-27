import { useTranslation } from "react-i18next"
import { legendaryEventResourceIcon } from "@workspace/game-catalog"
import type { LegendaryEventResource } from "@workspace/game-catalog"
import { Coins, Flag, Sparkles, TriangleAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { MilestoneGapSection } from "@/features/legendary-event-tokens"
import type { TokenPlanView } from "@/features/legendary-event-tokens"
import type { AscensionStep } from "@/entities/legendary-event"
import { formatEventCountdown, numberFormat } from "@/shared/lib"
import { EntityIcon, IconLine } from "@/shared/ui"

import { buildCurrentRunStatusModel } from "./current-run-status.view-model"
import type {
  RunStatusGoal,
  RunStatusRow,
} from "./current-run-status.view-model"
import type { RunStatusViewModel } from "./legendary-event-page.view-model"

const ROW_ICON: Record<RunStatusRow["key"], LegendaryEventResource | null> = {
  points: "points",
  currency: null,
  chests: "chests",
  shards: "shards",
}

/**
 * The run tab's Run status (spec: Run status on the run tab): the synced values and the end-of-run
 * forecast in one Now / End of run table, the next points milestone, and one line for the next
 * character step, so each fact shows once. The Reward outlook stays on Overview.
 */
export function CurrentRunStatus({
  runStatus,
  view,
  nowMs,
}: {
  runStatus: Extract<RunStatusViewModel, { kind: "synced" }>
  view: TokenPlanView
  nowMs: number
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = numberFormat(i18n.language)
  const model = buildCurrentRunStatusModel(runStatus, view)
  const { tokens } = model
  const tokensText = tokens
    ? t("tokens", { current: tokens.current, max: tokens.max })
    : null
  const runTokens = [
    model.tokensLeft === null
      ? null
      : t("runStatus.current.tokensLeft", { count: model.tokensLeft }),
    model.fromAds > 0
      ? t("runStatus.current.fromAds", { count: model.fromAds })
      : null,
    model.bonusDelivery > 0
      ? t("runStatus.current.bonusDelivery", { count: model.bonusDelivery })
      : null,
    model.unused > 0
      ? t("runStatus.current.unused", { count: model.unused })
      : null,
  ].filter((part) => part !== null)
  const endLabel = model.endRun
    ? model.endRun.unknown
      ? t("runStatus.current.endNext")
      : t("runStatus.current.end", { run: model.endRun.run })
    : null
  const gap =
    view.kind === "ready" &&
    view.milestoneGap &&
    view.milestoneGap.run === model.endRun?.run
      ? view.milestoneGap
      : null

  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      data-testid="run-status-current"
    >
      <ul className="flex flex-col gap-1 text-sm">
        {model.run === null ? null : (
          <li className="text-muted-foreground" data-testid="run-status-run">
            {t("run", { run: model.run })}
          </li>
        )}
        {tokens && tokensText ? (
          <IconLine
            icon={legendaryEventResourceIcon("tokens")}
            testId="run-status-tokens"
          >
            {tokens.next === null
              ? tokensText
              : tokens.next.kind === "due"
                ? t("runStatus.tokensDue", { tokens: tokensText })
                : t("runStatus.tokensNext", {
                    tokens: tokensText,
                    when: formatEventCountdown(
                      tokens.next.targetMs,
                      nowMs,
                      i18n.language
                    ),
                  })}
            {runTokens.length > 0 ? (
              <span
                className="block text-xs text-muted-foreground"
                data-testid="run-status-run-tokens"
              >
                {runTokens.join(" · ")}
              </span>
            ) : null}
            {model.adTodayPending ? (
              <span
                className="block text-xs text-muted-foreground"
                data-testid="run-status-ad-today"
              >
                {t("tokenPlan.forecast.adToday")}
              </span>
            ) : null}
          </IconLine>
        ) : null}
      </ul>
      <table className="w-full text-sm" data-testid="run-status-table">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="pb-1 text-left font-normal">
              <span className="sr-only">{t("runStatus.current.resource")}</span>
            </th>
            <th className="pb-1 text-right font-normal">
              {t("runStatus.current.now")}
            </th>
            {endLabel ? (
              <th className="pb-1 text-right font-normal">{endLabel}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr data-testid={`run-status-row-${row.key}`} key={row.key}>
              <th className="py-0.5 text-left font-normal" scope="row">
                <span className="flex items-center gap-2">
                  <RowIcon resource={ROW_ICON[row.key]} />
                  {t(`runStatus.current.rows.${row.key}`)}
                </span>
              </th>
              <td className="py-0.5 text-right tabular-nums">
                {number.format(row.now)}
              </td>
              {endLabel ? (
                <td className="py-0.5 text-right tabular-nums">
                  {row.end === null ? "—" : number.format(row.end)}
                  {row.gain === null ? null : (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {t(
                        row.key === "currency"
                          ? "runStatus.current.gainEarned"
                          : "runStatus.current.gain",
                        { value: number.format(row.gain) }
                      )}
                    </span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-col gap-1 text-sm">
        <li data-testid="run-status-milestone">
          <span className="text-muted-foreground">
            {t("runStatus.milestoneLabel")}:{" "}
          </span>
          {model.milestone
            ? t("runStatus.milestone", {
                points: number.format(model.milestone.pointsToGo),
                milestone: model.milestone.milestone,
                currency: number.format(model.milestone.engramPayout),
              })
            : t("runStatus.noMilestone")}
        </li>
        {model.goal ? <GoalLine goal={model.goal} /> : null}
        {model.ohSoClose ? (
          <GlyphLine icon={TriangleAlert} testId="run-status-oh-so-close">
            {t("tokenPlan.forecast.ohSoClose", {
              shards: model.ohSoClose.shards,
              blackstone: number.format(model.ohSoClose.blackstone),
            })}
          </GlyphLine>
        ) : null}
      </ul>
      {gap ? <MilestoneGapSection gap={gap} /> : null}
    </div>
  )
}

function RowIcon({ resource }: { resource: LegendaryEventResource | null }) {
  if (resource === null) {
    return <Coins aria-hidden="true" className="size-icon shrink-0" />
  }
  return (
    <EntityIcon
      size="icon"
      alt=""
      className="shrink-0"
      src={legendaryEventResourceIcon(resource)}
    />
  )
}

function GoalLine({ goal }: { goal: RunStatusGoal }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = numberFormat(i18n.language)
  const step = (value: AscensionStep) => t(`outlook.steps.${value}`)
  if (goal.kind === "allSteps") {
    return (
      <GlyphLine icon={Sparkles} testId="run-status-goal">
        {t("tokenPlan.forecast.allSteps")}
      </GlyphLine>
    )
  }
  if (goal.kind === "thisRun") {
    const reached = t("runStatus.current.stepThisRun", {
      step: step(goal.step),
      token: goal.token,
    })
    return (
      <GlyphLine icon={Sparkles} testId="run-status-goal">
        {goal.then
          ? `${reached} · ${t("runStatus.current.then", {
              step: step(goal.then.step),
              shards: number.format(goal.then.shardsShort),
            })}`
          : reached}
      </GlyphLine>
    )
  }
  const short = t("runStatus.current.later", {
    step: step(goal.step),
    shards: number.format(goal.shardsShort),
  })
  return (
    <GlyphLine icon={Flag} testId="run-status-goal">
      {goal.at
        ? `${short} · ${t("runStatus.current.laterAt", {
            token: goal.at.token,
            run: goal.at.run,
          })}`
        : short}
    </GlyphLine>
  )
}

function GlyphLine({
  icon: Icon,
  children,
  testId,
}: {
  icon: LucideIcon
  children: ReactNode
  testId: string
}) {
  return (
    <li className="flex items-center gap-1.5" data-testid={testId}>
      <Icon
        aria-hidden="true"
        className="size-icon shrink-0 text-muted-foreground"
      />
      <span className="min-w-0">{children}</span>
    </li>
  )
}
