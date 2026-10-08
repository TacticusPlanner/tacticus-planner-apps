import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  LegendaryEvent,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type {
  LeaderboardViewModel,
  ProgressGridViewModel,
} from "../legendary-event-page.view-model"
import { LeaderboardControls } from "./leaderboard-controls"
import { LeaderboardList } from "./leaderboard-list"
import { LeaderboardEmptyBody } from "./leaderboard-parts"
import { LeaderboardTable } from "./leaderboard-table"
import {
  laneLeaderboardBody,
  leaderboardFigure,
  useLeaderboardUnitName,
  useObjectiveChips,
} from "./leaderboard.view-model"

/**
 * The Eligibility leaderboard of one lane tab, after the Synced progress grid: every unit the lane
 * allows with ownership, objective indicators, the shown points figure and the objectives count.
 * `layout` picks the desktop table or the mobile row cards; the filters and toggles come from the
 * page orchestrator and are shared with the Overview leaderboard.
 */
export function LeaderboardSection({
  event,
  laneId,
  leaderboard,
  progressGrid,
  layout,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  leaderboard: LeaderboardViewModel
  progressGrid: ProgressGridViewModel
  layout: "table" | "list"
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const nameOf = useLeaderboardUnitName()
  const objectiveChips = useObjectiveChips()
  const ready = leaderboard.kind === "ready"
  const rosterAvailable = ready && leaderboard.rosterAvailable
  const groups = objectiveChips(event, [laneId], progressGrid)
  const objectives = groups[0]?.chips ?? []
  const figure = leaderboardFigure(leaderboard)
  const clearFilter = () => leaderboard.onSelectedObjectivesChange(new Set())

  let body: ReactNode
  if (leaderboard.kind === "loading") {
    body = (
      <div data-testid="leaderboard-loading">
        <span className="sr-only">{t("leaderboard.loading")}</span>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  } else if (leaderboard.kind === "unavailable") {
    body = (
      <p
        className="text-sm text-destructive"
        data-testid="leaderboard-unavailable"
      >
        {t("leaderboard.error")}
      </p>
    )
  } else {
    const result = laneLeaderboardBody(leaderboard.rowsByLane[laneId], {
      onlyUnlocked: rosterAvailable && leaderboard.onlyUnlocked,
      objectiveKeys: leaderboard.selectedObjectives,
      figure,
      nameOf,
      locale: i18n.language,
    })
    body =
      result.kind === "rows" ? (
        layout === "table" ? (
          <LeaderboardTable
            figure={figure}
            nameOf={nameOf}
            objectives={objectives}
            rows={result.rows}
          />
        ) : (
          <LeaderboardList
            figure={figure}
            nameOf={nameOf}
            objectives={objectives}
            rows={result.rows}
          />
        )
      ) : (
        <LeaderboardEmptyBody body={result} onClearFilter={clearFilter} />
      )
  }

  return (
    <section
      aria-labelledby="legendary-event-leaderboard-title"
      className="flex min-w-0 flex-col gap-3"
      data-lane={laneId}
      data-testid="legendary-event-leaderboard"
    >
      <h2
        className="text-lg font-semibold"
        id="legendary-event-leaderboard-title"
      >
        {t("leaderboard.title")}
      </h2>
      <LeaderboardControls
        groups={groups}
        progressAvailable={!ready || leaderboard.progressAvailable}
        rosterAvailable={!ready || rosterAvailable}
        state={leaderboard}
      />
      <div data-lane={laneId} data-testid="leaderboard-lane">
        {body}
      </div>
    </section>
  )
}
