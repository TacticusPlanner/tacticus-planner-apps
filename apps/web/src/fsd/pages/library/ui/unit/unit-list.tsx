import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { factionIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { EntityIcon } from "@/shared/ui"

import { searchUnits, type UnitListItem } from "./unit-list.model"
import { unitOriginState } from "./unit-origin"

/**
 * A Library unit list (characters, Machines of War): name search and a wrapping grid of round
 * portrait tiles. A tile opens the unit page under `basePath` and hands it the list's current order
 * for prev/next.
 */
export function UnitList({
  items,
  iconFor,
  basePath,
  testIdPrefix,
  tileTestIdPrefix,
  labels,
}: {
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
    searchPlaceholder: string
    noMatching: string
    clearSearch: string
  }
}) {
  const { t, i18n } = useTranslation("library")
  const [query, setQuery] = useState("")
  const listed = useMemo(
    () => searchUnits(items, query, i18n.language),
    [items, query, i18n.language]
  )
  const origin = useMemo(
    () => unitOriginState({ kind: "list", ids: listed.map((item) => item.id) }),
    [listed]
  )

  return (
    <>
      <label
        className="relative max-w-sm"
        data-testid={`${testIdPrefix}-search`}
      >
        <span className="sr-only">{labels.search}</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="pl-8"
        />
      </label>

      {listed.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"
          data-testid={`${testIdPrefix}-no-matching`}
        >
          <p>
            {items.length === 0
              ? t("collections.noRecords")
              : labels.noMatching}
          </p>
          {items.length > 0 ? (
            <Button variant="outline" onClick={() => setQuery("")}>
              {labels.clearSearch}
            </Button>
          ) : null}
        </div>
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
                  title={`${item.name} · ${item.factionName}`}
                  className="flex w-24 flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-primary"
                  data-testid={`${tileTestIdPrefix}-${item.id}`}
                >
                  <span className="relative">
                    <EntityIcon
                      src={iconFor(item.id)}
                      alt=""
                      className="size-14 rounded-full bg-muted"
                    />
                    {emblem ? (
                      <EntityIcon
                        src={emblem}
                        alt={item.factionName}
                        className="absolute -right-1 -bottom-1 size-5 rounded-full bg-background p-0.5"
                      />
                    ) : null}
                  </span>
                  <span className="line-clamp-2 text-xs font-medium">
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
