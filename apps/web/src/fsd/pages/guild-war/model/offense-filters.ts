import { defaultPickerFilters } from "@/features/team-editor"
import type { PickerFilters } from "@/features/team-editor"

/** The Offense picker's filters: the team picker's, plus whether deployed units show. */
export interface OffenseFilters extends PickerFilters {
  showDeployed: boolean
}

/** Owned only starts on (only owned units can attack); deployed units start hidden. */
export const DEFAULT_OFFENSE_FILTERS: OffenseFilters = {
  ...defaultPickerFilters,
  ownedOnly: true,
  showDeployed: false,
}
