import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import type { LegendaryEvent } from "@/entities/legendary-event"

import type { TokenMarker } from "../lib/run-forecast"
import { groupTokensByTeam } from "../lib/token-groups"
import type { TokenPlanView } from "../lib/token-plan-view"
import type { RunTokenSection } from "../lib/token-runs"
import { TokenObjectives } from "./token-objectives"

type ReadyView = Extract<TokenPlanView, { kind: "ready" }>
type PlannedTokenRow = ReadyView["plan"]["tokens"][number]

export function RunSection({
  header,
  testId,
  children,
}: {
  header: ReactNode
  testId: string
  children: ReactNode
}) {
  return (
    <li className="flex min-w-0 flex-col gap-2" data-testid={testId}>
      <div className="border-b pb-1">{header}</div>
      {children}
    </li>
  )
}

/** "Run 2 · Now" then, when the run uses tokens, "6 of 32 tokens · +1,136 points · ends at 6,136"
 *  (one line on desktop, wrapping to two on mobile). */
export function RunSectionHeader({
  section,
  plan,
}: {
  section: RunTokenSection
  plan: ReadyView["plan"]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const state = t(`tokenPlan.forecast.states.${section.state}`)
  const title = section.unknownRun
    ? t("tokenPlan.plan.byRun.titleUnknown", { state })
    : t("tokenPlan.plan.byRun.title", { run: section.run, state })
  const tokens = plan.tokens.slice(section.start, section.start + section.count)
  const points = tokens.reduce((sum, token) => sum + token.points, 0)
  return (
    <h3
      className="flex min-w-0 flex-wrap items-baseline gap-x-3 text-sm"
      data-run={section.run}
    >
      <span className="font-semibold">{title}</span>
      {section.count > 0 ? (
        <span
          className="text-muted-foreground tabular-nums"
          data-testid="token-plan-run-figures"
        >
          {t("tokenPlan.plan.byRun.figures", {
            used: number.format(section.count),
            count: section.available,
            available: number.format(section.available),
            points: number.format(points),
            ending: number.format(tokens.at(-1)?.runningPoints ?? 0),
          })}
        </span>
      ) : null}
    </h3>
  )
}

/** Plan tokens `start`..`start + count − 1` grouped by consecutive team; numbers are plan-wide. */
export function TokenGroups({
  tokens,
  start,
  count,
  markers,
  event,
  isMobile,
}: {
  tokens: readonly PlannedTokenRow[]
  start: number
  count: number
  markers: readonly (TokenMarker | undefined)[]
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  isMobile: boolean
}) {
  return (
    <ol className="flex min-w-0 flex-col gap-3">
      {groupTokensByTeam(tokens.slice(start, start + count)).map((group) => (
        <li
          className="flex min-w-0 flex-col gap-1"
          data-team={group.teamId}
          data-testid="token-plan-group"
          key={start + group.start}
        >
          <h4 className="text-sm font-semibold">{group.teamName}</h4>
          <ol className="flex min-w-0 flex-col divide-y">
            {group.tokens.map((token, offset) => {
              const index = start + group.start + offset
              return (
                <TokenRow
                  event={event}
                  index={index}
                  isMobile={isMobile}
                  key={index}
                  marker={markers[index]}
                  token={token}
                />
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}

function TokenRow({
  event,
  token,
  index,
  marker,
  isMobile,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  token: PlannedTokenRow
  index: number
  marker: TokenMarker | undefined
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lane = t(`lanes.${token.laneId}`)
  const battle = t("tokenPlan.plan.battle", { battle: token.battleIndex + 1 })
  const points = (
    <span className="font-medium tabular-nums">
      {t("tokenPlan.plan.points", { points: number.format(token.points) })}
    </span>
  )
  const running = (
    <span className="text-muted-foreground tabular-nums">
      {t("tokenPlan.plan.running", {
        points: number.format(token.runningPoints),
      })}
    </span>
  )
  const objectives = (
    <TokenObjectives
      clearedIds={token.clearedIds}
      compact
      lane={event[token.laneId]}
    />
  )
  const maybe = token.maybe ? (
    <span
      className="text-xs text-amber-700 dark:text-amber-400"
      data-testid="token-plan-maybe"
    >
      {t("tokenPlan.plan.maybe")}
    </span>
  ) : null

  return (
    <li
      className="flex min-w-0 flex-col gap-1 py-1.5 text-sm"
      data-index={index}
      data-testid="token-plan-row"
    >
      {isMobile ? (
        <>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground tabular-nums">
                {index + 1}.
              </span>{" "}
              {lane} · {battle}
            </span>
            {points}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {objectives}
              {maybe}
            </span>
            {running}
          </div>
        </>
      ) : (
        <div className="grid min-w-0 grid-cols-[2rem_4.5rem_5.5rem_minmax(0,1fr)_4rem_6.5rem] items-center gap-2">
          <span className="text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span>{lane}</span>
          <span>{battle}</span>
          <span className="flex min-w-0 items-center gap-2">
            {objectives}
            {maybe}
          </span>
          <span className="text-right">{points}</span>
          <span className="text-right">{running}</span>
        </div>
      )}
      {marker && (marker.milestones.length > 0 || marker.steps.length > 0) ? (
        <ul
          className="flex flex-wrap gap-x-3 text-xs font-medium text-primary"
          data-testid="token-plan-marker"
        >
          {marker.milestones.map((entry) => (
            <li key={`m${entry.milestone}`}>
              {t("tokenPlan.plan.milestone", {
                milestone: entry.milestone,
                currency: number.format(entry.payout),
              })}
            </li>
          ))}
          {marker.steps.map((step) => (
            <li key={step}>
              {t("tokenPlan.plan.step", { step: t(`outlook.steps.${step}`) })}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
