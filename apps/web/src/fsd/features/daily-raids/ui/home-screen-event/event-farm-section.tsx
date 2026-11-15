import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { energyIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { DailyRaidGoalViewModel } from "../../model/daily-raids.domain"
import type {
  EventFarm,
  EventFarmEmptyReason,
  EventFarmOrder,
} from "../../model/home-screen-event-farm"
import type { HseRaidRule } from "../../model/home-screen-event-rules"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import type { TodayQuickFilterOptions } from "../../model/today-quick-filters/today-quick-filters"
import { useDailyRaids } from "../../model/use-daily-raids"
import { useListPaging } from "../../model/use-list-paging"
import { ListPagingControls } from "../list-paging-controls"
import { CampaignGroupedList } from "../campaign-group"
import type { RaidLocationTarget } from "../raid-location-name"
import { RaidState } from "../raid-state"
import { ResourceIconWithTooltip } from "../resource-icon"
import { ResourceStock } from "../resource-stock"
import {
  EventFarmOrderSwitch,
  type HseListView,
} from "./event-farm-order-switch"
import { EventGoalIcons } from "./event-goal-icons"
import { EventLocationRow } from "./event-location-row"

const NO_ROWS: readonly EventFarm["rows"][number][] = []

const EMPTY_KEYS = {
  "no-goals": "hse.raids.empty.noGoals",
  "no-energy": "hse.raids.empty.noEnergy",
  "nothing-contributes": "hse.raids.empty.nothingContributes",
  filtered: "hse.raids.empty.filtered",
} as const satisfies Record<EventFarmEmptyReason, string>

/**
 * The HSE farm list: the point-earning locations that feed the player's goals, chosen over the whole
 * schedule and filled to the energy left today (`planEventFarm`). Each row shows its goals, raids,
 * points, energy and drop. The order switch picks points per energy (point-earning nodes even where
 * a cheaper node without points exists, so it can cost more energy per item than Today) or energy
 * per item (the cheapest locations for each material first, with their energy per item shown); the
 * note under it says which. Today's quick filters (`quickFilters`) apply as on Today. Memoised: the HSE page re-renders
 * on every projection keystroke, which changes none of its props.
 */
export const EventFarmSection = memo(function EventFarmSection({
  rule,
  projectId,
  pointsIcon,
  quickFilters,
  order = "points",
  onViewChange,
  onShowLocation,
}: {
  /** The shown event's raid-point rule. */
  rule: HseRaidRule
  projectId?: string
  /** The shown event's points icon. */
  pointsIcon?: string
  /** Today's quick filters, picked in the raids controls row. */
  quickFilters?: TodayQuickFilterOptions
  order?: EventFarmOrder
  /** Shows the list controls when set (their "Ignore goals" toggle swaps this list out). */
  onViewChange?: (view: HseListView) => void
  /** Makes each battle's name open its enemies. */
  onShowLocation?: (target: RaidLocationTarget) => void
}) {
  const { t } = useTranslation("dailies")
  const raids = useDailyRaids(projectId, {
    homeScreenEventRule: rule,
    eventFarmOrder: order,
    quickFilters,
  })
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
  const paging = useListPaging(farm?.rows ?? NO_ROWS)

  return (
    <section className="space-y-3" data-testid="hse-raids">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("hse.raids.title")}</h2>
        {farm && farm.rows.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Badge data-testid="hse-raids-total" variant="secondary">
              {pointsIcon ? (
                <EntityIcon alt="" className="size-3.5" src={pointsIcon} />
              ) : null}
              {t("hse.raids.total", { points: farm.totalPoints })}
            </Badge>
            <Badge data-testid="hse-raids-energy" variant="outline">
              <EntityIcon alt="" className="size-3.5" src={energyIcon()} />
              {t("hse.raids.energy", { energy: farm.totalEnergy })}
            </Badge>
          </div>
        ) : null}
      </div>
      {onViewChange ? (
        <EventFarmOrderSwitch
          onViewChange={onViewChange}
          view={{ order, ignoreGoals: false }}
        />
      ) : null}
      <p className="text-sm text-muted-foreground" data-testid="hse-raids-note">
        {order === "energy" ? t("hse.raids.noteEnergy") : t("hse.raids.note")}
      </p>
      {raids.status === "loading" || raids.status === "error" ? (
        <RaidState state={raids.status} />
      ) : view && farm && farm.rows.length > 0 ? (
        <>
          <CampaignGroupedList
            battleIdOf={(row) => row.battleId}
            locationsByBattleId={view.locationsByBattleId}
            rows={paging.visible}
            testId="hse-raids-list"
            renderRow={(row) => {
              const goals = row.goalIds
                .map((goalId) => view.goalsById.get(goalId))
                .filter((goal): goal is DailyRaidGoalViewModel => !!goal)
              return (
                <EventLocationRow
                  key={row.battleId}
                  battleId={row.battleId}
                  onShowLocation={onShowLocation}
                  fallbackLabel={row.battleId}
                  location={view.locationsByBattleId.get(row.battleId)}
                  testId={`hse-raid-${row.battleId}`}
                >
                  <EventGoalIcons
                    goals={goals}
                    testId={`hse-raid-${row.battleId}-goals`}
                  />
                  <Badge className="tabular-nums" variant="secondary">
                    {pointsIcon ? (
                      <EntityIcon
                        alt=""
                        className="size-3.5"
                        src={pointsIcon}
                      />
                    ) : null}
                    {t("hse.raids.points", { points: row.points })}
                  </Badge>
                  {order === "energy" ? (
                    <Badge
                      className="tabular-nums"
                      data-testid={`hse-raid-${row.battleId}-per-item`}
                      variant="outline"
                    >
                      {t("hse.raids.perItem", {
                        value: Number(row.energyPerItem.toFixed(1)),
                      })}
                    </Badge>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <ResourceIconWithTooltip
                      className="size-8"
                      label={
                        view.resourceLabels.get(row.resourceId) ??
                        row.resourceId
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
            }}
          />
          <ListPagingControls paging={paging} testId="hse-raids-paging" />
        </>
      ) : emptyReason ? (
        <EmptyState reason={emptyReason} />
      ) : null}
    </section>
  )
})

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
