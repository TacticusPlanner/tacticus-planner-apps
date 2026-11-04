import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type {
  LegendaryEventLane,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type { LanePotentialViewModel } from "./lane-potential.view-model"
import { RosterPotentialMap } from "./roster-potential-map"

/** A lane's overview figures, in its Event board column header: kill points per battle, the
 *  battle count and the roster potential map. The objectives and their points are the column's
 *  table headings. */
export function LaneOverviewFigures({
  laneId,
  lane,
  potential,
  isMobile,
  onViewBattles,
}: {
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  potential: LanePotentialViewModel
  isMobile: boolean
  /** Opens the lane's Battles on Plan. */
  onViewBattles?: () => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <div
      className="flex min-w-0 flex-col gap-2"
      data-lane={laneId}
      data-testid="legendary-event-lane-figures"
    >
      <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
        <span
          className="text-muted-foreground"
          data-testid="legendary-event-lane-kill-points"
        >
          {t("laneOverview.killPoints", {
            points: number.format(lane.killPoints),
          })}
        </span>
        {onViewBattles ? (
          <Button
            aria-label={t("laneOverview.viewBattles", {
              lane: t(`lanes.${laneId}`),
              count: lane.battlesPoints.length,
            })}
            className="h-auto p-0 text-sm"
            data-testid="legendary-event-lane-battles"
            onClick={onViewBattles}
            type="button"
            variant="link"
          >
            {t("laneOverview.battles", { count: lane.battlesPoints.length })}
          </Button>
        ) : (
          <span data-testid="legendary-event-lane-battles">
            {t("laneOverview.battles", { count: lane.battlesPoints.length })}
          </span>
        )}
      </p>
      <RosterPotentialMap isMobile={isMobile} lane={lane} view={potential} />
    </div>
  )
}

/** The "how points work" disclosure, closed until opened. */
export function HowPointsDisclosure() {
  const { t } = useTranslation("legendaryEvents")
  return (
    <details
      className="rounded-xl border p-3 text-sm"
      data-testid="legendary-event-how-points"
    >
      <summary className="cursor-pointer font-medium">
        {t("laneOverview.howPoints.title")}
      </summary>
      <p className="mt-2 text-muted-foreground">
        {t("laneOverview.howPoints.body")}
      </p>
    </details>
  )
}
