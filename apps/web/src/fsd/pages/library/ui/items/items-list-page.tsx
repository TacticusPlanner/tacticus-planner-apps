import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { X } from "lucide-react"
import {
  equipmentSlotIcon,
  factionIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { rarityOrder } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"

import {
  ITEM_SLOT_TYPES,
  ItemIcon,
  maxItemLevel,
  useItemSlotName,
} from "@/shared/equipment"
import { useUrlQuery } from "@/shared/lib"
import { useTourPageSteps } from "@/shared/tour"
import {
  CountBadge,
  EmptyState,
  EntityIcon,
  FILTER_CHIP_CLASS_NAME,
  FilterField,
  FiltersControl,
  GroupByControl,
  HintedToggleGroupItem,
  ListDivider,
  LocalReadFailure,
  MultiSelect,
  PageToolbar,
  RarityIcon,
  SearchField,
  TruncatedText,
} from "@/shared/ui"

import {
  CLEARED_LIBRARY_ITEM_FILTERS,
  LIBRARY_ITEM_GROUPS,
  activeLibraryItemFilterCount,
  allFactionCount,
  filterLibraryItems,
  groupLibraryItems,
  libraryItemsQueryNarrows,
  readLibraryItemsQuery,
  writeLibraryItemsQuery,
} from "../../model/items/library-items"
import type {
  LibraryItemGroup,
  LibraryItemsQuery,
} from "../../model/items/library-items"
import { ItemFor } from "./item-for"
import { useLibraryItemsTutorial } from "./library-items.tutorial"
import { libraryItemPath, useLibraryItems } from "./use-library-items"

/** The search writes the URL, so it waits for a pause in typing. */
const SEARCH_DELAY_MS = 200

const optionIcon = (src: string | undefined) => (
  <EntityIcon alt="" className="shrink-0" size="icon" src={src} />
)

/**
 * `/library/items`: every item in the game as a card (art, name, slot, rarity, top level and who can
 * use it), with search, Filters (Rarity, Slot, Faction), a "Relics only" chip and Group by. A card opens the
 * item's page. Public: catalog data only.
 */
export function ItemsListPage() {
  const data = useLibraryItems()
  useTourPageSteps(useLibraryItemsTutorial())
  if (data.status === "loading") {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />
  }
  if (data.status === "error") return <LocalReadFailure retry={data.retry} />
  return (
    <ItemsList
      charactersById={data.charactersById}
      factionName={data.factionName}
      factionOf={data.factionOf}
      itemName={data.itemName}
      items={data.items}
    />
  )
}

function ItemsList({
  items,
  charactersById,
  itemName,
  factionName,
  factionOf,
}: {
  items: EquipmentStorageModel[]
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  itemName: (item: EquipmentStorageModel) => string
  factionName: (id: string) => string
  factionOf: (characterId: string) => string | undefined
}) {
  const { t, i18n } = useTranslation(["library", "progression", "gameUi"])
  const slotName = useItemSlotName()
  const { query, update } = useUrlQuery(
    readLibraryItemsQuery,
    writeLibraryItemsQuery
  )
  const setSearch = useCallback((q: string) => update({ q }), [update])
  const factionCount = useMemo(() => allFactionCount(items), [items])
  const factions = useMemo(
    () =>
      [...new Set([...charactersById.values()].map((c) => c.faction))]
        .map((id) => ({ id, name: factionName(id) }))
        .toSorted((a, b) => a.name.localeCompare(b.name, i18n.language)),
    [charactersById, factionName, i18n.language]
  )
  const groups = useMemo(
    () =>
      groupLibraryItems(
        filterLibraryItems(items, query, {
          nameOf: itemName,
          factionOf,
          locale: i18n.language,
        }),
        query.group
      ),
    [items, query, itemName, factionOf, i18n.language]
  )

  return (
    <div className="flex flex-col gap-4" data-testid="library-items-page">
      <PageToolbar
        chips={
          <ToggleGroup
            aria-label={t("items.list.relic")}
            className="shrink-0"
            onValueChange={(values) =>
              update({ relic: values.includes("relic") })
            }
            size="sm"
            spacing={1}
            type="multiple"
            value={query.relic ? ["relic"] : []}
            variant="outline"
          >
            <HintedToggleGroupItem
              className={FILTER_CHIP_CLASS_NAME}
              data-testid="library-items-relic-chip"
              value="relic"
            >
              {t("items.list.relic")}
            </HintedToggleGroupItem>
          </ToggleGroup>
        }
        find={
          <div
            aria-label={t("items.list.label")}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            data-testid="library-items-find"
            role="search"
          >
            <SearchField
              debounceMs={SEARCH_DELAY_MS}
              label={t("items.list.search")}
              onChange={setSearch}
              testId="library-items-search"
              value={query.q}
            />
            <FiltersControl
              count={activeLibraryItemFilterCount(query)}
              onClear={() => update({ rarity: [], slot: [], faction: [] })}
              size="compact"
              testId="library-items-filters"
            >
              <LibraryItemFilterFields
                factions={factions}
                query={query}
                slotName={slotName}
                update={update}
              />
            </FiltersControl>
            {libraryItemsQueryNarrows(query) ? (
              <Button
                onClick={() => update(CLEARED_LIBRARY_ITEM_FILTERS)}
                variant="ghost"
              >
                <X aria-hidden />
                {t("items.list.clearFilters")}
              </Button>
            ) : null}
          </div>
        }
        testId="library-items-toolbar"
        view={
          <GroupByControl
            onValueChange={(group: LibraryItemGroup) => update({ group })}
            options={LIBRARY_ITEM_GROUPS.map((group) => ({
              value: group,
              label: t(`items.list.groups.${group}`),
            }))}
            testId="library-items-group-by"
            value={query.group}
          />
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          actions={
            <Button
              onClick={() => update(CLEARED_LIBRARY_ITEM_FILTERS)}
              variant="outline"
            >
              {libraryItemsQueryNarrows({ ...query, q: "" })
                ? t("items.list.clearFilters")
                : t("items.list.noMatch.clearSearch")}
            </Button>
          }
          description={t("items.list.noMatch.description")}
          testId="library-items-no-match"
          title={t("items.list.noMatch.title")}
          variant="no-match"
        />
      ) : (
        <div className="flex flex-col gap-4" data-testid="library-items-list">
          {groups.map((group) => {
            const label =
              query.group === "rarity"
                ? t(`progression:rarities.${group.key}`, {
                    defaultValue: group.key,
                  })
                : slotName(group.key)
            return (
              <section className="flex flex-col gap-2" key={group.key}>
                {query.group === "none" ? null : (
                  <ListDivider
                    aria-label={label}
                    heading="h2"
                    icon={
                      query.group === "rarity" ? (
                        <RarityIcon rarity={group.key as Rarity} />
                      ) : (
                        optionIcon(equipmentSlotIcon(group.key))
                      )
                    }
                    label={
                      <span className="flex items-center gap-2">
                        {label}
                        <CountBadge count={group.items.length} />
                      </span>
                    }
                  />
                )}
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        className="flex size-full items-start gap-3 rounded-lg border bg-card interactive-surface p-3"
                        data-item-id={item.id}
                        data-testid="library-item-card"
                        to={libraryItemPath(item.id)}
                      >
                        <ItemIcon item={item} size="icon-2xl" />
                        <span className="flex min-w-0 flex-col gap-1">
                          <TruncatedText
                            className="text-sm font-medium"
                            lines={2}
                          >
                            {itemName(item)}
                          </TruncatedText>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {optionIcon(equipmentSlotIcon(item.type))}
                            {slotName(item.type)} ·{" "}
                            {t(`progression:rarities.${item.rarity}`, {
                              defaultValue: item.rarity,
                            })}{" "}
                            ·{" "}
                            {t("items.list.maxLevel", {
                              level: maxItemLevel(item),
                            })}
                          </span>
                          <ItemFor
                            charactersById={charactersById}
                            compact
                            factionCount={factionCount}
                            factionName={factionName}
                            item={item}
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Rarity, Slot and Faction, several of each. */
function LibraryItemFilterFields({
  query,
  update,
  factions,
  slotName,
}: {
  query: LibraryItemsQuery
  update: (patch: Partial<LibraryItemsQuery>) => void
  factions: readonly { id: string; name: string }[]
  slotName: (type: string) => string
}) {
  const { t } = useTranslation(["library", "progression"])
  return (
    <div className="grid gap-3" data-testid="library-items-filter-fields">
      <FilterField icon="rarity" label={t("items.list.rarity")}>
        <MultiSelect
          clearLabel={t("items.list.clearRarities")}
          data-testid="library-items-rarity-filter"
          label={t("items.list.rarity")}
          onChange={(rarity) => update({ rarity })}
          options={rarityOrder.map((rarity) => ({
            value: rarity,
            label: t(`progression:rarities.${rarity}`, {
              defaultValue: rarity,
            }),
            icon: optionIcon(rarityIcon(rarity)),
          }))}
          placeholder={t("items.list.allRarities")}
          value={query.rarity}
        />
      </FilterField>
      <FilterField icon="itemSlot" label={t("items.list.slot")}>
        <MultiSelect
          clearLabel={t("items.list.clearSlots")}
          data-testid="library-items-slot-filter"
          label={t("items.list.slot")}
          onChange={(slot) => update({ slot })}
          options={ITEM_SLOT_TYPES.map((slot) => ({
            value: slot,
            label: slotName(slot),
            icon: optionIcon(equipmentSlotIcon(slot)),
          }))}
          placeholder={t("items.list.allSlots")}
          value={query.slot}
        />
      </FilterField>
      <FilterField icon="faction" label={t("items.list.faction")}>
        <MultiSelect
          clearLabel={t("items.list.clearFactions")}
          data-testid="library-items-faction-filter"
          label={t("items.list.faction")}
          onChange={(faction) => update({ faction })}
          options={factions.map((faction) => ({
            value: faction.id,
            label: faction.name,
            icon: optionIcon(factionIcon(faction.id)),
          }))}
          placeholder={t("items.list.allFactions")}
          searchPlaceholder={t("items.list.searchFactions")}
          value={query.faction}
        />
      </FilterField>
    </div>
  )
}
