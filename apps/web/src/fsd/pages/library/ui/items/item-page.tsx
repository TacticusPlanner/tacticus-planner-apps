import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router"
import { Info } from "lucide-react"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { unitNeighbours } from "@/entities/unit"
import {
  ItemIcon,
  isPercentStat,
  itemStatsAt,
  useItemSlotName,
} from "@/shared/equipment"
import { HintTrigger, LocalReadFailure } from "@/shared/ui"

import { allFactionCount, costLadder } from "../../model/items/library-items"
import { UnitNavBar } from "../unit/unit-nav-bar"
import { ItemFor } from "./item-for"
import {
  LIBRARY_ITEMS_PATH,
  libraryItemPath,
  useLibraryItems,
} from "./use-library-items"

/**
 * `/library/items/:entityId`: one item's page. The unit top bar (back to the list, Previous / Next
 * through every item in list order), then its art, rarity, slot and relic flags, who can use it,
 * its stats at every level and its full upgrade cost ladder with the reclaim value at each level.
 */
export function ItemPage() {
  const { entityId } = useParams()
  const data = useLibraryItems()
  if (data.status === "loading") {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />
  }
  if (data.status === "error") return <LocalReadFailure retry={data.retry} />
  const item = data.items.find((entry) => entry.id === entityId)
  if (!item) return <Navigate replace to={LIBRARY_ITEMS_PATH} />
  return (
    <ItemDetail
      charactersById={data.charactersById}
      factionName={data.factionName}
      item={item}
      itemName={data.itemName}
      items={data.items}
    />
  )
}

function ItemDetail({
  item,
  items,
  charactersById,
  itemName,
  factionName,
}: {
  item: EquipmentStorageModel
  items: readonly EquipmentStorageModel[]
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  itemName: (item: EquipmentStorageModel) => string
  factionName: (id: string) => string
}) {
  const { t } = useTranslation(["library", "progression", "gameUi"])
  const isMobile = useIsMobile()
  const slotName = useItemSlotName()
  const name = itemName(item)
  const neighbours = unitNeighbours(
    items.map((entry) => entry.id),
    item.id
  )
  const navTarget = (id: string | undefined) => {
    const target = id ? items.find((entry) => entry.id === id) : undefined
    return target
      ? { to: libraryItemPath(target.id), name: itemName(target), state: null }
      : undefined
  }
  const flags = [
    t(`progression:rarities.${item.rarity}`, { defaultValue: item.rarity }),
    slotName(item.type),
    ...(item.isRelic
      ? [
          t(
            item.isUniqueRelic
              ? "items.detail.uniqueRelic"
              : "items.detail.relic"
          ),
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6" data-testid="library-item-page">
      <div className="-mx-4 md:-mx-6">
        <UnitNavBar
          back={{ to: LIBRARY_ITEMS_PATH, label: t("items.detail.back") }}
          breadcrumb={[
            t("characterUnit.breadcrumbLibrary"),
            t("gameUi:items.title"),
            name,
          ]}
          isMobile={isMobile}
          next={navTarget(neighbours.nextId)}
          position={
            neighbours.index >= 0
              ? t("unit.nav.position", {
                  index: neighbours.index + 1,
                  total: neighbours.total,
                })
              : undefined
          }
          previous={navTarget(neighbours.previousId)}
        />
      </div>
      <header className="flex items-center gap-4">
        <ItemIcon item={item} size="icon-2xl" />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-heading text-2xl/tight font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">{flags.join(" · ")}</p>
        </div>
      </header>
      <section className="flex flex-col gap-2" data-testid="library-item-for">
        <h3 className="text-lg font-semibold">{t("items.detail.for")}</h3>
        <ItemFor
          charactersById={charactersById}
          everyoneLabel={t("items.detail.everyone")}
          factionCount={allFactionCount(items)}
          factionName={factionName}
          item={item}
        />
      </section>
      <StatsTable item={item} />
      <CostLadder item={item} />
    </div>
  )
}

function StatsTable({ item }: { item: EquipmentStorageModel }) {
  const { t, i18n } = useTranslation("library")
  const stats = Object.keys(itemStatsAt(item, item.levels.length))
  const format = new Intl.NumberFormat(i18n.language)
  if (stats.length === 0) return null
  return (
    <section className="flex flex-col gap-2" data-testid="library-item-stats">
      <h3 className="text-lg font-semibold">{t("items.detail.stats")}</h3>
      <div className="max-w-full min-w-0 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("items.detail.level")}</TableHead>
              {stats.map((stat) => (
                <TableHead className="text-right" key={stat}>
                  {t(`characterUnit.glance.itemStats.${stat}`, {
                    defaultValue: stat,
                  })}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.levels.map((level, index) => (
              <TableRow key={index}>
                <TableCell className="tabular-nums">{index + 1}</TableCell>
                {stats.map((stat) => (
                  <TableCell className="text-right tabular-nums" key={stat}>
                    {format.format(level.stats[stat] ?? 0)}
                    {isPercentStat(stat) ? "%" : ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

/** Each level's cost to reach, and what a copy at that level returns when reclaimed. */
function CostLadder({ item }: { item: EquipmentStorageModel }) {
  const { t, i18n } = useTranslation(["library", "gameUi"])
  const format = (value: number) => value.toLocaleString(i18n.language)
  const ladder = costLadder(item)
  const mythic = ladder.some((row) => row.mythicSalvage > 0)
  const salvageLabel = mythic
    ? t("gameUi:items.mythicSalvage")
    : t("gameUi:items.salvage")
  const salvage = (row: (typeof ladder)[number]) =>
    mythic ? row.mythicSalvage : row.salvage
  const totalSalvage = (row: (typeof ladder)[number]) =>
    mythic ? row.totalMythicSalvage : row.totalSalvage
  return (
    <section className="flex flex-col gap-2" data-testid="library-item-ladder">
      <h3 className="text-lg font-semibold">{t("items.detail.ladder")}</h3>
      <div className="max-w-full min-w-0 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>{t("items.detail.level")}</TableHead>
              <TableHead className="text-center" colSpan={2}>
                {t("items.detail.step")}
              </TableHead>
              <TableHead className="text-center" colSpan={2}>
                <span className="inline-flex items-center gap-1">
                  {t("items.detail.total")}
                  <HintTrigger label={t("items.detail.totalHint")}>
                    <Info
                      aria-hidden
                      className="size-icon-sm text-muted-foreground"
                    />
                  </HintTrigger>
                </span>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-right">{salvageLabel}</TableHead>
              <TableHead className="text-right">
                {t("gameUi:items.gold")}
              </TableHead>
              <TableHead className="text-right">{salvageLabel}</TableHead>
              <TableHead className="text-right">
                {t("gameUi:items.gold")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ladder.map((row) => (
              <TableRow key={row.level}>
                <TableCell className="tabular-nums">{row.level}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {format(salvage(row))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {format(row.gold)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {format(totalSalvage(row))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {format(row.totalGold)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
