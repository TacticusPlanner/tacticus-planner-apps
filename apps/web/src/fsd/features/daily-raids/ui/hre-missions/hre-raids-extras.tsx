import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import {
  battleGlyphIcon,
  energyIcon,
  raidTicketIcon,
} from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import { campaignOutlook } from "../../model/campaign-outlook"
import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceVisual,
  DailyRaidsReadyViewModel,
} from "../../model/daily-raids.domain"
import type { MissionRaidPlan } from "../../model/mission-raids"
import { CampaignGroupedList } from "../campaign-group"
import type { RaidLocationTarget } from "../raid-location-name"
import { EventLocationRow } from "../home-screen-event/event-location-row"
import { ResourceIconWithTooltip } from "../resource-icon"
import { ResourceStock } from "../resource-stock"
import { useListPaging } from "../../model/use-list-paging"
import { ListPagingControls } from "../list-paging-controls"

/** What the raid rows read: the location labels, and the goal plan for drop icons and stock. */
export type RaidRowsView = {
  locations: ReadonlyMap<BattleId, DailyRaidLocationViewModel> | undefined
  view: DailyRaidsReadyViewModel | null
  /** Makes each battle's name open its enemies. */
  onShowLocation?: (target: RaidLocationTarget) => void
  /** A node's catalog drop with what the player holds of it, for a row that feeds no goal. */
  nodeDrop?: (battleId: BattleId) => HreNodeDrop | undefined
}

/** A node's own drop and the player's inventory of it. */
type HreNodeDrop = {
  label: string
  visual: DailyRaidResourceVisual
  owned: number
}

/** A node's drop as a row shows it: the goal's resource with "owned/target", else the node's own
 * drop with what the player holds. */
export function RowDrop({
  battleId,
  resourceId,
  view: { view, nodeDrop },
  testId,
}: {
  battleId: BattleId
  resourceId: string | undefined
  view: RaidRowsView
  testId: string
}) {
  const { t } = useTranslation("dailies")
  if (resourceId !== undefined && view) {
    return (
      <span className="flex shrink-0 items-center gap-1">
        <ResourceIconWithTooltip
          size="icon-lg"
          label={view.resourceLabels.get(resourceId) ?? resourceId}
          visual={view.resourceVisuals.get(resourceId)}
        />
        <ResourceStock
          progress={view.resourceTotals.get(resourceId)}
          testId={`${testId}-stock`}
        />
      </span>
    )
  }
  const drop = nodeDrop?.(battleId)
  if (!drop) return null
  return (
    <span className="flex shrink-0 items-center gap-1">
      <ResourceIconWithTooltip
        size="icon-lg"
        label={drop.label}
        visual={drop.visual}
      />
      <span
        className="text-xs text-muted-foreground tabular-nums"
        data-testid={`${testId}-owned`}
      >
        {t("hse.raids.owned", { count: drop.owned })}
      </span>
    </span>
  )
}

/** One row per suggested node, as a regular raid card row: its battle (opening its enemies), the
 * goal drop with "owned/target" (or the node's own drop with what the player holds) and the running
 * Home Screen Event's points; a by-hand battle row adds a second line with the enemies a battle
 * defeats (for kills) and its battle count. A raid row shows no raid
 * count or energy; a by-hand battle row keeps its battle count, and an open-ended row shows its
 * energy per battle. */
export function RaidRows({
  rows,
  testId,
  view: rowsView,
  battles = false,
  openEnded = false,
}: {
  rows: MissionRaidPlan["rows"]
  testId: string
  view: RaidRowsView
  /** Rows of battles fought by hand, counted as battles rather than raids. */
  battles?: boolean
  /** No count to show: the rows are the best nodes to fight until the objective is done. */
  openEnded?: boolean
}) {
  const { t } = useTranslation("hre")
  const { locations, onShowLocation } = rowsView
  const paging = useListPaging(rows)
  return (
    <>
      <CampaignGroupedList
        battleIdOf={(row) => row.battleId}
        locationsByBattleId={locations}
        rows={paging.visible}
        testId={testId}
        renderRow={(row) => {
          return (
            <EventLocationRow
              key={row.battleId}
              battleId={row.battleId}
              onShowLocation={onShowLocation}
              fallbackLabel={row.battleId}
              location={locations?.get(row.battleId)}
              testId={`hre-raid-${row.battleId}`}
              details={
                battles && !openEnded ? (
                  <BattleDetails
                    battles={row.raids}
                    enemies={row.enemies}
                    testId={`hre-raid-${row.battleId}`}
                  />
                ) : null
              }
            >
              <RowDrop
                battleId={row.battleId}
                resourceId={row.goal?.resourceId}
                testId={`hre-raid-${row.battleId}`}
                view={rowsView}
              />
              {row.eventPoints > 0 ? (
                <Badge
                  className="tabular-nums"
                  data-testid={`hre-raid-${row.battleId}-event-points`}
                  variant="outline"
                >
                  {t("raids.eventPoints", { points: row.eventPoints })}
                </Badge>
              ) : null}
              {openEnded ? (
                <Badge className="tabular-nums" variant="secondary">
                  <EntityIcon size="icon" alt="" src={energyIcon()} />
                  {t("raids.energyPerBattle", { energy: row.energyCost })}
                </Badge>
              ) : null}
            </EventLocationRow>
          )
        }}
      />
      <ListPagingControls paging={paging} testId={`${testId}-paging`} />
    </>
  )
}

/** A by-hand battle row's second line: the enemies one battle defeats (kill objectives) and the
 * battles to fight there. */
function BattleDetails({
  battles,
  enemies,
  testId,
}: {
  battles: number
  enemies: number | undefined
  testId: string
}) {
  const { t } = useTranslation("hre")
  return (
    <>
      {enemies === undefined ? null : (
        <Badge
          className="tabular-nums"
          data-testid={`${testId}-enemies`}
          variant="outline"
        >
          {t("raids.enemyCount", { count: enemies })}
        </Badge>
      )}
      <Badge className="tabular-nums" variant="outline">
        <EntityIcon
          size="icon"
          alt=""
          src={battleGlyphIcon("campaignBattle")}
        />
        {t("raids.battleCount", { count: battles })}
      </Badge>
    </>
  )
}

/**
 * The nodes that drop nothing (Indomitus 6 to 14), kept apart because some players skip them for
 * their missing drops and low gold: each raid here replaces one above for less energy.
 */
export function HreNoDropRaids({
  rows,
  view,
}: {
  rows: MissionRaidPlan["noDropRows"]
  view: RaidRowsView
}) {
  const { t } = useTranslation("hre")
  const raids = rows.reduce((total, row) => total + row.raids, 0)
  const energy = rows.reduce((total, row) => total + row.energy, 0)
  return (
    <div className="space-y-2 border-t pt-3" data-testid="hre-raids-no-drop">
      <h3 className="font-medium">{t("raids.noDrop.title")}</h3>
      <p className="text-sm text-muted-foreground">{t("raids.noDrop.note")}</p>
      <RaidRows rows={rows} testId="hre-raids-no-drop-list" view={view} />
      <div
        className="flex flex-wrap gap-2"
        data-testid="hre-raids-no-drop-totals"
      >
        <Badge variant="secondary">
          <EntityIcon size="icon" alt="" src={raidTicketIcon()} />
          {t("raids.raidCount", { count: raids })}
        </Badge>
        <Badge variant="outline">
          <EntityIcon size="icon" alt="" src={energyIcon()} />
          {t("raids.energy", { energy })}
        </Badge>
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
  if (!outlook || (!noNodes && outlook.shortfall > 0)) {
    return (
      <p
        className="rounded-lg border px-3 py-2 text-sm"
        data-testid="hre-campaign-summary"
      >
        {outlook
          ? t("raids.summary.short", {
              count: outlook.daysLeft,
              battles: n(outlook.battles),
              max: n(outlook.maxPerDay),
              short: n(outlook.shortfall),
            })
          : t("raids.summary.none")}
      </p>
    )
  }
  // Fits: the battles, the daily pace and its energy as chips instead of a sentence.
  const energy = noNodes ? null : outlook.perDayEnergy
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
      data-testid="hre-campaign-summary"
    >
      <span className="text-muted-foreground">{t("raids.summary.label")}</span>
      <Badge variant="secondary">
        <EntityIcon
          size="icon"
          alt=""
          src={battleGlyphIcon("campaignBattle")}
        />
        {t("raids.summary.chipBattles", { battles: n(outlook.battles) })}
      </Badge>
      <Badge variant="outline">
        {t("raids.summary.chipPerDay", {
          count: outlook.daysLeft,
          perDay: n(outlook.perDay),
        })}
      </Badge>
      {energy === null ? null : (
        <Badge variant="outline">
          <EntityIcon size="icon" alt="" src={energyIcon()} />
          {t("raids.summary.chipEnergy", { energy: n(energy) })}
        </Badge>
      )}
    </div>
  )
}
