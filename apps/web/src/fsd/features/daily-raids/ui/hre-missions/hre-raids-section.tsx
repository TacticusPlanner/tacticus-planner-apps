import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import type {
  MissionRaidPlan,
  MissionRaidsRequest,
} from "../../model/mission-raids"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { useDailyRaids } from "../../model/use-daily-raids"
import { EventLocationRow } from "../home-screen-event/event-location-row"
import { RaidState } from "../raid-state"
import { ResourceIconWithTooltip } from "../resource-icon"

/** With no open objective the plan still runs, for the summary's cheapest cost only. */
const SUMMARY_ONLY: MissionRaidsRequest = { battlesToGo: 0, eventOnly: false }

type HreRaidsRequest = MissionRaidsRequest & {
  /** "Mission 5", for the title. */
  missionLabel: string
}

/**
 * Dailies > HRE campaign raids: for the current mission's open campaign (or lightning) objective,
 * where to raid today with the least energy after Today's remaining plan (`planMissionRaids`),
 * with its totals and empty states. Without one, `notice` says why. Always ends with the
 * remaining-campaign summary: battles left over the remaining missions, the minimum energy and
 * the days at the cheapest nodes' daily capacity.
 */
export function HreRaidsSection({
  projectId,
  request,
  notice,
  remainingBattles,
}: {
  projectId?: string
  request: HreRaidsRequest | null
  notice: ReactNode
  remainingBattles: number
}) {
  const { t } = useTranslation("hre")
  const raids = useDailyRaids(projectId, {
    missionRaids: request
      ? { battlesToGo: request.battlesToGo, eventOnly: request.eventOnly }
      : SUMMARY_ONLY,
  })
  const loaded = raids.status !== "loading" && raids.status !== "error"
  const plan = loaded ? raids.missionRaids : undefined
  const locations = loaded ? raids.locationsByBattleId : undefined
  const view = raids.status === "ready" ? raids : null

  return (
    <section className="space-y-3" data-testid="hre-raids">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {request
            ? t("raids.title", { mission: request.missionLabel })
            : t("raids.titleNone")}
        </h2>
        {request ? (
          <Badge data-testid="hre-raids-to-go" variant="secondary">
            {t("raids.toGo", { count: request.battlesToGo })}
          </Badge>
        ) : null}
      </div>
      {raids.status === "loading" || raids.status === "error" ? (
        <RaidState state={raids.status} />
      ) : !request ? (
        <div
          className="text-sm text-muted-foreground"
          data-testid="hre-raids-notice"
        >
          {notice}
        </div>
      ) : plan ? (
        <>
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-raids-note"
          >
            {request.eventOnly ? t("raids.noteLightning") : t("raids.note")}
            {plan.plannedCount > 0
              ? ` ${t("raids.planned", { count: plan.plannedCount })}`
              : ""}
            {` ${t("raids.budget", { energy: plan.energyBudget })}`}
          </p>
          {plan.rows.length > 0 ? (
            <>
              <ul className="grid gap-2" data-testid="hre-raids-list">
                {plan.rows.map((row) => (
                  <EventLocationRow
                    key={row.battleId}
                    fallbackLabel={row.battleId}
                    location={locations?.get(row.battleId)}
                    testId={`hre-raid-${row.battleId}`}
                  >
                    {row.goal && view ? (
                      <ResourceIconWithTooltip
                        className="size-6"
                        label={
                          view.resourceLabels.get(row.goal.resourceId) ??
                          row.goal.resourceId
                        }
                        visual={view.resourceVisuals.get(row.goal.resourceId)}
                      />
                    ) : null}
                    <Badge className="tabular-nums" variant="outline">
                      {t("raids.raidCount", { count: row.raids })}
                    </Badge>
                    <Badge className="tabular-nums" variant="secondary">
                      {t("raids.energy", { energy: row.energy })}
                    </Badge>
                  </EventLocationRow>
                ))}
              </ul>
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="hre-raids-totals"
              >
                <Badge variant="secondary">
                  {t("raids.raidCount", { count: plan.totalRaids })}
                </Badge>
                <Badge variant="outline">
                  {t("raids.energy", { energy: plan.totalEnergy })}
                </Badge>
                {plan.remainingAfter > 0 ? (
                  <span
                    className="text-sm text-muted-foreground"
                    data-testid="hre-raids-left-after"
                  >
                    {t("raids.leftAfter", { count: plan.remainingAfter })}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <EmptyState plan={plan} battlesToGo={request.battlesToGo} />
          )}
        </>
      ) : null}
      {loaded ? (
        <CampaignSummary plan={plan} remainingBattles={remainingBattles} />
      ) : null}
    </section>
  )
}

function EmptyState({
  plan,
  battlesToGo,
}: {
  plan: MissionRaidPlan
  battlesToGo: number
}) {
  const { t } = useTranslation(["hre", "dailies"])
  const [, setFilters] = useRaidsFilters()
  const reason = plan.empty ?? "no-candidates"
  return (
    <div
      className="space-y-2 text-sm text-muted-foreground"
      data-testid={`hre-raids-empty-${reason}`}
    >
      <p>
        {reason === "plan-completes"
          ? t("hre:raids.empty.planCompletes")
          : reason === "no-energy"
            ? t("hre:raids.empty.noEnergy", { count: plan.plannedCount })
            : reason === "no-event"
              ? t("hre:raids.empty.noEvent", { count: battlesToGo })
              : t("hre:raids.empty.noCandidates")}
      </p>
      {reason === "filtered" ? (
        <Button
          data-testid="hre-raids-reset"
          onClick={() => setFilters(emptyRaidsFilters)}
          size="sm"
          variant="outline"
        >
          {t("dailies:raidsFilters.filteredOut.reset")}
        </Button>
      ) : null}
    </div>
  )
}

function CampaignSummary({
  plan,
  remainingBattles,
}: {
  plan: MissionRaidPlan | undefined
  remainingBattles: number
}) {
  const { t, i18n } = useTranslation("hre")
  const n = (value: number) => value.toLocaleString(i18n.language)
  const cost = plan?.cheapestEnergyCost ?? null
  const capacity = plan?.cheapestDailyCapacity ?? 0
  return (
    <p
      className="rounded-lg border px-3 py-2 text-sm"
      data-testid="hre-campaign-summary"
    >
      {remainingBattles === 0
        ? t("raids.summary.none")
        : cost === null || capacity === 0
          ? t("raids.summary.battles", { count: remainingBattles })
          : t("raids.summary.full", {
              count: remainingBattles,
              battles: n(remainingBattles),
              energy: n(remainingBattles * cost),
              days: n(Math.ceil(remainingBattles / capacity)),
            })}
    </p>
  )
}
