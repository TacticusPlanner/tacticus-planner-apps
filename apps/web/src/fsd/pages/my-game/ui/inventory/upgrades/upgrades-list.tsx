import { useTranslation } from "react-i18next"
import { statIcon } from "@workspace/game-catalog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"
import { Button } from "@workspace/ui/components/button"

import { numberFormat } from "@/shared/lib"
import {
  CountBadge,
  EntityIcon,
  ListDivider,
  RarityIcon,
  TruncatedText,
  UpgradeIcon,
} from "@/shared/ui"

import type {
  InventoryUpgradeRow,
  UpgradeRowGroup,
} from "../../../model/inventory-upgrades"
import type { InventoryLayout } from "../../../model/inventory-upgrades-query"

const STAT_ICON_KEYS: Record<string, "health" | "damage" | "armour"> = {
  Health: "health",
  Damage: "damage",
  Armour: "armour",
}

type ListProps = {
  groups: readonly UpgradeRowGroup[]
  layout: InventoryLayout
  /** False while the goals' plan run is not done: the need columns wait. */
  needsReady: boolean
  onOpen: (row: InventoryUpgradeRow, button: HTMLElement) => void
}

/** The materials as a grid of tiles or a table, one block per group with its labelled divider. */
export function UpgradesList({
  groups,
  layout,
  needsReady,
  onOpen,
}: ListProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="inventory-upgrades-list">
      {groups.map((group) => (
        <section className="flex flex-col gap-2" key={group.key}>
          {group.kind === "all" ? null : <GroupDivider group={group} />}
          {layout === "grid" ? (
            <UpgradesGrid
              needsReady={needsReady}
              onOpen={onOpen}
              rows={group.rows}
            />
          ) : (
            <UpgradesTable
              needsReady={needsReady}
              onOpen={onOpen}
              rows={group.rows}
            />
          )}
        </section>
      ))}
    </div>
  )
}

function GroupDivider({ group }: { group: UpgradeRowGroup }) {
  const { t } = useTranslation(["inventory", "progression"])
  const label =
    group.kind === "rarity"
      ? t(`progression:rarities.${group.key}`, { defaultValue: group.key })
      : t(`upgrades.stats.${group.key}`, { defaultValue: group.key })
  const statKey = STAT_ICON_KEYS[group.key]
  return (
    <ListDivider
      aria-label={label}
      data-testid={`inventory-upgrades-group-${group.key}`}
      heading="h3"
      icon={
        group.kind === "rarity" ? (
          <RarityIcon rarity={group.key} />
        ) : statKey ? (
          <EntityIcon alt="" size="icon" src={statIcon(statKey)} />
        ) : null
      }
      label={
        <span className="flex items-center gap-2">
          {label}
          <CountBadge count={group.rows.length} />
        </span>
      }
    />
  )
}

function useCounts() {
  const { t, i18n } = useTranslation("inventory")
  const format = (value: number) => numberFormat(i18n.language).format(value)
  return {
    format,
    /** "12 / 30" while the goals need it, else just what is held. */
    haveNeed: (row: InventoryUpgradeRow, needsReady: boolean) =>
      needsReady && row.need > 0
        ? t("count.haveNeed", {
            have: format(row.have),
            need: format(row.need),
          })
        : format(row.have),
    label: (row: InventoryUpgradeRow, needsReady: boolean) =>
      needsReady && row.need > 0
        ? t("upgrades.tileLabelNeed", {
            name: row.name,
            have: format(row.have),
            need: format(row.need),
          })
        : t("upgrades.tileLabel", { name: row.name, have: format(row.have) }),
    short: (amount: number) => t("count.short", { amount: format(amount) }),
  }
}

/** Tiles: the material's icon on its rarity frame, its name, have / need and what is short. */
function UpgradesGrid({
  rows,
  needsReady,
  onOpen,
}: Omit<ListProps, "groups" | "layout"> & {
  rows: readonly InventoryUpgradeRow[]
}) {
  const counts = useCounts()
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
      {rows.map((row) => (
        <li key={row.id}>
          <Pressable
            aria-haspopup="dialog"
            aria-label={counts.label(row, needsReady)}
            className={cn(
              "flex size-full flex-col items-center gap-1 rounded-lg border bg-card p-2 text-center",
              row.have === 0 && "text-muted-foreground"
            )}
            onClick={(event) => onOpen(row, event.currentTarget)}
          >
            <UpgradeIcon
              className={row.have === 0 ? "opacity-60" : undefined}
              crafted={row.crafted}
              id={row.id}
              rarity={row.rarity}
              size="icon-2xl"
            />
            <TruncatedText className="text-xs" lines={2}>
              {row.name}
            </TruncatedText>
            <span className="text-sm font-semibold tabular-nums">
              {counts.haveNeed(row, needsReady)}
            </span>
            {needsReady && row.short > 0 ? (
              <span className="text-xs font-medium text-destructive tabular-nums">
                {counts.short(row.short)}
              </span>
            ) : null}
          </Pressable>
        </li>
      ))}
    </ul>
  )
}

/** One row per material: icon and name (opens the details), rarity, stat and the counts. */
function UpgradesTable({
  rows,
  needsReady,
  onOpen,
}: Omit<ListProps, "groups" | "layout"> & {
  rows: readonly InventoryUpgradeRow[]
}) {
  const { t } = useTranslation("inventory")
  const counts = useCounts()
  const pending = "…"
  return (
    <div className="max-w-full min-w-0 overflow-x-auto rounded-xl border">
      <Table
        aria-label={t("upgrades.table.label")}
        className="min-w-2xl table-fixed"
      >
        <TableHeader>
          <TableRow>
            <TableHead>{t("upgrades.table.material")}</TableHead>
            <TableHead className="w-20">{t("upgrades.table.rarity")}</TableHead>
            <TableHead className="w-32">{t("upgrades.table.stat")}</TableHead>
            <TableHead className="w-24 text-right">
              {t("upgrades.table.have")}
            </TableHead>
            <TableHead className="w-24 text-right">
              {t("upgrades.table.need")}
            </TableHead>
            <TableHead className="w-24 text-right">
              {t("upgrades.table.short")}
            </TableHead>
            <TableHead className="w-24 text-right">
              {t("upgrades.table.canCraft")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const statKey = STAT_ICON_KEYS[row.stat]
            return (
              <TableRow
                data-testid={`inventory-upgrade-row-${row.id}`}
                key={row.id}
              >
                <TableCell>
                  <Button
                    variant="link"
                    aria-haspopup="dialog"
                    className="flex h-auto items-center gap-2 rounded-sm p-0 text-left text-[length:inherit] font-normal whitespace-normal text-current underline-offset-2 hover:underline"
                    onClick={(event) => onOpen(row, event.currentTarget)}
                  >
                    <UpgradeIcon
                      crafted={row.crafted}
                      id={row.id}
                      rarity={row.rarity}
                    />
                    <span className="font-medium">{row.name}</span>
                  </Button>
                </TableCell>
                <TableCell>
                  <RarityIcon rarity={row.rarity} size="icon-md" />
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    {statKey ? (
                      <EntityIcon alt="" size="icon" src={statIcon(statKey)} />
                    ) : null}
                    {t(`upgrades.stats.${row.stat}`, {
                      defaultValue: row.stat,
                    })}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {counts.format(row.have)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {needsReady ? counts.format(row.need) : pending}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    needsReady &&
                      row.short > 0 &&
                      "font-medium text-destructive"
                  )}
                >
                  {needsReady ? counts.format(row.short) : pending}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.canCraft === null ? "–" : counts.format(row.canCraft)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
