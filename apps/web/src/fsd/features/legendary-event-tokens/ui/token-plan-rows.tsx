import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Flag, Pencil } from "lucide-react"
import { legendaryEventResourceIcon } from "@workspace/game-catalog"

import type {
  EventUnitChipData,
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
import type { TeamClearDepth, TokenPlanView } from "../lib/token-plan-view"
import type { RunTokenSection } from "../lib/token-runs"
import { unknownChip } from "../lib/unit-chips"
import { BattleInfoButton } from "./battle-info"
import { TokenMissionSteps } from "./mission-order-view"
import { TokenObjectives } from "./token-objectives"
import { TokenMissionsPopover, TokenTeamPopover } from "./token-popovers"

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

/** Plan tokens `start`..`start + count − 1` grouped by consecutive team (its name, then its
 *  members' portraits opening the team's details), each team's consecutive battles of one lane
 *  clearing the same cells folded into one expandable row. A team playing a single row carries
 *  that row on its header (on mobile the team, members and points share the first line). */
export function TokenGroups({
  tokens,
  start,
  count,
  markers,
  steps,
  event,
  isMobile,
  onOpenTeam,
  membersByTeam,
  depthByTeam,
  chipOf = unknownChip,
  expandRuns = false,
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
  /** Non-reserve members by team id, shown as portraits beside the team name. */
  membersByTeam: ReadonlyMap<string, readonly string[]>
  /** Each team's clear depth, for the team popover. */
  depthByTeam: ReadonlyMap<string, TeamClearDepth>
  /** A unit's chip in the team popover (rank, rarity, abilities from the synced roster). */
  chipOf?: (unitId: string) => EventUnitChipData
  /** Whether the folded battle rows start expanded (the Token plan's Expand all). */
  expandRuns?: boolean
}) {
  return (
    <ol className="flex min-w-0 flex-col divide-y">
      {groupTokensByTeam(tokens.slice(start, start + count)).map((group) => {
        const runs = groupTokenBattleRuns(group.tokens, start + group.start)
        const header = (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <h4 className="min-w-0 text-sm font-semibold">
              <TeamName
                laneId={group.tokens[0]?.laneId}
                onOpenTeam={onOpenTeam}
                teamId={group.teamId}
                teamName={group.teamName}
              />
            </h4>
            <TokenTeamPopover
              depth={depthByTeam.get(group.teamId)}
              members={(membersByTeam.get(group.teamId) ?? []).map((unitId) =>
                chipOf(unitId)
              )}
              teamName={group.teamName}
              testId="token-plan-team-members"
            />
          </div>
        )
        const single = runs.length === 1
        return (
          <li
            className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0"
            data-team={group.teamId}
            data-testid="token-plan-group"
            key={start + group.start}
          >
            {single ? null : header}
            <ol className="flex min-w-0 flex-col divide-y">
              {runs.map((run) => {
                const first = run.tokens[0]
                const teamHeader = single ? header : undefined
                if (run.tokens.length === 1 && first) {
                  return (
                    <TokenRow
                      event={event}
                      index={run.start}
                      isMobile={isMobile}
                      key={run.start}
                      marker={markers[run.start]}
                      showCount
                      steps={steps?.[run.start]}
                      teamHeader={teamHeader}
                      token={first}
                    />
                  )
                }
                return (
                  <TokenBattleRunRow
                    defaultExpanded={expandRuns}
                    event={event}
                    isMobile={isMobile}
                    // Expand all / Collapse all resets every row to the new choice.
                    key={`${run.start}-${expandRuns}`}
                    markers={markers}
                    start={run.start}
                    steps={steps}
                    teamHeader={teamHeader}
                    tokens={run.tokens}
                  />
                )
              })}
            </ol>
          </li>
        )
      })}
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
      className="group inline-flex max-w-full items-center gap-1 rounded-sm text-left hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      data-testid="token-plan-team"
      onClick={() => onOpenTeam(laneId, teamId)}
      type="button"
    >
      <span className="truncate">{teamName}</span>
      <Pencil
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground"
      />
    </button>
  )
}

/** A row's token count: the event's token icon and the number. */
function TokenCount({ count }: { count: number }) {
  const { t } = useTranslation("legendaryEvents")
  const label = t("tokenPlan.plan.tokens", { count })
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 text-muted-foreground tabular-nums"
      data-count={count}
      data-testid="token-plan-token-count"
      title={label}
    >
      <EntityIcon
        alt=""
        className="size-4 shrink-0"
        src={legendaryEventResourceIcon("tokens")}
      />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** A row's two mobile lines. With the team header (a team's only row) the team and members share
 *  the first line with the points, then lane, battle, tokens and cells ahead of the running total;
 *  otherwise lane and battle lead the first line and the cells the second. */
function MobileRowLines({
  teamHeader,
  toggle,
  count,
  lane,
  battle,
  cells,
  points,
  running,
}: {
  teamHeader: ReactNode | undefined
  toggle: ReactNode
  count: ReactNode
  lane: string
  battle: ReactNode
  cells: ReactNode
  points: ReactNode
  running: ReactNode
}) {
  if (teamHeader) {
    return (
      <>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0">{teamHeader}</div>
          {points}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
            {toggle}
            <span className="shrink-0">{lane} ·</span>
            <span className="min-w-0">{battle}</span>
            {count}
            {cells}
          </span>
          {running}
        </div>
      </>
    )
  }
  return (
    <>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {toggle}
          {count}
          <span className="shrink-0">· {lane} ·</span>
          <span className="min-w-0">{battle}</span>
        </span>
        {points}
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center justify-between gap-2",
          toggle ? "pl-7" : null
        )}
      >
        {cells}
        {running}
      </div>
    </>
  )
}

/** Consecutive battles of one lane clearing the same cells as one row: its token count, "Alpha ·
 *  Battles 1–11" (opening the first battle's info), the cells, the summed points and the running
 *  points after the last, then each battle's points and every milestone reached; a separate button
 *  expands the per-battle rows (which then carry the markers). */
function TokenBattleRunRow({
  event,
  tokens,
  start,
  markers,
  steps,
  isMobile,
  teamHeader,
  defaultExpanded,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  tokens: readonly PlannedTokenRow[]
  start: number
  markers: readonly (TokenMarker | undefined)[]
  steps: readonly (readonly TokenMissionStep[])[] | undefined
  isMobile: boolean
  /** The team's header, when this is the team's only row. */
  teamHeader?: ReactNode
  defaultExpanded: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const [expanded, setExpanded] = useState(defaultExpanded)
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
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
  const count = <TokenCount count={tokens.length} />
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
  const cells = (
    <span className="flex min-w-0 items-center gap-2">
      <TokenObjectives
        clearedIds={first.clearedIds}
        compact
        lane={event[first.laneId]}
      />
      {tokens.some((token) => token.maybe) ? <MaybeFlag /> : null}
    </span>
  )

  return (
    <li
      className="flex min-w-0 flex-col gap-1 py-1.5 text-sm"
      data-count={tokens.length}
      data-index={start}
      data-testid="token-plan-run"
    >
      {isMobile ? (
        <MobileRowLines
          battle={battle}
          cells={cells}
          count={count}
          lane={lane}
          points={points}
          running={running}
          teamHeader={teamHeader}
          toggle={toggle}
        />
      ) : (
        <>
          {teamHeader}
          <div className={ROW_GRID}>
            <span className="flex items-center gap-1">
              {toggle}
              {count}
            </span>
            <span>{lane}</span>
            <span>{battle}</span>
            {cells}
            <span className="text-right">{points}</span>
            <span className="text-right">{running}</span>
          </div>
        </>
      )}
      {expanded ? null : (
        <ul
          aria-label={t("tokenPlan.plan.battlePointsLabel")}
          className="flex flex-wrap gap-x-3 text-xs text-muted-foreground tabular-nums"
          data-testid="token-plan-run-battle-points"
        >
          {tokens.map((token) => (
            <li className="whitespace-nowrap" key={token.battleIndex}>
              {t("tokenPlan.plan.battlePoints", {
                battle: token.battleIndex + 1,
                points: number.format(token.points),
              })}
            </li>
          ))}
        </ul>
      )}
      {expanded ? null : (
        <TokenMarkerList
          milestones={runMarkers.flatMap((marker) => marker?.milestones ?? [])}
          steps={runMarkers.flatMap((marker) => marker?.steps ?? [])}
        />
      )}
      {expanded ? (
        <ol className="flex min-w-0 flex-col divide-y" id={regionId}>
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
    <span className="font-medium tabular-nums">
      {t("tokenPlan.plan.points", { points })}
    </span>
  )
}

function RunningFigure({ points }: { points: string }) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span className="shrink-0 text-muted-foreground tabular-nums">
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

/** The milestones a row reaches (muted, one line when several) and the reward steps it reaches
 *  (highlighted: the moments that matter). */
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
  const milestoneItem = (key: string, text: string) => (
    <li
      className="inline-flex items-center gap-1 text-muted-foreground"
      key={key}
    >
      <Flag aria-hidden="true" className="size-3 shrink-0" />
      {text}
    </li>
  )
  return (
    <ul
      className="flex flex-wrap gap-x-3 text-xs font-medium"
      data-testid="token-plan-marker"
    >
      {milestones.length > 1
        ? milestoneItem(
            "milestones",
            t("tokenPlan.plan.milestones", {
              first: milestones[0]!.milestone,
              last: milestones.at(-1)!.milestone,
              currency: number.format(
                milestones.reduce((sum, entry) => sum + entry.payout, 0)
              ),
            })
          )
        : milestones.map((entry) =>
            milestoneItem(
              `m${entry.milestone}`,
              t("tokenPlan.plan.milestone", {
                milestone: entry.milestone,
                currency: number.format(entry.payout),
              })
            )
          )}
      {steps.map((step, index) => (
        <li className="text-primary" key={`${step}${index}`}>
          {t("tokenPlan.plan.step", { step: t(`outlook.steps.${step}`) })}
        </li>
      ))}
    </ul>
  )
}

/** One planned token: its token count (a team's or a run's own row) or plan number (Up next), lane,
 *  battle (opening its info on the event page), cleared objectives, points and running points,
 *  then its milestone and step markers. */
export function TokenRow({
  event,
  token,
  index,
  marker,
  steps,
  isMobile,
  missionsPopover = false,
  showCount = false,
  teamHeader,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  token: PlannedTokenRow
  index: number
  marker: TokenMarker | undefined
  steps: readonly TokenMissionStep[] | undefined
  isMobile: boolean
  /** Show the missions it moves behind an icon button (the Next token card's Up next). */
  missionsPopover?: boolean
  /** Lead with the token count (one) instead of nothing (an expanded run's battle rows). */
  showCount?: boolean
  /** The team's header, when this is the team's only row. */
  teamHeader?: ReactNode
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
  const missionsButton =
    missionsPopover && steps ? (
      <TokenMissionsPopover
        gains={gainsFromSteps(steps)}
        testId={`token-plan-row-missions-${index}`}
      />
    ) : null
  const cells = (
    <span className="flex min-w-0 items-center gap-2">
      <TokenObjectives
        clearedIds={token.clearedIds}
        compact
        lane={event[token.laneId]}
      />
      {token.maybe ? <MaybeFlag /> : null}
      {missionsButton}
    </span>
  )
  const lead = missionsPopover ? (
    <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
  ) : showCount ? (
    <TokenCount count={1} />
  ) : null

  return (
    <li
      className="flex min-w-0 flex-col gap-1 py-1.5 text-sm"
      data-index={index}
      data-testid="token-plan-row"
    >
      {isMobile ? (
        <MobileRowLines
          battle={battle}
          cells={cells}
          count={lead}
          lane={lane}
          points={points}
          running={running}
          teamHeader={teamHeader}
          toggle={null}
        />
      ) : (
        <>
          {teamHeader}
          <div className={missionsPopover ? UP_NEXT_GRID : ROW_GRID}>
            <span
              className={cn(
                "flex items-center tabular-nums",
                !missionsPopover && "pl-7"
              )}
            >
              {missionsPopover ? (
                <span className="text-muted-foreground">{index + 1}</span>
              ) : (
                lead
              )}
            </span>
            <span>{lane}</span>
            <span>{battle}</span>
            {cells}
            <span className="text-right">{points}</span>
            <span className="text-right">{running}</span>
          </div>
        </>
      )}
      {marker ? (
        <TokenMarkerList milestones={marker.milestones} steps={marker.steps} />
      ) : null}
      {steps && !missionsPopover ? <TokenMissionSteps steps={steps} /> : null}
    </li>
  )
}
