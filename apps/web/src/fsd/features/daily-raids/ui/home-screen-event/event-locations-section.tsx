import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { energyIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { EventFarmOrder } from "../../model/home-screen-event-farm"
import type { HseRaidRule } from "../../model/home-screen-event-rules"
import {
  countActiveFilterGroups,
  emptyRaidsFilters,
} from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import type { TodayQuickFilterOptions } from "../../model/today-quick-filters/today-quick-filters"
import { useHomeScreenEventLocations } from "../../model/use-home-screen-event-locations"
import { useListPaging } from "../../model/use-list-paging"
import { CampaignGroupedList } from "../campaign-group"
import { ListPagingControls } from "../list-paging-controls"
import { ResourceIconWithTooltip } from "../resource-icon"
import {
  EventFarmOrderSwitch,
  type HseListView,
} from "./event-farm-order-switch"
import { EventLocationRow } from "./event-location-row"

/**
 * The HSE list with "Ignore goals" on, in place of the farm list: every location that earns event
 * points, goals ignored and energy unlimited, in the Sort switch's order (points per energy, or the
 * cheapest locations for their drop first). Each row shows the drop and how many the player holds
 * (no goal target), the attempts left today with their points, and points per raid and per energy
 * (energy per item with the energy order). Paged like the farm list.
 */
export function EventLocationsSection({
  rule,
  pointsIcon,
  quickFilters,
  order = "points",
  onViewChange,
}: {
  rule: HseRaidRule
  pointsIcon?: string
  quickFilters?: TodayQuickFilterOptions
  order?: EventFarmOrder
  onViewChange?: (view: HseListView) => void
}) {
  const { t } = useTranslation("dailies")
  const state = useHomeScreenEventLocations(rule, { quickFilters, order })
  const [filters, setFilters] = useRaidsFilters()
  const filtered = countActiveFilterGroups(filters) > 0
  const paging = useListPaging(
    state.status === "ready" ? state.locations : NO_LOCATIONS
  )

  return (
    <section className="space-y-3" data-testid="hse-raids">
      <h2 className="text-lg font-semibold">{t("hse.raids.title")}</h2>
      {onViewChange ? (
        <EventFarmOrderSwitch
          onViewChange={onViewChange}
          view={{ order, ignoreGoals: true }}
        />
      ) : null}
      <p className="text-sm text-muted-foreground" data-testid="hse-raids-note">
        {order === "energy"
          ? t("hse.raids.noteIgnoreGoalsEnergy")
          : t("hse.raids.noteIgnoreGoals")}
      </p>
      {state.status === "loading" ? (
        <div
          className="flex min-h-24 items-center justify-center"
          data-testid="hse-raids-loading"
        >
          <Spinner className="size-6" />
        </div>
      ) : state.locations.length > 0 ? (
        <>
          <CampaignGroupedList
            battleIdOf={(location) => location.battleId}
            locationsByBattleId={state.locationsByBattleId}
            rows={paging.visible}
            testId="hse-raids-list"
            renderRow={(location) => {
              const resource = state.resourceByBattleId.get(location.battleId)
              return (
                <EventLocationRow
                  key={location.battleId}
                  fallbackLabel={location.battleId}
                  location={state.locationsByBattleId.get(location.battleId)}
                  testId={`hse-raid-${location.battleId}`}
                >
                  {resource ? (
                    <span className="flex items-center gap-1">
                      <ResourceIconWithTooltip
                        className="size-6"
                        label={resource.label}
                        visual={resource.visual}
                      />
                      <span
                        className="text-xs text-muted-foreground tabular-nums"
                        data-testid={`hse-raid-${location.battleId}-owned`}
                      >
                        {t("hse.raids.owned", {
                          count:
                            state.ownedByBattleId.get(location.battleId) ?? 0,
                        })}
                      </span>
                    </span>
                  ) : null}
                  {location.raids !== null ? (
                    <Badge className="tabular-nums" variant="outline">
                      {t("hse.raids.raidCount", { count: location.raids })}
                    </Badge>
                  ) : null}
                  {location.points !== null ? (
                    <Badge className="tabular-nums" variant="secondary">
                      {pointsIcon ? (
                        <EntityIcon
                          alt=""
                          className="size-3.5"
                          src={pointsIcon}
                        />
                      ) : null}
                      {t("hse.raids.points", { points: location.points })}
                    </Badge>
                  ) : null}
                  {order === "energy" && location.energyPerItem !== null ? (
                    <Badge
                      className="tabular-nums"
                      data-testid={`hse-raid-${location.battleId}-per-item`}
                      variant="outline"
                    >
                      {t("hse.raids.perItem", {
                        value: Number(location.energyPerItem.toFixed(1)),
                      })}
                    </Badge>
                  ) : null}
                  <Badge className="tabular-nums" variant="outline">
                    {t("hse.raids.perRaid", {
                      points: location.pointsPerRaid,
                    })}
                  </Badge>
                  <Badge className="tabular-nums" variant="outline">
                    <EntityIcon
                      alt=""
                      className="size-3.5"
                      src={energyIcon()}
                    />
                    {t("hse.raids.perEnergy", {
                      value: Number(location.pointsPerEnergy.toFixed(2)),
                    })}
                  </Badge>
                </EventLocationRow>
              )
            }}
          />
          <ListPagingControls paging={paging} testId="hse-raids-paging" />
        </>
      ) : (
        <div
          className="space-y-2 text-sm text-muted-foreground"
          data-testid="hse-raids-empty-locations"
        >
          <p>
            {t(
              filtered
                ? "hse.raids.empty.filtered"
                : "hse.raids.empty.noLocations"
            )}
          </p>
          {filtered ? (
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
      )}
    </section>
  )
}

const NO_LOCATIONS: readonly never[] = []
