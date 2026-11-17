import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import { Input } from "@workspace/ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import type { HordeTierAlliance } from "@/entities/legendary-event"
import { EntityIcon, FILTER_CHIP_CLASS_NAME, PageToolbar } from "@/shared/ui"

import { TIER_LIST_ALLIANCES } from "./tier-list.view-model"
import type { TierListUrlFilters } from "./tier-list.view-model"

export interface TierListFiltersProps {
  filters: TierListUrlFilters
  /** False while the roster is unknown: Owned only is disabled with "Sync your roster". */
  rosterKnown: boolean
  /** The roster read is still pending (no "Sync your roster" note yet; a requested Owned only
   *  stays on while the page waits for it). */
  rosterLoading: boolean
  onChange: (patch: Partial<TierListUrlFilters>) => void
  isMobile: boolean
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

/**
 * The Hero tier list's toolbar (ui-style-guide rule 2): the search in the Find slot, then one chip
 * row with "Owned only" and a chip per alliance (picking the selected alliance again shows every
 * alliance). The chips scroll sideways on mobile. The toolbar is the tour's filters target.
 */
export function TierListFilters(props: TierListFiltersProps) {
  const { filters, onChange, isMobile } = props
  return (
    <PageToolbar
      chips={
        <div
          className={cn(
            "flex items-center gap-2",
            isMobile ? "overflow-x-auto pb-1" : "flex-wrap"
          )}
        >
          <OwnedOnlyChip {...props} />
          <AllianceChips
            alliance={filters.alliance}
            onChange={(alliance) => onChange({ alliance })}
          />
        </div>
      }
      find={
        <SearchField
          onChange={(query) => onChange({ query })}
          query={filters.query}
        />
      }
      testId="tier-list-filters"
    />
  )
}

function OwnedOnlyChip({
  filters,
  rosterKnown,
  rosterLoading,
  onChange,
}: TierListFiltersProps) {
  const { t } = useTranslation("legendaryEvents")
  const hintId = useId()
  const showHint = !rosterKnown && !rosterLoading
  const on = (rosterKnown || rosterLoading) && filters.onlyOwned
  return (
    <>
      <ToggleGroup
        className="shrink-0"
        disabled={!rosterKnown}
        onValueChange={(values) =>
          onChange({ onlyOwned: values.includes("owned") })
        }
        size="sm"
        spacing={1}
        type="multiple"
        value={on ? ["owned"] : []}
        variant="outline"
      >
        <ToggleGroupItem
          aria-describedby={showHint ? hintId : undefined}
          className={FILTER_CHIP_CLASS_NAME}
          data-testid="tier-list-only-owned"
          value="owned"
        >
          {t("tierList.onlyOwned")}
        </ToggleGroupItem>
      </ToggleGroup>
      {showHint ? (
        <span
          className="shrink-0 text-sm text-muted-foreground"
          data-testid="tier-list-roster-unknown"
          id={hintId}
        >
          {t("tierList.syncRoster")}
        </span>
      ) : null}
    </>
  )
}

function AllianceChips({
  alliance,
  onChange,
}: {
  alliance: HordeTierAlliance
  onChange: (alliance: HordeTierAlliance) => void
}) {
  const { t } = useTranslation(["legendaryEvents", "common"])
  return (
    <ToggleGroup
      aria-label={t("tierList.alliance")}
      className="shrink-0"
      data-testid="tier-list-alliance"
      onValueChange={(value) => {
        // Picking the selected chip again clears it: every alliance shows.
        const next = TIER_LIST_ALLIANCES.find((item) => item === value)
        onChange(next ?? "all")
      }}
      size="sm"
      spacing={1}
      type="single"
      value={alliance === "all" ? "" : alliance}
      variant="outline"
    >
      {TIER_LIST_ALLIANCES.filter((item) => item !== "all").map((item) => (
        <ToggleGroupItem
          className={FILTER_CHIP_CLASS_NAME}
          data-alliance={item}
          key={item}
          value={item}
        >
          <EntityIcon
            alt=""
            className="size-4 shrink-0"
            height={16}
            src={onslaughtAllianceIcon(item)}
            width={16}
          />
          {t(`common:alliances.${item}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
