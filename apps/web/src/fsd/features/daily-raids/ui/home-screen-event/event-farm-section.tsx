import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import type {
  DailyRaidGoalViewModel,
  DailyRaidResourceProgress,
} from "../../model/daily-raids.domain"
import type { EventFarmEmptyReason } from "../../model/home-screen-event-farm"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { useDailyRaids } from "../../model/use-daily-raids"
import { RaidState } from "../raid-state"
import { ResourceIconWithTooltip } from "../resource-icon"
import { EventGoalIcons } from "./event-goal-icons"
import { EventLocationRow } from "./event-location-row"

const EMPTY_KEYS = {
  "no-goals": "hse.raids.empty.noGoals",
  "no-energy": "hse.raids.empty.noEnergy",
  "nothing-contributes": "hse.raids.empty.nothingContributes",
  filtered: "hse.raids.empty.filtered",
} as const satisfies Record<EventFarmEmptyReason, string>

/**
 * The HSE farm list: the point-earning locations that feed the player's goals, chosen over the whole
 * schedule and filled to the energy left today (`planEventFarm`). Each row shows its goals, raids,
 * points, energy and drop. It picks point-earning nodes even where a cheaper node without points
 * exists, so the note under the title says it can cost more energy per item than Today.
 */
export function EventFarmSection({
  definitionId,
  projectId,
}: {
  definitionId: string
  projectId?: string
}) {
  const { t } = useTranslation("dailies")
  const raids = useDailyRaids(projectId, { homeScreenEventId: definitionId })
  const view = raids.status === "ready" ? raids : null
  const farm = view?.eventFarm
  const emptyReason: EventFarmEmptyReason | null =
    raids.status === "no-goals"
      ? "no-goals"
      : raids.status === "no-farmable"
        ? "nothing-contributes"
        : farm
          ? farm.empty
          : null

  return (
    <section className="space-y-3" data-testid="hse-raids">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("hse.raids.title")}</h2>
        {farm && farm.rows.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Badge data-testid="hse-raids-total" variant="secondary">
              {t("hse.raids.total", { points: farm.totalPoints })}
            </Badge>
            <Badge data-testid="hse-raids-energy" variant="outline">
              {t("hse.raids.energy", { energy: farm.totalEnergy })}
            </Badge>
          </div>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground" data-testid="hse-raids-note">
        {t("hse.raids.note")}
        {farm ? ` ${t("hse.raids.budget", { energy: farm.energyBudget })}` : ""}
      </p>
      {raids.status === "loading" || raids.status === "error" ? (
        <RaidState state={raids.status} />
      ) : view && farm && farm.rows.length > 0 ? (
        <ul className="grid gap-2" data-testid="hse-raids-list">
          {farm.rows.map((row) => {
            const goals = row.goalIds
              .map((goalId) => view.goalsById.get(goalId))
              .filter((goal): goal is DailyRaidGoalViewModel => !!goal)
            return (
              <EventLocationRow
                key={row.battleId}
                fallbackLabel={row.battleId}
                location={view.locationsByBattleId.get(row.battleId)}
                testId={`hse-raid-${row.battleId}`}
              >
                <EventGoalIcons
                  goals={goals}
                  testId={`hse-raid-${row.battleId}-goals`}
                />
                <Badge className="tabular-nums" variant="outline">
                  {t("hse.raids.raidCount", { count: row.raids })}
                </Badge>
                <Badge className="tabular-nums" variant="secondary">
                  {t("hse.raids.points", { points: row.points })}
                </Badge>
                <Badge className="tabular-nums" variant="outline">
                  {t("hse.raids.energy", { energy: row.energy })}
                </Badge>
                <span className="flex items-center gap-1">
                  <ResourceIconWithTooltip
                    className="size-6"
                    label={
                      view.resourceLabels.get(row.resourceId) ?? row.resourceId
                    }
                    visual={view.resourceVisuals.get(row.resourceId)}
                  />
                  <ResourceStock
                    progress={view.resourceTotals.get(row.resourceId)}
                    testId={`hse-raid-${row.battleId}-stock`}
                  />
                </span>
              </EventLocationRow>
            )
          })}
        </ul>
      ) : emptyReason ? (
        <EmptyState reason={emptyReason} />
      ) : null}
    </section>
  )
}

/** "X/Y" beside the drop icon: what the player holds of the item and its total target over the goals
 * in scope (the Today/Raids have/need figure, aggregated). Nothing when no goal targets the item. */
function ResourceStock({
  progress,
  testId,
}: {
  progress: DailyRaidResourceProgress | undefined
  testId: string
}) {
  const { t } = useTranslation("dailies")
  if (!progress || progress.target <= 0) return null
  return (
    <span
      aria-label={t("schedule.progress", progress)}
      className="text-xs font-medium whitespace-nowrap text-muted-foreground tabular-nums"
      data-testid={testId}
      role="img"
    >
      {progress.owned}/{progress.target}
    </span>
  )
}

function EmptyState({ reason }: { reason: EventFarmEmptyReason }) {
  const { t } = useTranslation("dailies")
  const [, setFilters] = useRaidsFilters()
  return (
    <div
      className="space-y-2 text-sm text-muted-foreground"
      data-testid={`hse-raids-empty-${reason}`}
    >
      <p>{t(EMPTY_KEYS[reason])}</p>
      {reason === "filtered" ? (
        <Button
          data-testid="hse-raids-reset"
          onClick={() => setFilters(emptyRaidsFilters)}
          size="sm"
          variant="outline"
        >
          {t("raidsFilters.filteredOut.reset")}
        </Button>
      ) : null}
    </div>
  )
}
