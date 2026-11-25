import { useId } from "react"
import { useTranslation } from "react-i18next"
import { legendaryEventResourceIcon, powerIcon } from "@workspace/game-catalog"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"

import { EntityIcon, HintedToggleGroupItem } from "@/shared/ui"

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
        <HintedToggleGroupItem
          aria-label={t("teams.picker.sortPointsLeft")}
          data-testid="team-picker-sort-points"
          hint={t("teams.picker.sortPointsLeft")}
          size="sm"
          value="pointsLeft"
        >
          <EntityIcon
            size="icon"
            alt=""
            src={legendaryEventResourceIcon("points")}
          />
        </HintedToggleGroupItem>
        <HintedToggleGroupItem
          aria-describedby={powerAvailable ? undefined : reasonId}
          aria-label={t("teams.picker.sortPower")}
          data-testid="team-picker-sort-power"
          disabledReason={
            powerAvailable ? undefined : t("teams.power.unavailable")
          }
          hint={t("teams.picker.sortPower")}
          size="sm"
          value="power"
        >
          <EntityIcon size="icon" alt="" src={powerIcon()} />
        </HintedToggleGroupItem>
      </ToggleGroup>
      {powerAvailable ? null : (
        <span className="sr-only" id={reasonId}>
          {t("teams.power.unavailable")}
        </span>
      )}
    </div>
  )
}
