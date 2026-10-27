import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type { PickerSort } from "../model/team-picker"

/** The picker's Points left / Power sort (spec: the picker has a Points left / Power sort); Power
 *  is disabled with its reason while power data is unavailable. Touch targets are 44px on mobile. */
export function TeamPickerSort({
  value,
  onChange,
  powerAvailable,
}: {
  value: PickerSort
  onChange: (sort: PickerSort) => void
  powerAvailable: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const labelId = useId()
  const reasonId = useId()
  return (
    <div className="flex items-center gap-2 text-sm">
      <span id={labelId}>{t("teams.picker.sort")}</span>
      <ToggleGroup
        aria-labelledby={labelId}
        data-testid="team-picker-sort"
        onValueChange={(next) => {
          // Radix emits "" when the pressed item is clicked again; keep a sort selected.
          if (next) onChange(next as PickerSort)
        }}
        spacing={0}
        type="single"
        value={value}
        variant="outline"
      >
        <ToggleGroupItem
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground max-md:h-11"
          data-testid="team-picker-sort-points"
          size="sm"
          value="pointsLeft"
        >
          {t("teams.picker.sortPointsLeft")}
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-describedby={powerAvailable ? undefined : reasonId}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground max-md:h-11"
          data-testid="team-picker-sort-power"
          disabled={!powerAvailable}
          size="sm"
          title={powerAvailable ? undefined : t("teams.power.unavailable")}
          value="power"
        >
          {t("teams.picker.sortPower")}
        </ToggleGroupItem>
      </ToggleGroup>
      {powerAvailable ? null : (
        <span className="sr-only" id={reasonId}>
          {t("teams.power.unavailable")}
        </span>
      )}
    </div>
  )
}
