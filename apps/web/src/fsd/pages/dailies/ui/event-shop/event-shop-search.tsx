import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import {
  eventOfferGroups,
  type EventOfferGroup,
} from "@/features/shops/event-planner"
import { anyNameIncludes, normalizeSearchText } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"
import { useUnitSearchNames } from "@/shared/unit-name"

import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

/** At most this many rewards are listed; typing more narrows them. */
const MAX_RESULTS = 12

/**
 * The event's offers whose reward matches `query`: by the reward's name in the user's language, and for
 * shards also by the unit's other names (as the unit pickers match them). Matches that start with the
 * query come first.
 */
function useOfferSearch(
  controller: EventShopController,
  format: EventShopFormat,
  query: string
) {
  const { i18n } = useTranslation()
  const searchNames = useUnitSearchNames()
  const { event, todayIndex, roster, now } = controller
  const groups = useMemo(
    () =>
      eventOfferGroups(event, {
        todayIndex,
        powerLevel: roster.powerLevel,
        lockContext: roster.lockContext ?? undefined,
        now,
      }).map((group) => {
        const label = format.reward(group.rewardType, group.unitId).label
        return {
          group,
          label,
          names: [label, ...(group.unitId ? searchNames(group.unitId) : [])],
        }
      }),
    [event, todayIndex, roster, now, format, searchNames]
  )
  const needle = normalizeSearchText(query, i18n.language)
  return useMemo(() => {
    if (!needle) return []
    const starts = (label: string) =>
      normalizeSearchText(label, i18n.language).startsWith(needle) ? 0 : 1
    return groups
      .filter((entry) => anyNameIncludes(entry.names, needle, i18n.language))
      .sort(
        (a, b) =>
          starts(a.label) - starts(b.label) || a.label.localeCompare(b.label)
      )
      .slice(0, MAX_RESULTS)
  }, [groups, needle, i18n.language])
}

function SearchInput({
  query,
  onQueryChange,
  onFocus,
  onKeyDown,
  className,
}: {
  query: string
  onQueryChange: (query: string) => void
  onFocus?: () => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
}) {
  const { t } = useTranslation("eventShops")
  return (
    <label
      className={cn(
        "flex h-8 items-center gap-2 rounded-lg border bg-card px-2.5 text-sm focus-within:ring-2 focus-within:ring-ring/50",
        className
      )}
    >
      <Search
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <input
        aria-label={t("search.title")}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={t("search.placeholder")}
        type="search"
        value={query}
      />
      {query ? (
        <button
          aria-label={t("search.clear")}
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onQueryChange("")}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </label>
  )
}

/** The matching rewards, each with the days it is sold; a day opens the Shop tab on it. */
function SearchResults({
  results,
  controller,
  format,
  onOpenDay,
}: {
  results: { group: EventOfferGroup; label: string }[]
  controller: EventShopController
  format: EventShopFormat
  onOpenDay: (dayIndex: number) => void
}) {
  const { t } = useTranslation("eventShops")
  if (results.length === 0) {
    return (
      <p
        className="p-3 text-sm text-muted-foreground"
        data-testid="event-shop-search-empty"
      >
        {t("search.empty")}
      </p>
    )
  }
  return (
    <ul
      className="flex flex-col divide-y"
      data-testid="event-shop-search-results"
    >
      {results.map(({ group, label }) => (
        <li key={group.rewardType} className="flex flex-col gap-1.5 p-2">
          <span className="flex items-center gap-2">
            <EntityIcon
              alt=""
              className="size-7 shrink-0"
              src={format.reward(group.rewardType, group.unitId).iconUrl}
            />
            <span className="min-w-0 text-sm font-medium wrap-break-word">
              {label}
            </span>
          </span>
          <span className="flex flex-wrap gap-1 pl-9">
            {group.days.map((day) => {
              const offer = t("search.offer", {
                qty: format.number(day.qty),
                cost: format.number(day.cost),
              })
              return (
                <button
                  key={`${day.index}-${day.slotIndex}`}
                  aria-label={`${format.date(day.date)}, ${offer}${
                    day.past ? `, ${t("search.past")}` : ""
                  }`}
                  className={cn(
                    "flex flex-col items-start rounded-md border px-2 py-1 text-left text-xs hover:bg-muted",
                    day.past && "opacity-50",
                    day.index === controller.todayIndex && "border-primary"
                  )}
                  data-testid={`event-shop-search-day-${group.rewardType}-${day.index}`}
                  onClick={() => onOpenDay(day.index)}
                  type="button"
                >
                  <span className="font-medium">{format.date(day.date)}</span>
                  <span className="text-muted-foreground">{offer}</span>
                </button>
              )
            })}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Desktop and tablet: the shop search as a field in the tab bar; typing opens the matches under it
 * (spec event-shop-planner: shop search).
 */
export function EventShopSearchField({
  controller,
  format,
  onOpenDay,
}: {
  controller: EventShopController
  format: EventShopFormat
  onOpenDay: (dayIndex: number) => void
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const results = useOfferSearch(controller, format, query)
  const show = open && query.trim().length > 0

  return (
    <Popover onOpenChange={setOpen} open={show}>
      <PopoverAnchor asChild>
        <div
          className="mb-1.5 ml-auto w-72 max-w-full"
          data-testid="event-shop-search-open"
        >
          <SearchInput
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("")
                setOpen(false)
              }
            }}
            onQueryChange={(next) => {
              setQuery(next)
              setOpen(true)
            }}
            query={query}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="max-h-[min(28rem,70vh)] w-md max-w-[calc(100vw-2rem)] overflow-y-auto p-0"
        data-testid="event-shop-search"
        onInteractOutside={(event) => {
          // Clicking back into the field keeps the results open.
          const target = event.target as Element | null
          if (target?.closest('[data-testid="event-shop-search-open"]')) {
            event.preventDefault()
          }
        }}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SearchResults
          controller={controller}
          format={format}
          onOpenDay={(dayIndex) => {
            setOpen(false)
            onOpenDay(dayIndex)
          }}
          results={results}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Phone: the shop search in a dialog opened from the header's search icon. */
export function EventShopSearchDialog({
  controller,
  format,
  open,
  onOpenChange,
  onOpenDay,
}: {
  controller: EventShopController
  format: EventShopFormat
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenDay: (dayIndex: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const [query, setQuery] = useState("")
  const results = useOfferSearch(controller, format, query)
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto"
        data-testid="event-shop-search"
      >
        <DialogHeader>
          <DialogTitle>{t("search.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("search.placeholder")}
          </DialogDescription>
        </DialogHeader>
        {/* The dialog focuses its first field, the search, as it opens. */}
        <SearchInput onQueryChange={setQuery} query={query} />
        {query.trim() ? (
          <SearchResults
            controller={controller}
            format={format}
            onOpenDay={(dayIndex) => {
              onOpenChange(false)
              onOpenDay(dayIndex)
            }}
            results={results}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
