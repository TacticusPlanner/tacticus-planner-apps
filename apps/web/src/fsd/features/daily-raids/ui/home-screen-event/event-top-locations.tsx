import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import type { BattleId } from "@workspace/game-domain"

import type {
  DailyRaidBattleResource,
  DailyRaidLocationViewModel,
} from "../../model/daily-raids.domain"
import type { TopEventLocation } from "../../model/home-screen-event-locations"
import { useHomeScreenEventLocations } from "../../model/use-home-screen-event-locations"
import { countActiveFilterGroups } from "../../model/raids-filters/raids-filters.domain"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { ResourceIconWithTooltip } from "../resource-icon"
import { EventLocationRow } from "./event-location-row"

/**
 * The overall best locations for event points and, while a campaign event is active, the best
 * locations of that event's campaign. Goals are ignored, the Raids Filters are not.
 */
export function EventTopLocations({ definitionId }: { definitionId: string }) {
  const { t } = useTranslation("dailies")
  const state = useHomeScreenEventLocations(definitionId)

  if (state.status === "loading") {
    return (
      <div
        className="flex min-h-24 items-center justify-center"
        data-testid="hse-top-loading"
      >
        <Spinner className="size-6" />
      </div>
    )
  }
  return (
    <div className="space-y-5">
      <TopList
        locations={state.overall}
        locationsByBattleId={state.locationsByBattleId}
        resourceByBattleId={state.resourceByBattleId}
        testId="hse-top-overall"
        title={t("hse.top.overallTitle")}
      />
      {state.eventCampaign ? (
        <TopList
          locations={state.eventCampaign}
          locationsByBattleId={state.locationsByBattleId}
          resourceByBattleId={state.resourceByBattleId}
          testId="hse-top-event"
          title={t("hse.top.eventTitle")}
        />
      ) : null}
    </div>
  )
}

function TopList({
  title,
  testId,
  locations,
  locationsByBattleId,
  resourceByBattleId,
}: {
  title: string
  testId: string
  locations: TopEventLocation[]
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  resourceByBattleId: ReadonlyMap<BattleId, DailyRaidBattleResource>
}) {
  const { t } = useTranslation("dailies")
  const [filters, setFilters] = useRaidsFilters()
  const filtered = countActiveFilterGroups(filters) > 0

  return (
    <section className="space-y-3" data-testid={testId}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {locations.length > 0 ? (
        <ol className="grid gap-2" data-testid={`${testId}-list`}>
          {locations.map((location) => (
            <EventLocationRow
              key={location.battleId}
              fallbackLabel={location.battleId}
              location={locationsByBattleId.get(location.battleId)}
              testId={`${testId}-${location.battleId}`}
            >
              {resourceByBattleId.get(location.battleId) ? (
                <ResourceIconWithTooltip
                  className="size-6"
                  label={resourceByBattleId.get(location.battleId)!.label}
                  visual={resourceByBattleId.get(location.battleId)!.visual}
                />
              ) : null}
              <Badge className="tabular-nums" variant="secondary">
                {t("hse.top.perEnergy", {
                  value: Number(location.pointsPerEnergy.toFixed(2)),
                })}
              </Badge>
              <Badge className="tabular-nums" variant="outline">
                {t("hse.top.perRaid", { points: location.pointsPerRaid })}
              </Badge>
            </EventLocationRow>
          ))}
        </ol>
      ) : (
        <div
          className="space-y-2 text-sm text-muted-foreground"
          data-testid={`${testId}-empty`}
        >
          <p>{t(filtered ? "hse.top.filteredEmpty" : "hse.top.empty")}</p>
          {filtered ? (
            <Button
              data-testid={`${testId}-reset`}
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
