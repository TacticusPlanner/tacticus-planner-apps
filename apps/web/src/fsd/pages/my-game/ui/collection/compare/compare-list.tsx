import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ExternalLink } from "lucide-react"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { unitLibraryPath, UnitTile } from "@/entities/unit"
import { EntityIcon } from "@/shared/ui"

import {
  compareChips,
  detailRows,
  type CompareChip,
} from "../../../model/compare-chips"
import { formatSigned } from "../../../model/compare-labels"
import type { CompareField, CompareItem } from "../../../model/compare-view"

const tileGrid =
  "grid gap-x-1.5 gap-y-3 [grid-template-columns:repeat(auto-fill,minmax(6.5rem,1fr))]"

/**
 * Compare mode's flat list: changed units first in the chosen order, then (with "Show unchanged")
 * the unchanged ones dimmed. Desktop shows tiles whose details open in a popover; mobile shows one
 * row per unit whose details open in a bottom sheet.
 */
export function CompareList({
  changed,
  unchanged,
  showUnchanged,
  fields,
}: {
  changed: readonly CompareItem[]
  unchanged: readonly CompareItem[]
  showUnchanged: boolean
  fields: ReadonlySet<CompareField>
}) {
  const isMobile = useIsMobile()
  const items = [
    ...changed.map((item) => ({ item, dimmed: false })),
    ...(showUnchanged ? unchanged.map((item) => ({ item, dimmed: true })) : []),
  ]
  if (isMobile) {
    return <MobileList items={items} fields={fields} />
  }
  return (
    <ul className={tileGrid} data-testid="compare-list">
      {items.map(({ item, dimmed }) => (
        <li
          key={item.unit.unitId}
          className={cn("min-w-0", dimmed && "opacity-50")}
        >
          <DiffTile item={item} fields={fields} />
        </li>
      ))}
    </ul>
  )
}

function DiffTile({
  item,
  fields,
}: {
  item: CompareItem
  fields: ReadonlySet<CompareField>
}) {
  const chips = compareChips(item.diff, fields)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full min-w-0 flex-col items-center rounded-lg transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-primary"
          data-testid="compare-tile"
          data-unit={item.unit.unitId}
          data-changed={item.diff.changed}
        >
          <UnitTile unit={item.unit} className="w-full" />
          <ChipList chips={chips} className="justify-center px-0.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" data-testid="compare-details">
        <UnitDiffDetails item={item} fields={fields} />
      </PopoverContent>
    </Popover>
  )
}

function MobileList({
  items,
  fields,
}: {
  items: { item: CompareItem; dimmed: boolean }[]
  fields: ReadonlySet<CompareField>
}) {
  // The id, not the item, so the sheet follows a refreshed diff and closes when the unit leaves.
  const [openId, setOpenId] = useState<string | null>(null)
  const open =
    items.find(({ item }) => item.unit.unitId === openId)?.item ?? null
  return (
    <>
      <ul className="flex flex-col divide-y" data-testid="compare-list">
        {items.map(({ item, dimmed }) => (
          <li key={item.unit.unitId} className={cn(dimmed && "opacity-50")}>
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-3 py-2 text-left"
              onClick={() => setOpenId(item.unit.unitId)}
              data-testid="compare-row"
              data-unit={item.unit.unitId}
              data-changed={item.diff.changed}
            >
              <EntityIcon
                alt=""
                className="size-10 shrink-0 rounded-full bg-portrait"
                src={portraitOf(item)}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-semibold">
                  {item.unit.name}
                </span>
                <ChipList chips={compareChips(item.diff, fields)} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Sheet
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpenId(null)
        }}
      >
        <SheetContent side="bottom" data-testid="compare-details">
          <SheetHeader>
            <SheetTitle>{open?.unit.name}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            {open ? (
              <UnitDiffDetails item={open} fields={fields} hideTitle />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function portraitOf(item: CompareItem) {
  return item.unit.kind === "character"
    ? characterIcon(item.unit.unitId)
    : mowIcon(item.unit.unitId)
}

function ChipList({
  chips,
  className,
}: {
  chips: readonly CompareChip[]
  className?: string
}) {
  const label = useChipLabel()
  if (chips.length === 0) return null
  return (
    <span
      className={cn("mt-1 flex flex-wrap gap-1", className)}
      data-testid="compare-chips"
    >
      {chips.map((chip) => (
        <Badge
          key={chip.kind}
          variant="secondary"
          className="px-1.5 text-[11px] tabular-nums"
          data-chip={chip.kind}
        >
          {label(chip)}
        </Badge>
      ))}
    </span>
  )
}

function useChipLabel() {
  const { t, i18n } = useTranslation(["common", "progression"])
  const signed = (count: number) => formatSigned(count, i18n.language)
  return (chip: CompareChip): string => {
    switch (chip.kind) {
      case "unlocked": {
        return t("myGame.collection.compare.chips.unlocked")
      }
      case "rarity": {
        return t(`progression:rarities.${chip.to}`)
      }
      case "stars": {
        return t("myGame.collection.compare.chips.stars", {
          value: signed(chip.count),
        })
      }
      case "rank": {
        return t("myGame.collection.compare.fromTo", {
          from: t(`progression:ranks.${chip.from}`),
          to: t(`progression:ranks.${chip.to}`),
        })
      }
      default: {
        return t(`myGame.collection.compare.chips.${chip.kind}`, {
          value: signed(chip.count),
        })
      }
    }
  }
}

/** Every changed field before → after, with shards net, spent and earned, and a Library link. */
function UnitDiffDetails({
  item,
  fields,
  hideTitle = false,
}: {
  item: CompareItem
  fields: ReadonlySet<CompareField>
  hideTitle?: boolean
}) {
  const { t, i18n } = useTranslation([
    "common",
    "progression",
    "equipmentItems",
  ])
  const { diff, unit } = item
  const number = (value: number) =>
    new Intl.NumberFormat(i18n.language).format(value)
  const fromTo = (from: string, to: string) =>
    t("myGame.collection.compare.fromTo", { from, to })
  const rows = detailRows(diff, fields).map((row) => {
    switch (row.kind) {
      case "unlocked": {
        return {
          key: row.kind,
          label: t("myGame.collection.compare.details.unlocked"),
          value: "",
        }
      }
      case "rank": {
        return {
          key: row.kind,
          label: t("myGame.collection.compare.details.rank"),
          value: fromTo(
            t(`progression:ranks.${row.from}`),
            t(`progression:ranks.${row.to}`)
          ),
        }
      }
      case "stars": {
        return {
          key: row.kind,
          label: t("myGame.collection.compare.details.stars"),
          value: fromTo(
            t(`progression:stars.${row.from}`),
            t(`progression:stars.${row.to}`)
          ),
        }
      }
      case "ability": {
        return {
          key: `${row.kind}-${row.slot}`,
          label: t(
            unit.kind === "character"
              ? row.slot === 0
                ? "myGame.collection.compare.details.activeAbility"
                : "myGame.collection.compare.details.passiveAbility"
              : row.slot === 0
                ? "myGame.collection.compare.details.primaryAbility"
                : "myGame.collection.compare.details.secondaryAbility"
          ),
          value: fromTo(String(row.from), String(row.to)),
        }
      }
      case "equipment": {
        const name = (id: string) =>
          t(`equipmentItems:${id}`, { defaultValue: id })
        return {
          key: `${row.kind}-${row.slotId}`,
          label: t("myGame.collection.compare.details.equipment"),
          value: row.from
            ? fromTo(
                `${name(row.from.equipmentId)} ${row.from.level}`,
                `${name(row.to.equipmentId)} ${row.to.level}`
              )
            : `${name(row.to.equipmentId)} ${row.to.level}`,
        }
      }
      case "shards":
      case "mythicShards": {
        return {
          key: row.kind,
          label: t(`myGame.collection.compare.details.${row.kind}`),
          value: t("myGame.collection.compare.details.shardsBreakdown", {
            net: formatSigned(row.change.net, i18n.language),
            spent: number(row.change.spent),
            earned: formatSigned(row.change.earned, i18n.language),
          }),
        }
      }
      case "xpGained": {
        return {
          key: row.kind,
          label: t("myGame.collection.compare.details.xpGained"),
          value: formatSigned(row.value, i18n.language),
        }
      }
      default: {
        return {
          key: row.kind,
          label: t(`myGame.collection.compare.details.${row.kind}`),
          value: fromTo(number(row.from), number(row.to)),
        }
      }
    }
  })
  return (
    <div className="flex flex-col gap-2 text-sm">
      {hideTitle ? null : <p className="font-semibold">{unit.name}</p>}
      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {t("myGame.collection.compare.details.none")}
        </p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {rows.map((row) => (
            <div key={row.key} className="contents" data-detail={row.key}>
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Link
        to={unitLibraryPath(unit.kind, unit.unitId)}
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
        data-testid="compare-library-link"
      >
        <ExternalLink aria-hidden className="size-3.5" />
        {t("myGame.collection.compare.details.openLibrary")}
      </Link>
    </div>
  )
}
