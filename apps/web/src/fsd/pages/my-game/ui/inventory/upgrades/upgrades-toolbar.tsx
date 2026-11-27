import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { LayoutGrid, Table2, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { rarityIcon, statIcon, UpgradeIcons } from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"

import {
  EntityIcon,
  FilterField,
  FiltersControl,
  GroupByControl,
  MultiSelect,
  PageToolbar,
  SearchField,
  SegmentedControl,
  useViewPlacement,
} from "@/shared/ui"

import {
  activePanelFilterCount,
  CLEARED_FILTERS,
  CLEARED_PANEL_FILTERS,
  hasActiveFilters,
  INVENTORY_GROUPS,
  INVENTORY_LAYOUTS,
  INVENTORY_SORTS,
  UPGRADE_KINDS,
  UPGRADE_STATS,
} from "../../../model/inventory-upgrades-query"
import type {
  InventoryLayout,
  InventoryUpgradesQuery,
  UpgradeKind,
  UpgradeStat,
} from "../../../model/inventory-upgrades-query"

/** The search writes the URL, so it waits for a pause in typing. */
const SEARCH_DELAY_MS = 200
const ALL_KINDS = "all"

const LAYOUT_ICONS: Record<InventoryLayout, LucideIcon> = {
  grid: LayoutGrid,
  table: Table2,
}

const STAT_ICONS: Record<UpgradeStat, string | undefined> = {
  Health: statIcon("health"),
  Damage: statIcon("damage"),
  Armour: statIcon("armour"),
}

const optionIcon = (src: string | undefined) => (
  <EntityIcon alt="" className="shrink-0" size="icon" src={src} />
)

type ToolbarProps = {
  query: InventoryUpgradesQuery
  update: (patch: Partial<InventoryUpgradesQuery>) => void
}

/**
 * The Upgrades tab's toolbar (ui-style-guide rule 2). Find: search, then Filters ("Needed for goals"
 * and "Owned only" switches, off by default on phones too, then Rarity, Stat and Kind; a popover, a
 * sheet on phones) and, while anything narrows the list, Clear filters. View: Layout (Grid / Table),
 * Group by (None / Rarity / Stat) and Sort.
 */
export function UpgradesToolbar({ query, update }: ToolbarProps) {
  const { t } = useTranslation(["inventory", "common"])
  const setSearch = useCallback(
    (search: string) => update({ search }),
    [update]
  )
  // Clear filters remounts the search field, so a draft still waiting on its debounce is dropped
  // instead of writing the search back after the clear.
  const [searchKey, setSearchKey] = useState(0)

  return (
    <PageToolbar
      find={
        <div
          aria-label={t("upgrades.toolbar.label")}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          role="search"
        >
          <SearchField
            debounceMs={SEARCH_DELAY_MS}
            key={searchKey}
            label={t("upgrades.toolbar.search")}
            onChange={setSearch}
            testId="inventory-upgrades-search"
            value={query.search}
          />
          <FiltersControl
            count={activePanelFilterCount(query)}
            onClear={() => update(CLEARED_PANEL_FILTERS)}
            size="compact"
            testId="inventory-upgrades-filters"
          >
            <UpgradeFilterFields query={query} update={update} />
          </FiltersControl>
          {hasActiveFilters(query) ? (
            <Button
              onClick={() => {
                setSearchKey((key) => key + 1)
                update(CLEARED_FILTERS)
              }}
              variant="ghost"
            >
              <X aria-hidden />
              {t("upgrades.toolbar.clearFilters")}
            </Button>
          ) : null}
        </div>
      }
      testId="inventory-upgrades-toolbar"
      view={
        <>
          <SegmentedControl
            label={t("common:pageToolbar.layout")}
            onValueChange={(layout) => update({ layout })}
            options={INVENTORY_LAYOUTS.map((layout) => {
              const Icon = LAYOUT_ICONS[layout]
              return {
                value: layout,
                label: t(`upgrades.toolbar.layouts.${layout}`),
                icon: <Icon aria-hidden />,
              }
            })}
            testId="inventory-upgrades-layout"
            value={query.layout}
          />
          <GroupByControl
            onValueChange={(group) => update({ group })}
            options={INVENTORY_GROUPS.map((group) => ({
              value: group,
              label: t(`upgrades.toolbar.groups.${group}`),
            }))}
            testId="inventory-upgrades-group-by"
            value={query.group}
          />
          <SortSelect query={query} update={update} />
        </>
      }
      viewTestId="inventory-upgrades-view"
    />
  )
}

const SWITCHES = ["needed", "owned"] as const

/** "Needed for goals" and "Owned only" as switches on top, then Rarity and Stat (several at once)
 *  and Kind (basic or crafted). */
function UpgradeFilterFields({ query, update }: ToolbarProps) {
  const { t } = useTranslation(["inventory", "progression"])
  return (
    <div className="grid gap-3" data-testid="inventory-upgrades-filter-fields">
      {SWITCHES.map((key) => (
        <FilterField inline key={key} label={t(`upgrades.toolbar.${key}`)}>
          {({ id }) => (
            <Switch
              checked={query[key]}
              id={id}
              onCheckedChange={(checked) => update({ [key]: checked })}
            />
          )}
        </FilterField>
      ))}
      <FilterField icon="rarity" label={t("upgrades.toolbar.rarity")}>
        <MultiSelect
          clearLabel={t("upgrades.toolbar.clearRarities")}
          data-testid="inventory-upgrades-rarity-filter"
          label={t("upgrades.toolbar.rarity")}
          onChange={(rarities) => update({ rarities })}
          options={rarityOrder.map((rarity) => ({
            value: rarity,
            label: t(`progression:rarities.${rarity}`, {
              defaultValue: rarity,
            }),
            icon: optionIcon(rarityIcon(rarity)),
          }))}
          placeholder={t("upgrades.toolbar.allRarities")}
          value={query.rarities}
        />
      </FilterField>
      <FilterField icon="upgradeStat" label={t("upgrades.toolbar.stat")}>
        <MultiSelect
          clearLabel={t("upgrades.toolbar.clearStats")}
          data-testid="inventory-upgrades-stat-filter"
          label={t("upgrades.toolbar.stat")}
          onChange={(stats) => update({ stats })}
          options={UPGRADE_STATS.map((stat) => ({
            value: stat,
            label: t(`upgrades.stats.${stat}`),
            icon: optionIcon(STAT_ICONS[stat]),
          }))}
          placeholder={t("upgrades.toolbar.allStats")}
          value={query.stats}
        />
      </FilterField>
      <FilterField icon="upgradeKind" label={t("upgrades.toolbar.kind")}>
        {({ id }) => (
          <Select
            onValueChange={(kind) =>
              update({
                kind: UPGRADE_KINDS.includes(kind as UpgradeKind)
                  ? (kind as UpgradeKind)
                  : null,
              })
            }
            value={query.kind ?? ALL_KINDS}
          >
            <SelectTrigger
              className="w-full"
              data-testid="inventory-upgrades-kind-filter"
              id={id}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectItem value={ALL_KINDS}>
                {t("upgrades.toolbar.allKinds")}
              </SelectItem>
              {UPGRADE_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  <span className="flex items-center gap-2">
                    {kind === "crafted"
                      ? optionIcon(UpgradeIcons.craftedBadge)
                      : null}
                    {t(`upgrades.toolbar.kinds.${kind}`)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FilterField>
    </div>
  )
}

function SortSelect({ query, update }: ToolbarProps) {
  const { t } = useTranslation("inventory")
  const inSheet = useViewPlacement() === "sheet"
  return (
    <Select
      onValueChange={(sort) => {
        const next = INVENTORY_SORTS.find((value) => value === sort)
        if (next) update({ sort: next })
      }}
      value={query.sort}
    >
      {/* A combobox is not named by its content, so the label carries the current sort too. */}
      <SelectTrigger
        aria-label={`${t("upgrades.toolbar.sort")}: ${t(`upgrades.toolbar.sorts.${query.sort}`)}`}
        className={inSheet ? "w-full" : "w-40"}
      >
        <span className="text-muted-foreground">
          {t("upgrades.toolbar.sort")}:
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" position="popper">
        {INVENTORY_SORTS.map((sort) => (
          <SelectItem key={sort} value={sort}>
            {t(`upgrades.toolbar.sorts.${sort}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
