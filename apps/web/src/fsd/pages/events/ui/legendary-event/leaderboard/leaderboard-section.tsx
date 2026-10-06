import { useTranslation } from "react-i18next"
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
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type { LeaderboardViewModel } from "../legendary-event-page.view-model"
import { LeaderboardControls } from "./leaderboard-controls"
import { LeaderboardList } from "./leaderboard-list"
import { LeaderboardTable } from "./leaderboard-table"
import {
  laneLeaderboardBody,
  useLeaderboardUnitName,
} from "./leaderboard.view-model"

/**
 * The Eligibility leaderboard section, lane-scoped like Lane overview: every unit each lane allows
 * with ownership, objective matches, points per battle and slots. `layout` picks the desktop table
 * or the mobile row cards; sort and "Only unlocked" come from the page orchestrator.
 */
export function LeaderboardSection({
  event,
  laneIds,
  leaderboard,
  layout,
}: {
  event: LegendaryEvent
  laneIds: readonly LegendaryEventLaneId[]
  leaderboard: LeaderboardViewModel
  layout: "table" | "list"
}) {
  const { t } = useTranslation("legendaryEvents")
  const ready = leaderboard.kind === "ready"
  const rosterAvailable = ready && leaderboard.rosterAvailable

  return (
    <section
      aria-labelledby="legendary-event-leaderboard-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-leaderboard"
    >
      <h2
        className="text-lg font-semibold"
        id="legendary-event-leaderboard-title"
      >
        {t("leaderboard.title")}
      </h2>
      <div className="flex min-w-0 flex-col gap-2">
        <LeaderboardControls
          onOnlyUnlockedChange={leaderboard.onOnlyUnlockedChange}
          onSortChange={leaderboard.onSortChange}
          onlyUnlocked={leaderboard.onlyUnlocked}
          rosterAvailable={rosterAvailable}
          showSort={layout === "list"}
          sort={leaderboard.sort}
        />
        {ready && !leaderboard.rosterAvailable ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="leaderboard-roster-not-synced"
          >
            {t("leaderboard.rosterNotSynced")}
          </p>
        ) : null}
      </div>
      {leaderboard.kind === "loading" ? (
        <div data-testid="leaderboard-loading">
          <span className="sr-only">{t("leaderboard.loading")}</span>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : leaderboard.kind === "unavailable" ? (
        <p
          className="text-sm text-destructive"
          data-testid="leaderboard-unavailable"
        >
          {t("leaderboard.error")}
        </p>
      ) : (
        <div
          className={cn(
            "grid min-w-0 gap-3",
            laneIds.length > 1 && "lg:grid-cols-2 2xl:grid-cols-3"
          )}
        >
          {laneIds.map((laneId) => (
            <LeaderboardLane
              event={event}
              key={laneId}
              laneId={laneId}
              layout={layout}
              leaderboard={leaderboard}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function LeaderboardLane({
  event,
  laneId,
  leaderboard,
  layout,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  leaderboard: Extract<LeaderboardViewModel, { kind: "ready" }>
  layout: "table" | "list"
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const nameOf = useLeaderboardUnitName()
  const objectives = [...event[laneId].unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )
  const body = laneLeaderboardBody(leaderboard.rowsByLane[laneId], {
    sort: leaderboard.sort,
    onlyUnlocked: leaderboard.rosterAvailable && leaderboard.onlyUnlocked,
    nameOf,
    locale: i18n.language,
  })

  const content =
    body.kind === "noEligible" ? (
      <p
        className="text-sm text-muted-foreground"
        data-testid="leaderboard-no-eligible"
      >
        {t("leaderboard.noEligible")}
      </p>
    ) : body.kind === "noUnlocked" ? (
      <p
        className="text-sm text-muted-foreground"
        data-testid="leaderboard-no-unlocked"
      >
        {t("leaderboard.noUnlocked")}
      </p>
    ) : layout === "table" ? (
      <LeaderboardTable
        nameOf={nameOf}
        objectives={objectives}
        onSortChange={leaderboard.onSortChange}
        rows={body.rows}
        sort={leaderboard.sort}
      />
    ) : (
      <LeaderboardList
        nameOf={nameOf}
        objectives={objectives}
        rows={body.rows}
      />
    )

  if (layout === "list") {
    return (
      <div data-lane={laneId} data-testid="leaderboard-lane">
        {content}
      </div>
    )
  }
  return (
    <Card className="min-w-0" data-lane={laneId} data-testid="leaderboard-lane">
      <CardHeader>
        <CardTitle>
          <h3>{t(`lanes.${laneId}`)}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">{content}</CardContent>
    </Card>
  )
}
