import { useTranslation } from "react-i18next"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import type { HordeTierAlliance } from "@/entities/legendary-event"
import {
  EntityIcon,
  FILTER_CHIP_CLASS_NAME,
  PageToolbar,
  OwnedOnlyChip,
} from "@/shared/ui"

import { TierListSearchField } from "./tier-list-search-field"
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

/**
 * The Hero tier list's toolbar (ui-style-guide rule 2): the search in the Find slot, then one chip
 * row with "Owned only" and a chip per alliance (picking the selected alliance again shows every
 * alliance). The chips scroll sideways on mobile. The toolbar is the tour's filters target.
 */
export function TierListFilters(props: TierListFiltersProps) {
  const { t } = useTranslation("legendaryEvents")
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
          <OwnedOnlyChip
            disabled={!props.rosterKnown}
            disabledReason={
              props.rosterKnown || props.rosterLoading
                ? undefined
                : t("tierList.syncRoster")
            }
            label={t("tierList.onlyOwned")}
            on={(props.rosterKnown || props.rosterLoading) && filters.onlyOwned}
            onChange={(onlyOwned) => onChange({ onlyOwned })}
            reasonTestId="tier-list-roster-unknown"
            reasonVisible
            size="sm"
            testId="tier-list-only-owned"
          />
          <AllianceChips
            alliance={filters.alliance}
            onChange={(alliance) => onChange({ alliance })}
          />
        </div>
      }
      find={
        <TierListSearchField
          label={t("tierList.search")}
          onChange={(query) => onChange({ query })}
          query={filters.query}
          testId="tier-list-search"
        />
      }
      testId="tier-list-filters"
    />
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
            size="icon"
            alt=""
            className="shrink-0"
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
