import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { legendaryEventResourceIcon } from "@workspace/game-catalog"

import type {
  LegendaryEvent,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"
import { cn } from "@workspace/ui/lib/utils"

import { gainsFromSteps } from "../lib/mission-gains"
import type { TokenMissionStep } from "../lib/mission-order"
import type { TokenMarker } from "../lib/run-forecast"
import { groupTokenBattleRuns } from "../lib/token-battle-runs"
import { groupTokensByTeam } from "../lib/token-groups"
import type { TokenPlanView } from "../lib/token-plan-view"
import type { RunTokenSection } from "../lib/token-runs"
import { BattleInfoButton } from "./battle-info"
import { TokenMissionSteps } from "./mission-order-view"
import { TokenObjectives } from "./token-objectives"
import { TokenMissionsPopover } from "./token-popovers"

type ReadyView = Extract<TokenPlanView, { kind: "ready" }>
type PlannedTokenRow = ReadyView["plan"]["tokens"][number]

/** Opens a saved team's editor (the event page's team dialog). */
export type OpenTeamHandler = (
  laneId: LegendaryEventLaneId,
  teamId: string
) => void

// The Token plan's rows leave room for a folded row's expand button; the Up next rows have none.
const ROW_GRID =
  "grid min-w-0 grid-cols-[4.5rem_4.5rem_7rem_minmax(0,1fr)_4rem_6.5rem] items-center gap-2"
const UP_NEXT_GRID =
  "grid min-w-0 grid-cols-[2rem_4.5rem_5.5rem_minmax(0,1fr)_4rem_6.5rem] items-center gap-2"

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

/** Plan tokens `start`..`start + count − 1` grouped by consecutive team, each team's consecutive
 *  battles of one lane clearing the same cells folded into one expandable row; numbers are
 *  plan-wide. */
export function TokenGroups({
  tokens,
  start,
  count,
  markers,
  steps,
  event,
  isMobile,
  onOpenTeam,
}: {
  tokens: readonly PlannedTokenRow[]
  start: number
  count: number
  markers: readonly (TokenMarker | undefined)[]
  /** Per plan index, the missions each token moves (the Missions order only). */
  steps?: readonly (readonly TokenMissionStep[])[]
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  isMobile: boolean
  /** Makes the team names open the team (absent where no editor exists). */
  onOpenTeam?: OpenTeamHandler
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
          <h4 className="text-sm font-semibold">
            <TeamName
              laneId={group.tokens[0]?.laneId}
              onOpenTeam={onOpenTeam}
              teamId={group.teamId}
              teamName={group.teamName}
            />
          </h4>
          <ol className="flex min-w-0 flex-col divide-y">
            {groupTokenBattleRuns(group.tokens, start + group.start).map(
              (run) => {
                const first = run.tokens[0]
                if (run.tokens.length === 1 && first) {
                  return (
                    <TokenRow
                      event={event}
                      index={run.start}
                      isMobile={isMobile}
                      key={run.start}
                      marker={markers[run.start]}
                      steps={steps?.[run.start]}
                      token={first}
                    />
                  )
                }
                return (
                  <TokenBattleRunRow
                    event={event}
                    isMobile={isMobile}
                    key={run.start}
                    markers={markers}
                    start={run.start}
                    steps={steps}
                    tokens={run.tokens}
                  />
                )
              }
            )}
          </ol>
        </li>
      ))}
    </ol>
  )
}

function TeamName({
  laneId,
  teamId,
  teamName,
  onOpenTeam,
}: {
  laneId: LegendaryEventLaneId | undefined
  teamId: string
  teamName: string
  onOpenTeam: OpenTeamHandler | undefined
}) {
  const { t } = useTranslation("legendaryEvents")
  if (!onOpenTeam || !laneId) return <>{teamName}</>
  return (
    <button
      aria-label={t("tokenPlan.plan.openTeam", { team: teamName })}
      className="rounded-sm text-left underline decoration-dotted underline-offset-4 hover:decoration-solid focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      data-testid="token-plan-team"
      onClick={() => onOpenTeam(laneId, teamId)}
      type="button"
    >
      {teamName}
    </button>
  )
}

/** Consecutive battles of one lane clearing the same cells as one row: "Alpha · Battles 1–11"
 *  (opening the first battle's info), the cells, the summed points and the running points after
 *  the last, every milestone reached; a separate button expands the per-battle rows (which then
 *  carry the markers). */
function TokenBattleRunRow({
  event,
  tokens,
  start,
  markers,
  steps,
  isMobile,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  tokens: readonly PlannedTokenRow[]
  start: number
  markers: readonly (TokenMarker | undefined)[]
  steps: readonly (readonly TokenMissionStep[])[] | undefined
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const [expanded, setExpanded] = useState(false)
  const first = tokens[0]
  const last = tokens.at(-1)
  if (!first || !last) return null
  const number = new Intl.NumberFormat(i18n.language)
  const end = start + tokens.length - 1
  const regionId = `token-plan-run-${start}`
  const lane = t(`lanes.${first.laneId}`)
  const sum = tokens.reduce((total, token) => total + token.points, 0)
  const runMarkers = markers.slice(start, end + 1)
  const toggle = (
    <button
      aria-controls={regionId}
      aria-expanded={expanded}
      aria-label={t(
        expanded ? "tokenPlan.plan.collapseRun" : "tokenPlan.plan.expandRun",
        { count: tokens.length }
      )}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      data-testid="token-plan-run-toggle"
      onClick={() => setExpanded(!expanded)}
      type="button"
    >
      <ChevronRight
        aria-hidden="true"
        className={expanded ? "size-4 rotate-90" : "size-4"}
      />
    </button>
  )
  const range = (
    <span className="text-muted-foreground tabular-nums">
      {start + 1}–{end + 1}
    </span>
  )
  const battle = (
    <BattleInfoButton battleIndex={first.battleIndex} laneId={first.laneId}>
      {t("tokenPlan.plan.battles", {
        first: first.battleIndex + 1,
        last: last.battleIndex + 1,
      })}
    </BattleInfoButton>
  )
  const points = <PointsFigure points={number.format(sum)} />
  const running = <RunningFigure points={number.format(last.runningPoints)} />
  const objectives = (
    <TokenObjectives
      clearedIds={first.clearedIds}
      compact
      lane={event[first.laneId]}
    />
  )
  const maybe = tokens.some((token) => token.maybe) ? <MaybeFlag /> : null

  return (
    <li
      className="flex min-w-0 flex-col gap-1 py-1.5 text-sm"
      data-count={tokens.length}
      data-index={start}
      data-testid="token-plan-run"
    >
      {isMobile ? (
        <>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1">
              {toggle}
              {range}
              <span className="shrink-0">· {lane} ·</span>
              {battle}
            </span>
            {points}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 pl-7">
            <span className="flex min-w-0 items-center gap-2">
              {objectives}
              {maybe}
            </span>
            {running}
          </div>
        </>
      ) : (
        <div className={ROW_GRID}>
          <span className="flex items-center gap-1">
            {toggle}
            {range}
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
      {expanded ? null : (
        <TokenMarkerList
          milestones={runMarkers.flatMap((marker) => marker?.milestones ?? [])}
          steps={runMarkers.flatMap((marker) => marker?.steps ?? [])}
        />
      )}
      {expanded ? (
        <ol
          className="flex min-w-0 flex-col divide-y border-l pl-2"
          id={regionId}
        >
          {tokens.map((token, offset) => {
            const index = start + offset
            return (
              <TokenRow
                event={event}
                index={index}
                isMobile={isMobile}
                key={index}
                marker={markers[index]}
                steps={steps?.[index]}
                token={token}
              />
            )
          })}
        </ol>
      ) : null}
    </li>
  )
}

function PointsFigure({ points }: { points: string }) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span className="inline-flex items-center gap-1 font-medium tabular-nums">
      <EntityIcon
        alt=""
        className="size-3.5 shrink-0"
        src={legendaryEventResourceIcon("points")}
      />
      {t("tokenPlan.plan.points", { points })}
    </span>
  )
}

function RunningFigure({ points }: { points: string }) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span className="text-muted-foreground tabular-nums">
      {t("tokenPlan.plan.running", { points })}
    </span>
  )
}

function MaybeFlag() {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span
      className="text-xs text-amber-700 dark:text-amber-400"
      data-testid="token-plan-maybe"
    >
      {t("tokenPlan.plan.maybe")}
    </span>
  )
}

function TokenMarkerList({
  milestones,
  steps,
}: {
  milestones: TokenMarker["milestones"]
  steps: TokenMarker["steps"]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  if (milestones.length === 0 && steps.length === 0) return null
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <ul
      className="flex flex-wrap gap-x-3 text-xs font-medium text-primary"
      data-testid="token-plan-marker"
    >
      {milestones.map((entry) => (
        <li key={`m${entry.milestone}`}>
          {t("tokenPlan.plan.milestone", {
            milestone: entry.milestone,
            currency: number.format(entry.payout),
          })}
        </li>
      ))}
      {steps.map((step, index) => (
        <li key={`${step}${index}`}>
          {t("tokenPlan.plan.step", { step: t(`outlook.steps.${step}`) })}
        </li>
      ))}
    </ul>
  )
}

/** One planned token: its plan number, lane, battle (opening its info on the event page), cleared
 *  objectives, points and running points, then its milestone and step markers. */
export function TokenRow({
  event,
  token,
  index,
  marker,
  steps,
  isMobile,
  missionsPopover = false,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  token: PlannedTokenRow
  index: number
  marker: TokenMarker | undefined
  steps: readonly TokenMissionStep[] | undefined
  isMobile: boolean
  /** Show the missions it moves behind an icon button (the Next token card's Up next). */
  missionsPopover?: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lane = t(`lanes.${token.laneId}`)
  const battle = (
    <BattleInfoButton battleIndex={token.battleIndex} laneId={token.laneId}>
      {t("tokenPlan.plan.battle", { battle: token.battleIndex + 1 })}
    </BattleInfoButton>
  )
  const points = <PointsFigure points={number.format(token.points)} />
  const running = <RunningFigure points={number.format(token.runningPoints)} />
  const objectives = (
    <TokenObjectives
      clearedIds={token.clearedIds}
      compact
      lane={event[token.laneId]}
    />
  )
  const maybe = token.maybe ? <MaybeFlag /> : null
  const missionsButton =
    missionsPopover && steps ? (
      <TokenMissionsPopover
        gains={gainsFromSteps(steps)}
        testId={`token-plan-row-missions-${index}`}
      />
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
            <span className="flex min-w-0 items-baseline gap-1">
              <span className="text-muted-foreground tabular-nums">
                {index + 1}.
              </span>
              <span className="shrink-0">{lane} ·</span>
              {battle}
            </span>
            {points}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {objectives}
              {maybe}
              {missionsButton}
            </span>
            {running}
          </div>
        </>
      ) : (
        <div className={missionsPopover ? UP_NEXT_GRID : ROW_GRID}>
          <span
            className={cn(
              "text-muted-foreground tabular-nums",
              !missionsPopover && "pl-7"
            )}
          >
            {index + 1}
          </span>
          <span>{lane}</span>
          <span>{battle}</span>
          <span className="flex min-w-0 items-center gap-2">
            {objectives}
            {maybe}
            {missionsButton}
          </span>
          <span className="text-right">{points}</span>
          <span className="text-right">{running}</span>
        </div>
      )}
      {marker ? (
        <TokenMarkerList milestones={marker.milestones} steps={marker.steps} />
      ) : null}
      {steps && !missionsPopover ? <TokenMissionSteps steps={steps} /> : null}
    </li>
  )
}
