import { useCallback, useId } from "react"
import { useTranslation } from "react-i18next"
import { LayoutGrid, Table2, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  equipmentSlotIcon,
  factionIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"

import { ITEM_SLOT_TYPES } from "@/shared/equipment"
import {
  EntityIcon,
  FILTER_CHIP_CLASS_NAME,
  FilterField,
  FiltersControl,
  GroupByControl,
  HintedToggleGroupItem,
  MultiSelect,
  PageToolbar,
  SearchField,
  SegmentedControl,
} from "@/shared/ui"

import {
  CLEARED_PIECES_FILTERS,
  CLEARED_PIECES_PANEL,
  PIECES_LAYOUTS,
  activePiecesFilterCount,
  piecesQueryNarrows,
} from "../../../model/items/pieces-query"
import { portraitSrc } from "../portrait-src"
import type {
  PiecesGroup,
  PiecesLayout,
  PiecesQuery,
} from "../../../model/items/pieces-query"

/** The search writes the URL, so it waits for a pause in typing. */
const SEARCH_DELAY_MS = 200

const LAYOUT_ICONS: Record<PiecesLayout, LucideIcon> = {
  cards: LayoutGrid,
  table: Table2,
}

/** None first, as on every page's Group by. */
const GROUP_ORDER: readonly PiecesGroup[] = ["none", "slot", "rarity"]

/** One filter option: a name and the game art for it. */
export type PiecesFilterOption = { id: string; name: string }

export type PiecesFilterOptions = {
  factions: readonly PiecesFilterOption[]
  characters: readonly PiecesFilterOption[]
}

type ToolbarProps = {
  query: PiecesQuery
  update: (patch: Partial<PiecesQuery>) => void
  options: PiecesFilterOptions
}

const optionIcon = (src: string | undefined) => (
  <EntityIcon alt="" className="shrink-0" size="icon" src={src} />
)

/**
 * The Pieces tab's toolbar (ui-style-guide rule 2). Find: search, Filters (Rarity, Slot, Faction and
 * Character in a popover; a sheet on phones) and, while anything narrows the list, Clear filters.
 * The chip row holds "Spares only" and "Relics only". View: Layout (Cards / Table) and Group by
 * (None / Slot / Rarity).
 */
export function PiecesToolbar({ query, update, options }: ToolbarProps) {
  const { t } = useTranslation(["myItems", "common"])
  const setSearch = useCallback((q: string) => update({ q }), [update])

  return (
    <PageToolbar
      chips={<PiecesChips query={query} update={update} />}
      find={
        <div
          aria-label={t("pieces.toolbar.label")}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          data-testid="items-pieces-find"
          role="search"
        >
          <SearchField
            debounceMs={SEARCH_DELAY_MS}
            label={t("pieces.toolbar.search")}
            onChange={setSearch}
            testId="items-pieces-search"
            value={query.q}
          />
          <FiltersControl
            count={activePiecesFilterCount(query)}
            onClear={() => update(CLEARED_PIECES_PANEL)}
            size="compact"
            testId="items-pieces-filters"
          >
            <PiecesFilterFields
              options={options}
              query={query}
              update={update}
            />
          </FiltersControl>
          {piecesQueryNarrows(query) ? (
            <Button
              onClick={() => update(CLEARED_PIECES_FILTERS)}
              variant="ghost"
            >
              <X aria-hidden />
              {t("pieces.toolbar.clearFilters")}
            </Button>
          ) : null}
        </div>
      }
      testId="items-pieces-toolbar"
      view={
        <>
          <SegmentedControl
            label={t("common:pageToolbar.layout")}
            onValueChange={(layout) => update({ layout })}
            options={PIECES_LAYOUTS.map((layout) => {
              const Icon = LAYOUT_ICONS[layout]
              return {
                value: layout,
                label: t(`pieces.toolbar.layouts.${layout}`),
                icon: <Icon aria-hidden />,
              }
            })}
            testId="items-pieces-layout"
            value={query.layout}
          />
          <GroupByControl
            onValueChange={(group) => update({ group })}
            options={GROUP_ORDER.map((group) => ({
              value: group,
              label: t(`pieces.toolbar.groups.${group}`),
            }))}
            testId="items-pieces-group-by"
            value={query.group}
          />
        </>
      }
      viewTestId="items-pieces-view"
    />
  )
}

/** Rarity, Slot, Faction and Character, several of each at once. */
function PiecesFilterFields({ query, update, options }: ToolbarProps) {
  const { t } = useTranslation(["myItems", "progression", "gameUi"])
  return (
    <div className="grid gap-3" data-testid="items-pieces-filter-fields">
      <FilterField icon="rarity" label={t("pieces.toolbar.rarity")}>
        <MultiSelect
          clearLabel={t("pieces.toolbar.clearRarities")}
          data-testid="items-pieces-rarity-filter"
          label={t("pieces.toolbar.rarity")}
          onChange={(rarity) => update({ rarity })}
          options={rarityOrder.map((rarity) => ({
            value: rarity,
            label: t(`progression:rarities.${rarity}`, {
              defaultValue: rarity,
            }),
            icon: optionIcon(rarityIcon(rarity)),
          }))}
          placeholder={t("pieces.toolbar.allRarities")}
          value={query.rarity}
        />
      </FilterField>
      <FilterField icon="itemSlot" label={t("pieces.toolbar.slot")}>
        <MultiSelect
          clearLabel={t("pieces.toolbar.clearSlots")}
          data-testid="items-pieces-slot-filter"
          label={t("pieces.toolbar.slot")}
          onChange={(slot) => update({ slot })}
          options={ITEM_SLOT_TYPES.map((slot) => ({
            value: slot,
            label: t(`gameUi:items.slots.${slot}`),
            icon: optionIcon(equipmentSlotIcon(slot)),
          }))}
          placeholder={t("pieces.toolbar.allSlots")}
          value={query.slot}
        />
      </FilterField>
      <FilterField icon="faction" label={t("pieces.toolbar.faction")}>
        <MultiSelect
          clearLabel={t("pieces.toolbar.clearFactions")}
          data-testid="items-pieces-faction-filter"
          label={t("pieces.toolbar.faction")}
          onChange={(faction) => update({ faction })}
          options={options.factions.map((faction) => ({
            value: faction.id,
            label: faction.name,
            icon: optionIcon(factionIcon(faction.id)),
          }))}
          placeholder={t("pieces.toolbar.allFactions")}
          value={query.faction}
        />
      </FilterField>
      <FilterField icon="unitType" label={t("pieces.toolbar.character")}>
        <MultiSelect
          clearLabel={t("pieces.toolbar.clearCharacters")}
          data-testid="items-pieces-character-filter"
          label={t("pieces.toolbar.character")}
          onChange={(character) => update({ character })}
          options={options.characters.map((character) => ({
            value: character.id,
            label: character.name,
            icon: optionIcon(portraitSrc(character.id)),
          }))}
          placeholder={t("pieces.toolbar.allCharacters")}
          searchPlaceholder={t("pieces.toolbar.searchCharacters")}
          value={query.character}
        />
      </FilterField>
    </div>
  )
}

const CHIPS = ["spares", "relic"] as const

/** "Spares only" and "Relics only", each on or off. */
function PiecesChips({ query, update }: Omit<ToolbarProps, "options">) {
  const { t } = useTranslation("myItems")
  const labelId = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground" id={labelId}>
        {t("pieces.toolbar.chipsLabel")}
      </span>
      <ToggleGroup
        aria-labelledby={labelId}
        className="shrink-0"
        onValueChange={(values) =>
          update({
            spares: values.includes("spares"),
            relic: values.includes("relic"),
          })
        }
        size="sm"
        spacing={1}
        type="multiple"
        value={CHIPS.filter((chip) => query[chip])}
        variant="outline"
      >
        {CHIPS.map((chip) => (
          <HintedToggleGroupItem
            className={FILTER_CHIP_CLASS_NAME}
            data-testid={`items-pieces-${chip}-chip`}
            key={chip}
            value={chip}
          >
            {t(
              chip === "spares"
                ? "pieces.toolbar.spares"
                : "pieces.toolbar.relics"
            )}
          </HintedToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
