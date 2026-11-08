import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ExternalLink } from "lucide-react"
import {
  characterIcon,
  mowIcon,
  powerIcon,
  shardIcon,
} from "@workspace/game-catalog"
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
import { useMarkLabels } from "../../../model/use-mark-labels"
import {
  AbilityMark,
  FromToMarks,
  ProgressionMark,
  RankMark,
} from "./compare-marks"

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
          <ChipList
            chips={chips}
            unitKind={item.unit.kind}
            className="justify-center px-0.5"
          />
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
                <ChipList
                  chips={compareChips(item.diff, fields)}
                  unitKind={item.unit.kind}
                />
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
  unitKind,
  className,
}: {
  chips: readonly CompareChip[]
  unitKind: CompareItem["unit"]["kind"]
  className?: string
}) {
  const render = useChipContent(unitKind)
  if (chips.length === 0) return null
  return (
    <span
      className={cn("mt-1 flex flex-wrap gap-1", className)}
      data-testid="compare-chips"
    >
      {chips.map((chip) => (
        <Badge
          key={chip.kind === "ability" ? `ability-${chip.slot}` : chip.kind}
          variant="secondary"
          className="gap-1 px-1.5 text-xs tabular-nums"
          data-chip={chip.kind}
        >
          {render(chip)}
        </Badge>
      ))}
    </span>
  )
}

const chipIconClassName = "size-3.5 shrink-0"

/** An icon and a signed count, with the full text for screen readers. */
function IconCount({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: string
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-0.5" title={label}>
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {icon}
        {value}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** The ability's label by slot: active/passive for a character, primary/secondary for a MoW. */
function abilityLabelKey(unitKind: CompareItem["unit"]["kind"], slot: number) {
  if (unitKind === "character") {
    return slot === 0
      ? "myGame.collection.compare.details.activeAbility"
      : "myGame.collection.compare.details.passiveAbility"
  }
  return slot === 0
    ? "myGame.collection.compare.details.primaryAbility"
    : "myGame.collection.compare.details.secondaryAbility"
}

function useChipContent(unitKind: CompareItem["unit"]["kind"]) {
  const { t, i18n } = useTranslation(["common", "progression"])
  const labels = useMarkLabels()
  const signed = (count: number) => formatSigned(count, i18n.language)
  const text = (
    kind: Extract<CompareChip, { count: number }>["kind"],
    count: number
  ) => t(`myGame.collection.compare.chips.${kind}`, { value: signed(count) })
  return (chip: CompareChip): ReactNode => {
    switch (chip.kind) {
      case "unlocked": {
        return t("myGame.collection.compare.chips.unlocked")
      }
      case "progression": {
        return (
          <FromToMarks
            from={<ProgressionMark value={chip.from} />}
            to={<ProgressionMark value={chip.to} />}
            label={labels.progression(chip.from, chip.to)}
          />
        )
      }
      case "rank": {
        return (
          <FromToMarks
            from={<RankMark rank={chip.from} />}
            to={<RankMark rank={chip.to} />}
            label={labels.rank(chip.from, chip.to)}
          />
        )
      }
      case "ability": {
        const name = t(abilityLabelKey(unitKind, chip.slot))
        return (
          <FromToMarks
            from={
              <>
                <AbilityMark abilityId={chip.abilityId} />
                {chip.from}
              </>
            }
            to={chip.to}
            label={`${name}: ${labels.fromTo(String(chip.from), String(chip.to))}`}
          />
        )
      }
      case "shards":
      case "mythicShards": {
        return (
          <IconCount
            icon={
              <EntityIcon
                alt=""
                src={shardIcon(chip.kind === "shards" ? "Regular" : "Mythic")}
                className={chipIconClassName}
              />
            }
            value={signed(chip.count)}
            label={text(chip.kind, chip.count)}
          />
        )
      }
      case "power": {
        return (
          <IconCount
            icon={
              <EntityIcon
                alt=""
                src={powerIcon()}
                className={chipIconClassName}
              />
            }
            value={signed(chip.count)}
            label={text(chip.kind, chip.count)}
          />
        )
      }
      default: {
        return text(chip.kind, chip.count)
      }
    }
  }
}

interface DetailView {
  key: string
  /** A decorative icon before the label (the ability's own, shards, power). */
  icon?: ReactNode
  label: string
  value: ReactNode
}

/** Every changed field before → after, with shards net, spent and earned, and a Library link.
 *  Rank and progression show as icons (their text is the accessible name); abilities, shards and
 *  power lead with their icon. */
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
  const labels = useMarkLabels()
  const fromTo = labels.fromTo
  const rows = detailRows(diff, fields).map((row): DetailView => {
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
          value: (
            <FromToMarks
              from={<RankMark rank={row.from} large />}
              to={<RankMark rank={row.to} large />}
              label={labels.rank(row.from, row.to)}
            />
          ),
        }
      }
      case "progression": {
        return {
          key: row.kind,
          label: t("myGame.collection.compare.details.stars"),
          value: (
            <FromToMarks
              from={<ProgressionMark value={row.from} large />}
              to={<ProgressionMark value={row.to} large />}
              label={labels.progression(row.from, row.to)}
            />
          ),
        }
      }
      case "ability": {
        return {
          key: `${row.kind}-${row.slot}`,
          icon: <AbilityMark abilityId={row.abilityId} large />,
          label: t(abilityLabelKey(unit.kind, row.slot)),
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
          icon: (
            <EntityIcon
              alt=""
              src={shardIcon(row.kind === "shards" ? "Regular" : "Mythic")}
              className="size-5 shrink-0"
            />
          ),
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
          icon:
            row.kind === "power" ? (
              <EntityIcon
                alt=""
                src={powerIcon()}
                className="size-5 shrink-0"
              />
            ) : undefined,
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
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                {row.icon}
                {row.label}
              </dt>
              <dd className="flex items-center justify-end text-right tabular-nums">
                {row.value}
              </dd>
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
