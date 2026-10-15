import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import type {
  LegendaryEvent,
  LegendaryEventAnnotationStatus,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { tokenMarkIds } from "../lib/token-marks"
import type { NextTokenEmpty, TokenPlanView } from "../lib/token-plan-view"
import { useNextTokenShown } from "../model/use-next-token-shown"
import { TokenObjectives } from "./token-objectives"

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

/**
 * The Overview's Next token card (spec: Next token card heads the Overview tab): the battle to play
 * next with its team, points, cleared cells and reason, and the Partly cleared / Couldn't clear
 * actions; or what is missing for a plan. Hidden on an archived event and when signed out.
 */
export function NextTokenCard({
  eventId,
  event,
  view,
  isMobile,
  onMarkToken,
  onOpenTeams,
}: {
  eventId: string
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  view: TokenPlanView
  isMobile: boolean
  /** Absent while marks cannot be written (the plan has not loaded). */
  onMarkToken: MarkTokenHandler | undefined
  onOpenTeams: OpenTeamsHandler
}) {
  const { t } = useTranslation("legendaryEvents")
  useNextTokenShown(eventId, view)
  if (view.kind === "hidden") return null

  return (
    <Card data-testid="legendary-event-next-token">
      <CardHeader>
        <CardTitle>
          <h2>{t("tokenPlan.nextToken.title")}</h2>
        </CardTitle>
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
        {view.kind === "ready" && view.next ? (
          <TokenView
            event={event}
            isMobile={isMobile}
            onMarkToken={onMarkToken}
            view={view}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

function TokenView({
  event,
  view,
  isMobile,
  onMarkToken,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  view: Extract<TokenPlanView, { kind: "ready" }>
  isMobile: boolean
  onMarkToken: MarkTokenHandler | undefined
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
  const number = new Intl.NumberFormat(i18n.language)
  const { token, reason, sameTeam } = view.next!
  const lane = t(`lanes.${token.laneId}`)
  const battle = token.battleIndex + 1
  const members = view.membersByTeam.get(token.teamId) ?? []
  const reasonText = t(`tokenPlan.nextToken.reasons.${reason}`)
  const withTeam = sameTeam
    ? t("tokenPlan.nextToken.sameTeam", { reason: reasonText })
    : reasonText
  const reasonLine =
    view.upcomingRun === null
      ? withTeam
      : t("tokenPlan.nextToken.upcoming", {
          reason: withTeam,
          run: view.upcomingRun,
        })
  const canMark =
    onMarkToken !== undefined && view.upcomingRun === null && token.playableNow
  const mark = (status: LegendaryEventAnnotationStatus) =>
    onMarkToken?.(
      token.laneId,
      token.battleIndex,
      tokenMarkIds(token.clearedIds, status),
      status
    )
  const labels = { team: token.teamName, lane, battle }

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
          <ul
            aria-label={t("tokenPlan.nextToken.members")}
            className="flex items-center gap-1"
          >
            {members.map((unitId) => (
              <li
                data-testid="next-token-member"
                data-unit={unitId}
                key={unitId}
              >
                <EntityIcon
                  alt={unitName("Character", unitId)}
                  className="size-8 rounded-full"
                  src={characterIcon(unitId as UnitId)}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span data-testid="next-token-battle">
            {t("tokenPlan.nextToken.battle", { lane, battle })}
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
      {canMark ? (
        <div
          className={cn(
            "flex gap-2",
            isMobile ? "flex-col" : "shrink-0 flex-row"
          )}
        >
          <Button
            aria-label={t("tokenPlan.nextToken.actions.partlyLabel", labels)}
            className={cn(isMobile && "h-11 w-full")}
            data-testid="next-token-partly"
            onClick={() => mark("maybeClear")}
            type="button"
            variant="outline"
          >
            {t("tokenPlan.nextToken.actions.partly")}
          </Button>
          <Button
            aria-label={t("tokenPlan.nextToken.actions.couldNotLabel", labels)}
            className={cn(isMobile && "h-11 w-full")}
            data-testid="next-token-could-not"
            onClick={() => mark("stopHere")}
            type="button"
            variant="outline"
          >
            {t("tokenPlan.nextToken.actions.couldNot")}
          </Button>
        </div>
      ) : null}
    </div>
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

function Note({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <p className="text-sm text-muted-foreground" data-testid={testId}>
      {children}
    </p>
  )
}
