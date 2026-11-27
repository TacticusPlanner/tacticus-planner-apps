import { useTranslation } from "react-i18next"

import type { MasterTableCell } from "@/entities/legendary-event"

/** The lane names of a cell's teams ("Alpha, Gamma"). */
export function useCellLanes(): (cell: MasterTableCell) => string {
  const { t } = useTranslation("legendaryEvents")
  return (cell) => cell.laneIds.map((laneId) => t(`lanes.${laneId}`)).join(", ")
}
