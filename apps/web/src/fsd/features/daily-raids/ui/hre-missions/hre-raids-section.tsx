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
import { RaidState } from "../raid-state"
import {
  HreCampaignOutlook,
  HreFactionRaids,
  HreNoDropRaids,
  RaidRows,
  type RaidRowsView,
} from "./hre-raids-extras"

/** With no open objective the plan still runs, for the outlook nodes and daily energy only. */
const SUMMARY_ONLY: MissionRaidsRequest = { battlesToGo: 0, eventOnly: false }

type HreRaidsRequest = MissionRaidsRequest & {
  /** "Mission 5", for the title. */
  missionLabel: string
  /** "battles": nodes to fight by hand (all-alliance wins, alliance ability uses), not raids. */
  kind: "raids" | "battles"
  /** The localized alliance an all-alliance team must use, when the objective asks for one. */
  allianceTeam: string | null
  /** The localized alliance the nodes are kept to, when the mission's objectives restrict them. */
  allianceNodes: string | null
  /** The localized faction of `enemyFaction`, for its separate node list. */
  enemyFactionName: string | null
}

/**
 * Dailies > HRE campaign raids: for the current mission's open campaign, lightning, all-alliance
 * lineup or alliance-ability objective, where to raid (or battle by hand, on full-team nodes) with the least of today's energy left, Today's plan aside (`planMissionRaids`),
 * with its totals and empty states, then the no-drop Indomitus alternative. Without one, `notice`
 * says why. Always ends with the campaign outlook: battles left over the remaining missions against
 * the days the event has left.
 */
export function HreRaidsSection({
  projectId,
  request,
  notice,
  remainingBattles,
  daysLeft,
}: {
  projectId?: string
  request: HreRaidsRequest | null
  notice: ReactNode
  remainingBattles: number
  daysLeft: number
}) {
  const { t } = useTranslation("hre")
  const raids = useDailyRaids(projectId, {
    missionRaids: request
      ? {
          battlesToGo: request.battlesToGo,
          eventOnly: request.eventOnly,
          slots: request.slots,
          alliance: request.alliance,
          enemyFaction: request.enemyFaction,
        }
      : SUMMARY_ONLY,
  })
  const loaded = raids.status !== "loading" && raids.status !== "error"
  const plan = loaded ? raids.missionRaids : undefined
  const locations = loaded ? raids.locationsByBattleId : undefined
  const view = raids.status === "ready" ? raids : null
  const rowsView: RaidRowsView = { locations, view }
  const battles = request?.kind === "battles"

  return (
    <section className="space-y-3" data-testid="hre-raids">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {request
            ? request.kind === "battles"
              ? t("raids.titleBattles", { mission: request.missionLabel })
              : t("raids.title", { mission: request.missionLabel })
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
            {request.kind === "battles"
              ? request.slots
                ? t("raids.noteBattles", {
                    slots: request.slots,
                    alliance: request.allianceTeam ?? "",
                  })
                : t("raids.noteLineupBattles", {
                    alliance: request.allianceTeam ?? "",
                  })
              : request.eventOnly
                ? t("raids.noteLightning")
                : t("raids.note")}
            {request.kind === "raids" && request.allianceNodes
              ? ` ${t("raids.noteAllianceNodes", { alliance: request.allianceNodes })}`
              : null}
            {` ${t(battles ? "raids.budgetBattles" : "raids.budget", { energy: plan.energyBudget })}`}
          </p>
          {plan.rows.length > 0 ? (
            <>
              <RaidRows
                rows={plan.rows}
                testId="hre-raids-list"
                view={rowsView}
              />
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="hre-raids-totals"
              >
                <Badge variant="secondary">
                  {t(battles ? "raids.battleCount" : "raids.raidCount", {
                    count: plan.totalRaids,
                  })}
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
          {request.enemyFaction && request.enemyFactionName ? (
            <HreFactionRaids
              faction={request.enemyFactionName}
              killsToGo={request.enemyFaction.killsToGo}
              lightning={request.eventOnly}
              rows={plan.factionRows}
              view={rowsView}
            />
          ) : null}
          {plan.noDropRows.length > 0 ? (
            <HreNoDropRaids
              battles={battles}
              rows={plan.noDropRows}
              view={rowsView}
            />
          ) : null}
        </>
      ) : null}
      {loaded ? (
        <HreCampaignOutlook
          daysLeft={daysLeft}
          plan={plan}
          remainingBattles={remainingBattles}
        />
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
        {reason === "no-energy"
          ? t("hre:raids.empty.noEnergy")
          : reason === "no-attempts"
            ? t("hre:raids.empty.noAttempts")
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
