import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import type { HordeTierAlliance } from "@/entities/legendary-event"

import {
  TIER_LIST_ALLIANCES,
  type TierListUrlFilters,
} from "./tier-list.view-model"

export interface TierListFiltersProps {
  filters: TierListUrlFilters
  /** False while the roster is unknown: Only owned is disabled with "Sync your roster". */
  rosterKnown: boolean
  /** The roster read is still pending (no "Sync your roster" note yet; a requested Only owned
   *  stays on while the page waits for it). */
  rosterLoading: boolean
  onChange: (patch: Partial<TierListUrlFilters>) => void
}

function SearchField({
  query,
  onChange,
}: {
  query: string
  onChange: (query: string) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <div className="relative min-w-0 flex-1 md:max-w-xs">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={t("tierList.search")}
        className="pl-9"
        data-testid="tier-list-search"
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("tierList.search")}
        type="search"
        value={query}
      />
    </div>
  )
}

function OnlyOwnedSwitch({
  filters,
  rosterKnown,
  rosterLoading,
  onChange,
}: TierListFiltersProps) {
  const { t } = useTranslation("legendaryEvents")
  const id = useId()
  const hintId = useId()
  const showHint = !rosterKnown && !rosterLoading
  return (
    <div className="flex min-h-11 items-center gap-2 md:min-h-0">
      <Switch
        aria-describedby={showHint ? hintId : undefined}
        checked={(rosterKnown || rosterLoading) && filters.onlyOwned}
        data-testid="tier-list-only-owned"
        disabled={!rosterKnown}
        id={id}
        onCheckedChange={(onlyOwned) => onChange({ onlyOwned })}
      />
      <Label htmlFor={id}>{t("tierList.onlyOwned")}</Label>
      {showHint ? (
        <span
          className="text-xs text-muted-foreground"
          data-testid="tier-list-roster-unknown"
          id={hintId}
        >
          {t("tierList.syncRoster")}
        </span>
      ) : null}
    </div>
  )
}

function AllianceFilter({
  alliance,
  isMobile,
  onChange,
}: {
  alliance: HordeTierAlliance
  isMobile: boolean
  onChange: (alliance: HordeTierAlliance) => void
}) {
  const { t } = useTranslation(["legendaryEvents", "common"])
  return (
    <ToggleGroup
      aria-label={t("tierList.alliance")}
      className={cn("flex-wrap", isMobile && "w-full")}
      data-testid="tier-list-alliance"
      onValueChange={(value) => {
        // Re-picking the selected item yields "": the filter keeps its value.
        const next = TIER_LIST_ALLIANCES.find((item) => item === value)
        if (next) onChange(next)
      }}
      size={isMobile ? "default" : "sm"}
      spacing={1}
      type="single"
      value={alliance}
      variant="outline"
    >
      {TIER_LIST_ALLIANCES.map((item) => (
        <ToggleGroupItem
          className={isMobile ? "min-h-11 flex-1" : undefined}
          data-alliance={item}
          key={item}
          value={item}
        >
          {item === "all"
            ? t("tierList.allianceAll")
            : t(`common:alliances.${item}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Desktop: search, Only owned and the alliance filter in one row (the tour's filters target). */
export function TierListFiltersRow(props: TierListFiltersProps) {
  const { filters, onChange } = props
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
      data-testid="tier-list-filters"
    >
      <SearchField
        onChange={(query) => onChange({ query })}
        query={filters.query}
      />
      <OnlyOwnedSwitch {...props} />
      <AllianceFilter
        alliance={filters.alliance}
        isMobile={false}
        onChange={(alliance) => onChange({ alliance })}
      />
    </div>
  )
}

/** Mobile: the search and a Filters button in a compact bar; Only owned and the alliance filter
 *  sit in a bottom sheet. The Filters button is the tour's filters target. */
export function TierListFiltersBar(props: TierListFiltersProps) {
  const { filters, onChange } = props
  const { t } = useTranslation("legendaryEvents")
  const active =
    (filters.onlyOwned && (props.rosterKnown || props.rosterLoading) ? 1 : 0) +
    (filters.alliance === "all" ? 0 : 1)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <SearchField
        onChange={(query) => onChange({ query })}
        query={filters.query}
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="min-h-11 shrink-0"
            data-testid="tier-list-filters"
            variant="outline"
          >
            <SlidersHorizontal aria-hidden="true" />
            {t("tierList.filters")}
            {active > 0 ? (
              <span
                className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums"
                data-testid="tier-list-filters-count"
              >
                {active}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent data-testid="tier-list-filters-sheet" side="bottom">
          <SheetHeader>
            <SheetTitle>{t("tierList.filters")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("tierList.filtersDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <OnlyOwnedSwitch {...props} />
            <AllianceFilter
              alliance={filters.alliance}
              isMobile
              onChange={(alliance) => onChange({ alliance })}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
