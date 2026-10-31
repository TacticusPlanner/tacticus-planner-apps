import { useId } from "react"
import { useTranslation } from "react-i18next"
import { legendaryEventResourceIcon, powerIcon } from "@workspace/game-catalog"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { EntityIcon } from "@/shared/ui"

import type { PickerSort } from "../model/team-picker"

/** The picker's Points left / Power sort (spec: the picker has a Points left / Power sort), drawn as
 *  the game's LE points and power icons with the names as accessible labels and tooltips; Power
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
          aria-label={t("teams.picker.sortPointsLeft")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground max-md:h-11 max-md:min-w-11"
          data-testid="team-picker-sort-points"
          size="sm"
          title={t("teams.picker.sortPointsLeft")}
          value="pointsLeft"
        >
          <EntityIcon
            alt=""
            className="size-5"
            src={legendaryEventResourceIcon("points")}
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-describedby={powerAvailable ? undefined : reasonId}
          aria-label={t("teams.picker.sortPower")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground max-md:h-11 max-md:min-w-11"
          data-testid="team-picker-sort-power"
          disabled={!powerAvailable}
          size="sm"
          title={
            powerAvailable
              ? t("teams.picker.sortPower")
              : t("teams.power.unavailable")
          }
          value="power"
        >
          <EntityIcon alt="" className="size-5" src={powerIcon()} />
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
