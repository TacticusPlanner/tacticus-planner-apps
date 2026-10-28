import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  battleGlyphIcon,
  energyIcon,
  raidTicketIcon,
} from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type {
  MissionBattlesRequest,
  MissionRaidPlan,
  MissionRaidsRequest,
} from "../../model/mission-raids"
import {
  missionDeployGroups,
  type MissionDeployGroup,
} from "../../model/mission-deploy-groups"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { useActiveHomeScreenEvent } from "../../model/use-active-home-screen-event"
import { useDailyRaids } from "../../model/use-daily-raids"
import { useHomeScreenEventName } from "../home-screen-event/use-home-screen-event-name"
import { RaidState } from "../raid-state"
import { HreHandBattles } from "./hre-hand-battles"
import {
  HreCampaignOutlook,
  HreNoDropRaids,
  RaidRows,
  type RaidRowsView,
} from "./hre-raids-extras"

/** With no open objective the plan still runs, for the outlook nodes and daily energy only. */
const SUMMARY_ONLY: MissionRaidsRequest = { battlesToGo: 0, eventOnly: false }

type HreRaidsRequest = {
  /** "Mission 5", for the title. */
  missionLabel: string
  /** The open campaign-win, campaign-raid or lightning objective's raids. */
  raids: { battlesToGo: number; eventOnly: boolean } | null
  /** The open manual objectives' battles to fight by hand, with their localized node limits. */
  manual:
    | (MissionBattlesRequest & {
        allianceName: string | null
        heroFactionName?: string | null
        factionName: string | null
      })
    | null
  /** Why the manual objectives get no list (the featured hero's alliance is not known yet). */
  manualNotice: string | null
}

/**
 * Dailies > HRE campaign suggestions for the current mission, with the least of today's energy
 * left, Today's plan aside (`planMissionRaids`): the battles to fight by hand for its manual
 * objectives (kills, damage, healing, ability uses, lineup wins: raids count none of them), then
 * the raids for its campaign-win, campaign-raid or lightning objective, with their totals and empty
 * states and the no-drop Indomitus alternative. Without either, `notice` says why. Always ends
 * with the campaign outlook: battles left over the remaining missions against the days the event
 * has left.
 */
export function HreRaidsSection({
  request,
  notice,
  remainingBattles,
  daysLeft,
  renderTeams,
}: {
  request: HreRaidsRequest | null
  notice: ReactNode
  remainingBattles: number
  daysLeft: number
  /** The teams for the battles to fight by hand: one per group of nodes that allow the same
   * factions, shown under the list. */
  renderTeams?: (groups: readonly MissionDeployGroup[]) => ReactNode
}) {
  const { t } = useTranslation("hre")
  // A running Home Screen Event with a raid rule ranks the nodes too, so both events progress.
  const homeScreenEvent = useActiveHomeScreenEvent()
  const eventName = useHomeScreenEventName()
  const runningEventRule =
    homeScreenEvent.status === "ready" ? homeScreenEvent.activeRaidRule : null
  const runningEvent =
    runningEventRule && homeScreenEvent.status === "ready"
      ? homeScreenEvent.active
      : null
  const manual = request?.manual ?? null
  // Built once per change of the request, so the raids engine does not rerun on a page re-render.
  const battlesToGo = request?.raids?.battlesToGo ?? 0
  const eventOnly = request?.raids?.eventOnly ?? false
  const hasRequest = !!request
  const missionRaids = useMemo(
    (): MissionRaidsRequest =>
      hasRequest
        ? {
            battlesToGo,
            eventOnly,
            ...(manual
              ? {
                  manual: {
                    needs: manual.needs,
                    slots: manual.slots,
                    alliance: manual.alliance,
                    heroFaction: manual.heroFaction,
                    faction: manual.faction,
                    preferLightning: manual.preferLightning,
                    countsAsRaids: manual.countsAsRaids,
                  },
                }
              : {}),
          }
        : SUMMARY_ONLY,
    [hasRequest, battlesToGo, eventOnly, manual]
  )
  const raids = useDailyRaids(undefined, {
    homeScreenEventRule: runningEventRule ?? undefined,
    eventFarm: false,
    missionRaids,
  })
  const loaded = raids.status !== "loading" && raids.status !== "error"
  const plan = loaded ? raids.missionRaids : undefined
  const locations = loaded ? raids.locationsByBattleId : undefined
  const view = raids.status === "ready" ? raids : null
  const rowsView: RaidRowsView = { locations, view }
  const shown = request && (request.raids || manual || request.manualNotice)
  const hseNote =
    runningEvent &&
    plan &&
    [...plan.rows, ...plan.noDropRows, ...(plan.battles?.rows ?? [])].some(
      (row) => row.eventPoints > 0
    )
      ? t("raids.noteHomeScreenEvent", { event: eventName(runningEvent) })
      : null

  return (
    <section className="space-y-3" data-testid="hre-raids">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {shown
            ? t("raids.title", { mission: request.missionLabel })
            : t("raids.titleNone")}
        </h2>
        {request?.raids ? (
          <Badge data-testid="hre-raids-to-go" variant="secondary">
            <EntityIcon
              alt=""
              className="size-3.5"
              src={battleGlyphIcon("campaignBattle")}
            />
            {t("raids.toGo", { count: request.raids.battlesToGo })}
          </Badge>
        ) : null}
      </div>
      {raids.status === "loading" || raids.status === "error" ? (
        <RaidState state={raids.status} />
      ) : !shown ? (
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
            data-testid="hre-raids-budget"
          >
            {t("raids.budget", { energy: plan.energyBudget })}
            {hseNote ? ` ${hseNote}` : null}
          </p>
          {request.manualNotice ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="hre-battles-notice"
            >
              {request.manualNotice}
            </p>
          ) : null}
          {manual && plan.battles ? (
            <HreHandBattles
              notes={{
                slots: manual.slots,
                alliance: manual.allianceName,
                heroFaction: manual.heroFactionName ?? null,
                faction: manual.factionName,
                preferLightning: manual.preferLightning,
                countsAsWins: manual.countsAsRaids,
              }}
              plan={plan.battles}
              view={rowsView}
            />
          ) : null}
          {manual && plan.battles && renderTeams
            ? renderTeams(
                missionDeployGroups(
                  plan.battles.rows,
                  (battleId) => locations?.get(battleId)?.campaignName
                )
              )
            : null}
          {request.raids ? (
            <RaidsList
              eventOnly={request.raids.eventOnly}
              plan={plan}
              rowsView={rowsView}
              titled={!!manual}
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

/** The raid objective's raids: the note, the rows with their totals or why there are none, and the
 * no-drop alternative. */
function RaidsList({
  plan,
  eventOnly,
  rowsView,
  titled,
}: {
  plan: MissionRaidPlan
  eventOnly: boolean
  rowsView: RaidRowsView
  /** Battles by hand come first, so the raids get their own heading. */
  titled: boolean
}) {
  const { t } = useTranslation("hre")
  return (
    <div className="space-y-2" data-testid="hre-raids-main">
      {titled ? <h3 className="font-medium">{t("raids.raidsTitle")}</h3> : null}
      <p className="text-sm text-muted-foreground" data-testid="hre-raids-note">
        {eventOnly ? t("raids.noteLightning") : t("raids.note")}
      </p>
      {plan.battlesLeft <= 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="hre-raids-covered"
        >
          {t("raids.coveredByBattles")}
        </p>
      ) : plan.rows.length > 0 ? (
        <>
          <RaidRows rows={plan.rows} testId="hre-raids-list" view={rowsView} />
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="hre-raids-totals"
          >
            <Badge variant="secondary">
              <EntityIcon alt="" className="size-3.5" src={raidTicketIcon()} />
              {t("raids.raidCount", { count: plan.totalRaids })}
            </Badge>
            <Badge variant="outline">
              <EntityIcon alt="" className="size-3.5" src={energyIcon()} />
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
        <EmptyState battlesToGo={plan.battlesLeft} plan={plan} />
      )}
      {plan.noDropRows.length > 0 ? (
        <HreNoDropRaids rows={plan.noDropRows} view={rowsView} />
      ) : null}
    </div>
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
