import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  EventUnitChipData,
  LegendaryEvent,
  LegendaryEventAnnotationStatus,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

import {
  gainsFromProgress,
  gainsFromSteps,
  type MissionGain,
} from "../lib/mission-gains"
import type { TokenMissionStep } from "../lib/mission-order"
import type { PlannedToken } from "../lib/token-plan"
import {
  missionsNextToken,
  upNextTokens,
  type NextTokenEmpty,
  type TokenPlanView,
} from "../lib/token-plan-view"
import { useMissionsOrder } from "../model/token-plan-order"
import { useNextTokenShown } from "../model/use-next-token-shown"
import { TokenPlanOrderSwitch } from "./mission-order-view"
import { MissionAlternativeView } from "./next-token-missions"
import { BattleInfoButton } from "./battle-info"
import { TokenMarkButtons } from "./token-mark-buttons"
import { TokenRow } from "./token-plan-rows"
import { TokenObjectives } from "./token-objectives"
import { TokenMissionsPopover, TokenTeamPopover } from "./token-popovers"

export type MarkTokenHandler = (
  laneId: LegendaryEventLaneId,
  battleIndex: number,
  objectiveIds: number[],
  status: LegendaryEventAnnotationStatus
) => void

/** Opens a lane's Teams section, scrolled to one team's card when `teamId` is given. */
export type OpenTeamsHandler = (
  laneId: LegendaryEventLaneId,
  teamId?: string
) => void

type ReadyView = Extract<TokenPlanView, { kind: "ready" }>

/**
 * The run tab's Next token card (spec: Next token card heads the run tab): the battle to play next
 * with its team, points, cleared cells and reason, and the Partly cleared / Couldn't clear
 * actions, then the next few planned tokens with View full plan; or what is missing for a plan.
 * A Points / Missions switch (shared with the Token plan) reads the plan in Missions order, with
 * the missions each token moves and the run's mission ticks. Hidden on an archived event and when
 * signed out.
 */
export function NextTokenCard({
  eventId,
  event,
  view,
  isMobile,
  onMarkToken,
  onOpenTeams,
  onViewPlan,
  missionsInput,
  chipOf = unknownChip,
}: {
  eventId: string
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  view: TokenPlanView
  isMobile: boolean
  /** Absent while marks cannot be written (the plan has not loaded). */
  onMarkToken: MarkTokenHandler | undefined
  onOpenTeams: OpenTeamsHandler
  /** Opens the full token plan. */
  onViewPlan?: () => void
  /** The run's mission ticks, shown in Missions order (the plan feature's quick input). */
  missionsInput?: ReactNode
  /** A unit's chip in the team popover (rank, rarity, abilities from the synced roster). */
  chipOf?: (unitId: string) => EventUnitChipData
}) {
  const { t } = useTranslation("legendaryEvents")
  const [byMissions, setByMissions] = useMissionsOrder()
  useNextTokenShown(eventId, view)
  if (view.kind === "hidden") return null
  const canOrder = view.kind === "ready" && view.missionOrder !== null
  const ordered =
    view.kind === "ready" && byMissions && view.next
      ? missionsNextToken(view)
      : null

  return (
    <Card data-testid="legendary-event-next-token">
      <CardHeader>
        <CardTitle>
          <h2>{t("tokenPlan.nextToken.title")}</h2>
        </CardTitle>
        {canOrder && view.kind === "ready" && view.next ? (
          <CardAction data-testid="next-token-order">
            <TokenPlanOrderSwitch
              onChange={(order) => setByMissions(order === "missions")}
              order={ordered ? "missions" : "points"}
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {view.kind === "loading" ? (
          <div data-testid="next-token-loading">
            <span className="sr-only">{t("tokenPlan.nextToken.loading")}</span>
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : null}
        {view.kind === "unavailable" ? (
          <Note testId="next-token-unavailable">
            {t("tokenPlan.nextToken.unavailable")}
          </Note>
        ) : null}
        {view.kind === "planError" ? (
          <Note testId="next-token-plan-error">{t("teams.loadError")}</Note>
        ) : null}
        {view.kind === "ready" && view.empty ? (
          <EmptyState empty={view.empty} onOpenTeams={onOpenTeams} />
        ) : null}
        {view.kind === "ready" && view.next && ordered ? (
          <div className="flex flex-col gap-3" data-order="missions">
            <TokenView
              event={event}
              isMobile={isMobile}
              onMarkToken={onMarkToken}
              chipOf={chipOf}
              gains={gainsFromSteps(ordered.steps)}
              reason={t("tokenPlan.nextToken.reasons.missionsOrder")}
              token={ordered.token}
              view={view}
            />
            {view.missions?.alternative &&
            view.missions.alternative.index !== ordered.index ? (
              <MissionAlternativeView
                alternative={view.missions.alternative}
                event={event}
                isMobile={isMobile}
                onMarkToken={view.upcoming === null ? onMarkToken : undefined}
              />
            ) : null}
            {missionsInput ? (
              <div
                className="flex min-w-0 flex-col gap-2 border-t pt-3"
                data-testid="next-token-missions-input"
              >
                {missionsInput}
              </div>
            ) : null}
            <UpNext
              event={event}
              isMobile={isMobile}
              nextIndex={ordered.index}
              onViewPlan={onViewPlan}
              steps={view.missionOrder?.steps}
              tokens={view.missionOrder?.tokens ?? []}
              total={view.plan.tokens.length}
            />
          </div>
        ) : null}
        {view.kind === "ready" && view.next && !ordered ? (
          <div className="flex flex-col gap-3" data-order="points">
            <TokenView
              event={event}
              isMobile={isMobile}
              onMarkToken={onMarkToken}
              chipOf={chipOf}
              gains={gainsFromProgress(view.missions?.progressed ?? [])}
              reason={t(`tokenPlan.nextToken.reasons.${view.next.reason}`)}
              token={view.next.token}
              view={view}
            />
            <UpNext
              event={event}
              isMobile={isMobile}
              nextIndex={view.next.index}
              onViewPlan={onViewPlan}
              steps={undefined}
              tokens={view.plan.tokens}
              total={view.plan.tokens.length}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TokenView({
  event,
  view,
  token,
  reason: reasonText,
  isMobile,
  onMarkToken,
  gains,
  chipOf,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  view: ReadyView
  token: PlannedToken
  /** Why this token is next. */
  reason: string
  isMobile: boolean
  onMarkToken: MarkTokenHandler | undefined
  /** The missions it moves. */
  gains: readonly MissionGain[]
  chipOf: (unitId: string) => EventUnitChipData
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lane = t(`lanes.${token.laneId}`)
  const battle = token.battleIndex + 1
  const members = view.membersByTeam.get(token.teamId) ?? []
  const reasonLine =
    view.upcoming === null
      ? reasonText
      : view.upcoming.run === null
        ? t("tokenPlan.nextToken.upcomingUnknown", { reason: reasonText })
        : t("tokenPlan.nextToken.upcoming", {
            reason: reasonText,
            run: view.upcoming.run,
          })
  const canMark =
    onMarkToken !== undefined && view.upcoming === null && token.playableNow

  return (
    <div
      className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4"
      data-battle={token.battleIndex}
      data-lane={token.laneId}
      data-team={token.teamId}
      data-testid="next-token-view"
    >
      <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold" data-testid="next-token-team">
            {token.teamName}
          </span>
          <TokenTeamPopover
            members={members.map((unitId) => chipOf(unitId))}
            teamName={token.teamName}
            testId="next-token-team-details"
          />
          <TokenMissionsPopover gains={gains} testId="next-token-progresses" />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span data-testid="next-token-battle">
            <BattleInfoButton
              battleIndex={token.battleIndex}
              laneId={token.laneId}
            >
              {t("tokenPlan.nextToken.battle", { lane, battle })}
            </BattleInfoButton>
          </span>
          <span
            className="font-semibold tabular-nums"
            data-testid="next-token-points"
          >
            {t("tokenPlan.nextToken.points", {
              points: number.format(token.points),
            })}
          </span>
          {token.maybe ? (
            <span
              className="text-xs text-muted-foreground"
              data-testid="next-token-maybe"
            >
              {t("tokenPlan.nextToken.maybe")}
            </span>
          ) : null}
        </div>
        <TokenObjectives
          clearedIds={token.clearedIds}
          lane={event[token.laneId]}
        />
        <p
          className="text-xs text-muted-foreground"
          data-testid="next-token-reason"
        >
          {reasonLine}
        </p>
      </div>
      {canMark && onMarkToken ? (
        <TokenMarkButtons
          isMobile={isMobile}
          onMarkToken={onMarkToken}
          testIdPrefix="next-token"
          token={token}
        />
      ) : null}
    </div>
  )
}

/** The planned tokens after the next one (plan-wide numbers), and View full plan. */
function UpNext({
  event,
  tokens,
  nextIndex,
  steps,
  total,
  isMobile,
  onViewPlan,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  /** The plan's tokens in the shown order. */
  tokens: readonly PlannedToken[]
  nextIndex: number
  /** Per token, the missions it moves (Missions order only). */
  steps: readonly (readonly TokenMissionStep[])[] | undefined
  total: number
  isMobile: boolean
  onViewPlan: (() => void) | undefined
}) {
  const { t } = useTranslation("legendaryEvents")
  const upcoming = upNextTokens({ tokens }, { index: nextIndex })
  if (upcoming.length === 0) return null
  return (
    <section
      aria-labelledby="next-token-up-next-title"
      className="flex min-w-0 flex-col gap-1 border-t pt-3"
      data-testid="next-token-up-next"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" id="next-token-up-next-title">
          {t("tokenPlan.nextToken.upNext")}
        </h3>
        {onViewPlan ? (
          <Button
            className="h-auto px-0"
            data-testid="next-token-view-plan"
            onClick={onViewPlan}
            type="button"
            variant="link"
          >
            {t("tokenPlan.nextToken.viewPlan", {
              count: total,
            })}
          </Button>
        ) : null}
      </div>
      <ol className="flex min-w-0 flex-col divide-y">
        {upcoming.map(({ token, index }) => (
          <TokenRow
            event={event}
            index={index}
            isMobile={isMobile}
            key={index}
            marker={undefined}
            missionsPopover
            steps={steps?.[index]}
            token={token}
          />
        ))}
      </ol>
    </section>
  )
}

function EmptyState({
  empty,
  onOpenTeams,
}: {
  empty: NextTokenEmpty
  onOpenTeams: OpenTeamsHandler
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  if (empty.kind === "allCleared") {
    return (
      <Note testId="next-token-all-cleared">
        {t("tokenPlan.nextToken.allCleared")}
      </Note>
    )
  }
  const lane = t(`lanes.${empty.laneId}`)
  const text =
    empty.kind === "noTeams"
      ? t("tokenPlan.nextToken.noTeams", { lane })
      : empty.kind === "noDepth"
        ? t("tokenPlan.nextToken.noDepth", { team: empty.teamName })
        : t("tokenPlan.nextToken.nothingLeft", {
            points: new Intl.NumberFormat(i18n.language).format(empty.points),
            lane,
          })
  return (
    <Button
      className="h-auto px-0 text-left whitespace-normal"
      data-lane={empty.laneId}
      data-testid={`next-token-${empty.kind}`}
      onClick={() =>
        onOpenTeams(
          empty.laneId,
          empty.kind === "noDepth" ? empty.teamId : undefined
        )
      }
      type="button"
      variant="link"
    >
      {text}
    </Button>
  )
}

function unknownChip(unitId: string): EventUnitChipData {
  return { unitId, owned: undefined }
}

function Note({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <p className="text-sm text-muted-foreground" data-testid={testId}>
      {children}
    </p>
  )
}
