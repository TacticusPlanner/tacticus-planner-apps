import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { unitOriginState } from "@/entities/unit"
import type { UnitKind } from "@/entities/unit"
import type { FilterableUnit } from "@/features/unit-filters"
import {
  LazyUnitFilterFields,
  activeUnitFilterCount,
  useUnitFilterOptions,
  useUnitFilters,
} from "@/features/unit-filters"
import {
  EmptyState,
  EntityIcon,
  FiltersControl,
  PageToolbar,
  SearchField,
  TruncatedText,
} from "@/shared/ui"

import { filterUnits, searchUnits } from "../../model/unit/unit-list.model"
import type { UnitListItem } from "../../model/unit/unit-list.model"

/**
 * A Library unit list (characters, Machines of War): name search and the unit filters (catalog
 * scope, the fields that apply to `kind`, kept in the URL under Collection's parameter names) in
 * the page toolbar's Find slot, and a wrapping grid of round portrait tiles. A tile opens the unit
 * page under `basePath` and hands it the list's current order for prev/next.
 */
export function UnitList({
  kind,
  filterable,
  items,
  iconFor,
  basePath,
  testIdPrefix,
  tileTestIdPrefix,
  labels,
}: {
  /** The kind of unit listed: decides which filters are offered. */
  kind: UnitKind
  /** What the unit filters read of each listed unit. */
  filterable: (id: UnitId) => FilterableUnit | undefined
  /** Every unit, in the list's default order. */
  items: readonly UnitListItem[]
  iconFor: (id: UnitId) => string | undefined
  basePath: string
  /** Prefix of the search, list and no-match test ids, e.g. "characters". */
  testIdPrefix: string
  /** Prefix of each tile's test id, e.g. "character-tile". */
  tileTestIdPrefix: string
  labels: {
    title: string
    search: string
    noMatching: string
    /** The no-match line while a filter is set. */
    noMatchingFilters: string
    clearSearch: string
    /** Clears the search and the filters, while a filter is set. */
    clearFilters: string
  }
}) {
  const { i18n } = useTranslation("library")
  const isMobile = useIsMobile()
  const [query, setQuery] = useState("")
  const options = useUnitFilterOptions()
  const { filters, update, clear } = useUnitFilters(options, "catalog")
  const filterCount = activeUnitFilterCount(filters)
  const listed = useMemo(
    () =>
      filterUnits(
        searchUnits(items, query, i18n.language),
        filters,
        filterable
      ),
    [items, query, i18n.language, filters, filterable]
  )
  const clearAll = () => {
    setQuery("")
    clear()
  }
  const origin = useMemo(
    () => unitOriginState({ kind: "list", ids: listed.map((item) => item.id) }),
    [listed]
  )

  return (
    <>
      <PageToolbar
        find={
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchField
              label={labels.search}
              onChange={setQuery}
              testId={`${testIdPrefix}-search`}
              value={query}
            />
            {options ? (
              <FiltersControl
                count={filterCount}
                onClear={clear}
                size="form"
                testId={`${testIdPrefix}-filters`}
              >
                <LazyUnitFilterFields
                  filters={filters}
                  update={update}
                  options={options}
                  scope="catalog"
                  kind={kind}
                  layout={isMobile ? "sheet" : "panel"}
                />
              </FiltersControl>
            ) : null}
          </div>
        }
      />

      {listed.length === 0 ? (
        <NoUnits
          hasUnits={items.length > 0}
          filtered={filterCount > 0}
          labels={labels}
          onClear={clearAll}
          testId={`${testIdPrefix}-no-matching`}
        />
      ) : (
        <ul
          className="flex flex-wrap gap-2"
          aria-label={labels.title}
          data-testid={`${testIdPrefix}-list`}
        >
          {listed.map((item) => {
            const emblem = factionIcon(item.factionId)
            return (
              <li key={item.id}>
                <Link
                  to={`${basePath}/${item.id}`}
                  state={origin}
                  className="flex w-24 flex-col items-center gap-1.5 rounded-lg border interactive-surface p-2 text-center"
                  data-testid={`${tileTestIdPrefix}-${item.id}`}
                >
                  <span className="relative">
                    <EntityIcon
                      size="portrait-md"
                      src={iconFor(item.id)}
                      alt=""
                      className="rounded-full bg-muted"
                    />
                    {emblem ? (
                      <EntityIcon
                        size="icon"
                        src={emblem}
                        alt={item.factionName}
                        className="absolute -right-1 -bottom-1 rounded-full bg-background p-0.5"
                      />
                    ) : null}
                  </span>
                  <TruncatedText className="text-xs font-medium" lines={2}>
                    {item.name}
                  </TruncatedText>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

/** The empty list: no records at all, or none matching the search and filters, with a way back. */
function NoUnits({
  hasUnits,
  filtered,
  labels,
  onClear,
  testId,
}: {
  hasUnits: boolean
  /** A filter is set, so the copy and the action name the filters too. */
  filtered: boolean
  labels: {
    noMatching: string
    noMatchingFilters: string
    clearSearch: string
    clearFilters: string
  }
  onClear: () => void
  testId: string
}) {
  const { t } = useTranslation("library")
  if (!hasUnits) {
    return (
      <EmptyState
        description={t("collections.noRecords")}
        testId={testId}
        variant="empty"
      />
    )
  }
  return (
    <EmptyState
      actions={
        <Button variant="outline" onClick={onClear}>
          {filtered ? labels.clearFilters : labels.clearSearch}
        </Button>
      }
      description={filtered ? labels.noMatchingFilters : labels.noMatching}
      testId={testId}
      variant="no-match"
    />
  )
}
