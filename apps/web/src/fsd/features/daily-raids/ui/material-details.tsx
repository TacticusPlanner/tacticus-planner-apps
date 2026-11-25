import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Lock } from "lucide-react"
import { shopIcon } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { shopCurrencyIcon } from "@/entities/shops/reward"
import { CampaignLocationName, EntityIcon } from "@/shared/ui"

import type {
  DailyRaidLocationViewModel,
  DailyRaidsReadyViewModel,
  ResourceShopSource,
} from "../model/daily-raids.domain"
import {
  exhaustedBattleIdsOf,
  materialAlternatives,
  todaysMaterialCell,
} from "../model/material-details"
import type { MaterialDetailsSource } from "../model/material-details-context"
import type {
  MaterialAlternative,
  MaterialLockedNode,
} from "../model/material-details"
import type { PlanCell } from "../model/plan-day-cells"
import { ManualBattleBadge } from "./manual-battle"

/** Entries a list shows before its "Show N more" (Goals' Unlocks at uses the same control). */
const LIST_LIMIT = 4

/**
 * The body of a material's details popover (Raids, Plan > Schedule, Home): what the player holds of
 * it, the units that need it, the day's raids for it, then every other source ("Also available
 * from"): campaigns and campaign events (raidable nodes first, then locked ones, closest first with
 * how far away they are) and shops. Each list shows four entries and a "Show N more" toggle. Built
 * only while the popover is open, so long lists stay cheap.
 */
export function MaterialDetails({
  cell,
  raids,
  exhaustedBattleIds,
  lockedNodes,
  testId,
}: {
  cell: PlanCell
  raids: Pick<
    DailyRaidsReadyViewModel,
    "sourcesByResource" | "eligibleBattleIds" | "locationsByBattleId"
  >
  exhaustedBattleIds: ReadonlySet<BattleId>
  lockedNodes?: readonly MaterialLockedNode[]
  testId: string
}) {
  const { t } = useTranslation("dailies")
  const { campaigns, events, shops } = materialAlternatives(
    cell,
    raids,
    exhaustedBattleIds,
    lockedNodes
  )
  const hasAlternatives = campaigns.length + events.length + shops.length > 0

  return (
    <div className="flex flex-col gap-3 text-sm" data-testid={`${testId}-body`}>
      <div className="grid gap-0.5">
        {cell.target > 0 ? (
          <span className="font-semibold tabular-nums">
            {t("schedule.progress", { owned: cell.owned, target: cell.target })}
          </span>
        ) : null}
        {cell.units.length > 0 ? (
          <span className="text-muted-foreground">
            {t("materialDetails.neededBy", {
              units: cell.units.map((unit) => unit.unitLabel).join(", "),
            })}
          </span>
        ) : null}
      </div>
      {cell.nodes.length > 0 ? (
        <DetailsGroup
          items={cell.nodes}
          label={t("materialDetails.raids")}
          renderItem={(node) => (
            <li className="flex items-center gap-1" key={node.battleId}>
              <NodeLocation
                battleId={node.battleId}
                location={raids.locationsByBattleId.get(node.battleId)}
              />
              <span className="text-muted-foreground tabular-nums">
                {t("plan.cell.nodeRaids", { raids: node.raidsPerformed })}
              </span>
            </li>
          )}
          testId={`${testId}-raids`}
        />
      ) : null}
      {hasAlternatives ? (
        <div className="grid gap-2" data-testid={`${testId}-alternatives`}>
          <span className="font-semibold">{t("plan.cell.alternatives")}</span>
          <BattleGroup
            alternatives={campaigns}
            label={t("plan.cell.alternativeGroups.campaigns")}
            locationsByBattleId={raids.locationsByBattleId}
            testId={`${testId}-alternatives-campaigns`}
          />
          <BattleGroup
            alternatives={events}
            label={t("plan.cell.alternativeGroups.events")}
            locationsByBattleId={raids.locationsByBattleId}
            testId={`${testId}-alternatives-events`}
          />
          <ShopGroup shops={shops} testId={`${testId}-alternatives-shops`} />
        </div>
      ) : null}
    </div>
  )
}

/** A labelled list showing its first four entries, then "Show N more" / "Show fewer" in place. */
function DetailsGroup<T>({
  items,
  label,
  renderItem,
  testId,
}: {
  items: readonly T[]
  label: string
  renderItem: (item: T) => ReactNode
  testId: string
}) {
  const { t } = useTranslation("dailies")
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null
  const hidden = items.length - LIST_LIMIT
  const shown = expanded ? items : items.slice(0, LIST_LIMIT)
  return (
    <div className="grid gap-1" data-testid={testId}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <ul aria-label={label} className="grid gap-1">
        {shown.map((item) => renderItem(item))}
      </ul>
      {hidden > 0 ? (
        <Button
          aria-expanded={expanded}
          className="relative h-auto justify-self-start p-0 text-xs after:absolute after:inset-x-0 after:-inset-y-2 pointer-coarse:after:-inset-y-4"
          onClick={() => setExpanded((value) => !value)}
          type="button"
          variant="link"
        >
          {expanded
            ? t("materialDetails.showFewer")
            : t("materialDetails.showMore", { count: hidden })}
        </Button>
      ) : null}
    </div>
  )
}

function BattleGroup({
  alternatives,
  label,
  locationsByBattleId,
  testId,
}: {
  alternatives: MaterialAlternative[]
  label: string
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  testId: string
}) {
  const { t } = useTranslation("dailies")
  return (
    <DetailsGroup
      items={alternatives}
      label={label}
      renderItem={(alternative) => (
        <li
          className="grid gap-0.5"
          data-locked={alternative.locked || undefined}
          key={alternative.battleId}
        >
          <span
            className={cn(
              "flex flex-wrap items-center gap-1",
              alternative.locked && "text-muted-foreground"
            )}
          >
            <NodeLocation
              battleId={alternative.battleId}
              location={locationsByBattleId.get(alternative.battleId)}
            />
            {alternative.locked ? (
              <Lock
                aria-label={t("plan.cell.locked")}
                className="size-icon-sm shrink-0"
                role="img"
              />
            ) : null}
            {alternative.distance ? (
              <span className="text-xs">· {alternative.distance}</span>
            ) : null}
          </span>
          {alternative.notes.length > 0 ? (
            <ul className="ps-5 text-xs text-amber-800 dark:text-amber-400">
              {alternative.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </li>
      )}
      testId={testId}
    />
  )
}

function ShopGroup({
  shops,
  testId,
}: {
  shops: readonly ResourceShopSource[]
  testId: string
}) {
  const { t, i18n } = useTranslation(["dailies", "shops"])
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <DetailsGroup
      items={shops}
      label={t("dailies:plan.cell.alternativeGroups.shops")}
      renderItem={(shop) => {
        const currency = t(`shops:currency.${shop.currency}`, {
          defaultValue: shop.currency,
        })
        return (
          <li
            className="flex items-center gap-1"
            key={`${shop.shopId}|${shop.currency}`}
          >
            <EntityIcon size="inline" alt="" src={shopIcon(shop.shopId)} />
            <span>
              {t(`shops:shopName.${shop.shopId}`, {
                defaultValue: shop.shopId,
              })}
            </span>
            <span
              aria-label={t("dailies:plan.cell.shopPrice", {
                qty: shop.rewardQty,
                cost: number.format(shop.cost),
                currency,
              })}
              className="flex items-center gap-0.5 text-muted-foreground tabular-nums"
              role="img"
            >
              {t("dailies:plan.cell.shopQty", { qty: shop.rewardQty })}
              <EntityIcon
                size="inline"
                alt=""
                src={shopCurrencyIcon(shop.currency)}
              />
              {number.format(shop.cost)}
            </span>
          </li>
        )
      }}
      testId={testId}
    />
  )
}

function NodeLocation({
  battleId,
  location,
}: {
  battleId: BattleId
  location: DailyRaidLocationViewModel | undefined
}) {
  return (
    <>
      {location?.icon ? (
        <EntityIcon
          size="inline"
          alt=""
          className="shrink-0"
          src={location.icon}
        />
      ) : null}
      <span>
        <CampaignLocationName
          campaignName={location?.campaignName ?? battleId}
          difficultyLabel={location?.difficultyLabel}
          nodeLabel={location?.nodeLabel}
        />
      </span>
      {location?.manual ? <ManualBattleBadge compact /> : null}
    </>
  )
}

/** Raids' and Home's material details: today's raids for it, from the surrounding plan run. */
export function TodaysMaterialDetails({
  source,
  resourceId,
  testId,
}: {
  source: MaterialDetailsSource
  resourceId: string
  testId: string
}) {
  const { raids } = source
  return (
    <WithLockedNodes resourceId={resourceId} source={source}>
      {(lockedNodes) => (
        <MaterialDetails
          cell={todaysMaterialCell(raids, resourceId)}
          exhaustedBattleIds={exhaustedBattleIdsOf(raids)}
          lockedNodes={lockedNodes}
          raids={raids}
          testId={testId}
        />
      )}
    </WithLockedNodes>
  )
}

/** Renders `children` with the source's locked nodes for a resource, or none without a source. */
export function WithLockedNodes({
  source,
  resourceId,
  children,
}: {
  source: Pick<MaterialDetailsSource, "LockedNodes"> | null
  resourceId: string
  children: (nodes: readonly MaterialLockedNode[]) => ReactNode
}) {
  const LockedNodes = source?.LockedNodes
  if (!LockedNodes) return children([])
  return <LockedNodes resourceId={resourceId}>{children}</LockedNodes>
}
