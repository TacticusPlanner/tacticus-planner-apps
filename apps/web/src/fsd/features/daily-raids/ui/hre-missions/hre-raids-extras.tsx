import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import { campaignOutlook } from "../../model/campaign-outlook"
import type {
  DailyRaidGoalViewModel,
  DailyRaidLocationViewModel,
  DailyRaidsReadyViewModel,
} from "../../model/daily-raids.domain"
import type { MissionRaidPlan } from "../../model/mission-raids"
import { EventGoalIcons } from "../home-screen-event/event-goal-icons"
import { EventLocationRow } from "../home-screen-event/event-location-row"
import { ResourceIconWithTooltip } from "../resource-icon"
import { ResourceStock } from "../resource-stock"

/** What the raid rows read: the location labels, and the goal plan for drop icons and stock. */
export type RaidRowsView = {
  locations: ReadonlyMap<BattleId, DailyRaidLocationViewModel> | undefined
  view: DailyRaidsReadyViewModel | null
}

/** One row per suggested node: its location, the goals it feeds (as on the HSE farm list), the goal
 * drop with "owned/target", raids and energy. */
export function RaidRows({
  rows,
  testId,
  view: { locations, view },
}: {
  rows: MissionRaidPlan["rows"]
  testId: string
  view: RaidRowsView
}) {
  const { t } = useTranslation("hre")
  return (
    <ul className="grid gap-2" data-testid={testId}>
      {rows.map((row) => {
        const resourceId = row.goal?.resourceId
        const goals = (row.goal?.goalIds ?? [])
          .map((goalId) => view?.goalsById.get(goalId))
          .filter((goal): goal is DailyRaidGoalViewModel => !!goal)
        return (
          <EventLocationRow
            key={row.battleId}
            fallbackLabel={row.battleId}
            location={locations?.get(row.battleId)}
            testId={`hre-raid-${row.battleId}`}
          >
            <EventGoalIcons
              goals={goals}
              testId={`hre-raid-${row.battleId}-goals`}
            />
            {resourceId && view ? (
              <span className="flex items-center gap-1">
                <ResourceIconWithTooltip
                  className="size-6"
                  label={view.resourceLabels.get(resourceId) ?? resourceId}
                  visual={view.resourceVisuals.get(resourceId)}
                />
                <ResourceStock
                  progress={view.resourceTotals.get(resourceId)}
                  testId={`hre-raid-${row.battleId}-stock`}
                />
              </span>
            ) : null}
            <Badge className="tabular-nums" variant="outline">
              {t("raids.raidCount", { count: row.raids })}
            </Badge>
            <Badge className="tabular-nums" variant="secondary">
              {t("raids.energy", { energy: row.energy })}
            </Badge>
          </EventLocationRow>
        )
      })}
    </ul>
  )
}

/**
 * For a faction-kill objective (mission 11's Necrons): the cheapest nodes with that faction's
 * enemies, apart from the main list, filled with the energy it leaves until their enemies cover the
 * kills still needed.
 */
export function HreFactionRaids({
  rows,
  faction,
  killsToGo,
  view,
}: {
  rows: MissionRaidPlan["factionRows"]
  /** The localized faction. */
  faction: string
  killsToGo: number
  view: RaidRowsView
}) {
  const { t } = useTranslation("hre")
  const raids = rows.reduce((total, row) => total + row.raids, 0)
  const energy = rows.reduce((total, row) => total + row.energy, 0)
  return (
    <div className="space-y-2 border-t pt-3" data-testid="hre-raids-faction">
      <h3 className="font-medium">{t("raids.faction.title", { faction })}</h3>
      <p className="text-sm text-muted-foreground">
        {rows.length > 0
          ? t("raids.faction.note", { faction, count: killsToGo })
          : t("raids.faction.none", { faction })}
      </p>
      {rows.length > 0 ? (
        <>
          <RaidRows rows={rows} testId="hre-raids-faction-list" view={view} />
          <div
            className="flex flex-wrap gap-2"
            data-testid="hre-raids-faction-totals"
          >
            <Badge variant="secondary">
              {t("raids.raidCount", { count: raids })}
            </Badge>
            <Badge variant="outline">{t("raids.energy", { energy })}</Badge>
          </div>
        </>
      ) : null}
    </div>
  )
}

/**
 * The nodes that drop nothing (Indomitus 6 to 14), kept apart because some players skip them for
 * their missing drops and low gold: each raid here replaces one above for less energy.
 */
export function HreNoDropRaids({
  rows,
  view,
  battles,
}: {
  rows: MissionRaidPlan["noDropRows"]
  view: RaidRowsView
  /** Nodes to fight by hand rather than raid. */
  battles: boolean
}) {
  const { t } = useTranslation("hre")
  const raids = rows.reduce((total, row) => total + row.raids, 0)
  const energy = rows.reduce((total, row) => total + row.energy, 0)
  return (
    <div className="space-y-2 border-t pt-3" data-testid="hre-raids-no-drop">
      <h3 className="font-medium">{t("raids.noDrop.title")}</h3>
      <p className="text-sm text-muted-foreground">
        {t(battles ? "raids.noDrop.noteBattles" : "raids.noDrop.note")}
      </p>
      <RaidRows rows={rows} testId="hre-raids-no-drop-list" view={view} />
      <div
        className="flex flex-wrap gap-2"
        data-testid="hre-raids-no-drop-totals"
      >
        <Badge variant="secondary">
          {t(battles ? "raids.battleCount" : "raids.raidCount", {
            count: raids,
          })}
        </Badge>
        <Badge variant="outline">{t("raids.energy", { energy })}</Badge>
      </div>
    </div>
  )
}

/**
 * The campaign battles left over the remaining missions against the days the event has left: how
 * many a day and their energy at the cheapest nodes, or how many cannot fit before the end.
 */
export function HreCampaignOutlook({
  plan,
  remainingBattles,
  daysLeft,
}: {
  plan: MissionRaidPlan | undefined
  remainingBattles: number
  daysLeft: number
}) {
  const { t, i18n } = useTranslation("hre")
  const n = (value: number) => value.toLocaleString(i18n.language)
  const outlook = campaignOutlook(
    plan?.outlookNodes ?? [],
    plan?.dailyEnergy ?? 0,
    remainingBattles,
    daysLeft
  )
  const noNodes = (plan?.outlookNodes.length ?? 0) === 0
  const text = !outlook
    ? t("raids.summary.none")
    : !noNodes && outlook.shortfall > 0
      ? t("raids.summary.short", {
          count: outlook.daysLeft,
          battles: n(outlook.battles),
          max: n(outlook.maxPerDay),
          short: n(outlook.shortfall),
        })
      : noNodes || outlook.perDayEnergy === null
        ? t("raids.summary.perDay", {
            count: outlook.daysLeft,
            battles: n(outlook.battles),
            perDay: n(outlook.perDay),
          })
        : t("raids.summary.fits", {
            count: outlook.daysLeft,
            battles: n(outlook.battles),
            perDay: n(outlook.perDay),
            energy: n(outlook.perDayEnergy),
          })
  return (
    <p
      className="rounded-lg border px-3 py-2 text-sm"
      data-testid="hre-campaign-summary"
    >
      {text}
    </p>
  )
}
