import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  battleGlyphIcon,
  energyIcon,
  raidTicketIcon,
} from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { MissionRaidPlan } from "../../model/mission-raids"
import { missionDeployGroups } from "../../model/mission-deploy-groups"
import type { MissionDeployGroup } from "../../model/mission-deploy-groups"
import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { RaidState } from "../raid-state"
import { ResourceIcon } from "../resource-icon"
import { ResourceStock } from "../resource-stock"
import { HreHandBattles } from "./hre-hand-battles"
import { HreNoDropRaids, RaidRows } from "./hre-raids-extras"
import type { RaidRowsView } from "./hre-raids-extras"
import type { HreRaids, HreRaidsRequest } from "./use-hre-raids"

type Row = MissionRaidPlan["rows"][number]

/**
 * A suggestion's one row: the top node as a regular raid card row (campaign icon, node, the goal
 * drop with "owned/target"), then a count chip. Nothing in it is interactive: the whole row scrolls
 * to its details.
 */
function TopRowSummary({
  row,
  view,
  chip,
  testId,
}: {
  row: Row | undefined
  view: RaidRowsView
  chip: ReactNode
  testId: string
}) {
  const location = row ? view.locations?.get(row.battleId) : undefined
  const resourceId = row?.goal?.resourceId
  const raids = view.view
  return (
    <span
      className="flex min-w-0 flex-1 items-center gap-2"
      data-testid={testId}
    >
      {row ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <EntityIcon alt="" size="inline" src={location?.icon} />
          <span className="truncate">
            {location
              ? [location.campaignName, location.nodeLabel]
                  .filter(Boolean)
                  .join(" ")
              : row.battleId}
          </span>
        </span>
      ) : null}
      {resourceId !== undefined && raids ? (
        <span className="flex shrink-0 items-center gap-1">
          <ResourceIcon
            label={raids.resourceLabels.get(resourceId) ?? resourceId}
            size="row"
            visual={raids.resourceVisuals.get(resourceId)}
          />
          <ResourceStock
            progress={raids.resourceTotals.get(resourceId)}
            testId={`${testId}-stock`}
          />
        </span>
      ) : null}
      {chip}
    </span>
  )
}

/** The raid objective's row: its top raid node and "N raids" (or the battles to go while the
 * raids load or when none fit). */
export function HreRaidsSummary({
  raids,
  battlesToGo,
}: {
  raids: HreRaids
  battlesToGo: number
}) {
  const { t } = useTranslation("hre")
  const plan = raids.plan
  const counted = plan && plan.battlesLeft > 0 && plan.rows.length > 0
  return (
    <TopRowSummary
      chip={
        <Badge className="shrink-0 tabular-nums" variant="secondary">
          <EntityIcon
            alt=""
            size="inline"
            src={counted ? raidTicketIcon() : battleGlyphIcon("campaignBattle")}
          />
          {counted
            ? t("raids.raidCount", { count: plan.totalRaids })
            : t("raids.toGo", { count: battlesToGo })}
        </Badge>
      }
      row={counted ? plan.rows[0] : undefined}
      testId="hre-raids-summary"
      view={raids.rowsView}
    />
  )
}

/** The manual objectives' row: the top node to fight by hand and "N battles". */
export function HreBattlesSummary({ raids }: { raids: HreRaids }) {
  const { t } = useTranslation("hre")
  const battles = raids.plan?.battles
  return (
    <TopRowSummary
      chip={
        battles && !battles.openEnded && battles.totalBattles > 0 ? (
          <Badge className="shrink-0 tabular-nums" variant="secondary">
            <EntityIcon
              alt=""
              size="inline"
              src={battleGlyphIcon("campaignBattle")}
            />
            {t("raids.battleCount", { count: battles.totalBattles })}
          </Badge>
        ) : (
          <span className="shrink-0 text-muted-foreground">
            {t("raids.battles.title")}
          </span>
        )
      }
      row={battles?.rows[0]}
      testId="hre-battles-summary"
      view={raids.rowsView}
    />
  )
}

/** The raid objective's details: the energy note, then its raids with their totals, empty state and
 * the no-drop Indomitus alternative. */
export function HreRaidsDetails({
  raids,
  eventOnly,
}: {
  raids: HreRaids
  eventOnly: boolean
}) {
  const { t } = useTranslation("hre")
  if (raids.status !== "ready" || !raids.plan) {
    return <RaidState state={raids.status === "error" ? "error" : "loading"} />
  }
  const plan = raids.plan
  return (
    <div className="space-y-2" data-testid="hre-raids-main">
      <p className="text-sm text-muted-foreground" data-testid="hre-raids-note">
        {eventOnly ? t("raids.noteLightning") : t("raids.note")}{" "}
        {t("raids.unlimitedEnergy")}
        {raids.hseNote ? ` ${raids.hseNote}` : null}
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
          <RaidRows
            rows={plan.rows}
            testId="hre-raids-list"
            view={raids.rowsView}
          />
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="hre-raids-totals"
          >
            <Badge variant="secondary">
              <EntityIcon size="inline" alt="" src={raidTicketIcon()} />
              {t("raids.raidCount", { count: plan.totalRaids })}
            </Badge>
            <Badge variant="outline">
              <EntityIcon size="inline" alt="" src={energyIcon()} />
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
        <HreNoDropRaids rows={plan.noDropRows} view={raids.rowsView} />
      ) : null}
    </div>
  )
}

/** The manual objectives' details: the battles to fight by hand with their node rules, then the teams,
 * one per group of nodes that allow the same factions. */
export function HreBattlesDetails({
  raids,
  manual,
  renderTeams,
}: {
  raids: HreRaids
  manual: NonNullable<HreRaidsRequest["manual"]>
  /** The teams for the battles: one per group of nodes that allow the same factions. */
  renderTeams?: (groups: readonly MissionDeployGroup[]) => ReactNode
}) {
  if (raids.status !== "ready" || !raids.plan?.battles) {
    return <RaidState state={raids.status === "error" ? "error" : "loading"} />
  }
  const battles = raids.plan.battles
  return (
    <div className="space-y-3">
      {raids.hseNote ? (
        <p className="text-sm text-muted-foreground">{raids.hseNote}</p>
      ) : null}
      <HreHandBattles
        notes={{
          slots: manual.slots,
          alliance: manual.allianceName,
          heroFaction: manual.heroFactionName ?? null,
          faction: manual.factionName,
          preferLightning: manual.preferLightning,
          countsAsWins: manual.countsAsRaids,
        }}
        plan={battles}
        view={raids.rowsView}
      />
      {renderTeams
        ? renderTeams(
            missionDeployGroups(
              battles.rows,
              (battleId) =>
                raids.rowsView.locations?.get(battleId)?.campaignName
            )
          )
        : null}
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
