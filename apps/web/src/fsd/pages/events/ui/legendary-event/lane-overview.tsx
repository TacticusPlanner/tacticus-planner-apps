import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  useLaneAllowedRule,
  useObjectiveLabel,
  type LegendaryEvent,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

/** Per lane: label with its allowed-units rule, kill points, the five objectives with their
 *  scores, the battle count and the per-battle points ladder; one "how points work" disclosure
 *  closes the section. Renders the lanes it is given (three on desktop, one on mobile). */
export function LaneOverview({
  event,
  laneIds,
}: {
  event: LegendaryEvent
  laneIds: readonly LegendaryEventLaneId[]
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <section
      aria-labelledby="legendary-event-lane-overview-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-lane-overview"
    >
      <h2
        className="text-lg font-semibold"
        id="legendary-event-lane-overview-title"
      >
        {t("laneOverview.title")}
      </h2>
      <div
        className={cn(
          "grid min-w-0 gap-3",
          laneIds.length > 1 ? "grid-cols-3" : "grid-cols-1"
        )}
      >
        {laneIds.map((laneId) => (
          <LanePanel event={event} key={laneId} laneId={laneId} />
        ))}
      </div>
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
    </section>
  )
}

function LanePanel({
  event,
  laneId,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const allowedRule = useLaneAllowedRule()
  const number = new Intl.NumberFormat(i18n.language)
  const lane = event[laneId]
  const laneName = t(`lanes.${laneId}`)
  const rule = allowedRule(lane)
  const ladder = lane.battlesPoints
  const ladderMax = Math.max(1, ...ladder)

  return (
    <Card
      className="min-w-0"
      data-lane={laneId}
      data-testid="legendary-event-lane-panel"
    >
      <CardHeader>
        <CardTitle data-testid="legendary-event-lane-label">
          <h3>
            {rule
              ? t("laneOverview.labelWithRule", { lane: laneName, rule })
              : laneName}
          </h3>
        </CardTitle>
        <p
          className="text-sm text-muted-foreground"
          data-testid="legendary-event-lane-kill-points"
        >
          {t("laneOverview.killPoints", {
            points: number.format(lane.killPoints),
          })}
        </p>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <h4 className="sr-only">{t("laneOverview.objectives")}</h4>
          <ul
            className="flex flex-wrap gap-2"
            data-testid="legendary-event-objectives"
          >
            {lane.unitsRestrictions.map((objective) => {
              const { label, icon } = objectiveLabel(objective)
              return (
                <li
                  className="flex max-w-full min-w-0 items-center gap-1.5 rounded-full border bg-muted/40 py-1 pr-2.5 pl-1.5 text-sm"
                  data-testid="legendary-event-objective"
                  key={objective.index}
                >
                  <ObjectiveIcon icon={icon} />
                  <span className="truncate">{label}</span>
                  <span className="font-semibold tabular-nums">
                    {number.format(objective.points)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("laneOverview.ladder")}
            </span>
            <span data-testid="legendary-event-lane-battles">
              {t("laneOverview.battles", { count: ladder.length })}
            </span>
          </p>
          <ol
            aria-label={t("laneOverview.ladder")}
            className="flex h-12 min-w-0 items-end gap-px"
            data-testid="legendary-event-ladder"
          >
            {ladder.map((points, index) => {
              const label = t("laneOverview.battlePoints", {
                battle: index + 1,
                points: number.format(points),
              })
              return (
                <li
                  aria-label={label}
                  className="min-w-0 flex-1 rounded-t-sm bg-(--event-legendary)"
                  data-points={points}
                  data-testid="legendary-event-ladder-bar"
                  key={index}
                  style={{
                    height: `${Math.max(8, (points / ladderMax) * 100)}%`,
                  }}
                  title={label}
                />
              )
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
