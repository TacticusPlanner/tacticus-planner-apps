import { useTranslation } from "react-i18next"

import {
  useObjectiveLabel,
  type LegendaryEventLane,
  type ObjectiveIconModel,
} from "@/entities/legendary-event"

/** One grid column: defeat-all, then the five objectives in catalog order. */
export interface ProgressColumn {
  label: string
  icon: ObjectiveIconModel | "defeatAll" | undefined
  /** The per-battle score, formatted ("80", or "32–48" for defeat-all when it varies). */
  points: string
}

/** The six column descriptors of a lane's grid. */
export function useProgressColumns(lane: LegendaryEventLane): ProgressColumn[] {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const defeatAll = lane.defeatAll.length > 0 ? lane.defeatAll : [0]
  const low = Math.min(...defeatAll)
  const high = Math.max(...defeatAll)
  return [
    {
      label: t("progress.defeatAll"),
      icon: "defeatAll",
      points:
        low === high
          ? number.format(low)
          : `${number.format(low)}–${number.format(high)}`,
    },
    ...[...lane.unitsRestrictions]
      .sort((a, b) => a.index - b.index)
      .map((objective) => {
        const { label, icon } = objectiveLabel(objective)
        return { label, icon, points: number.format(objective.points) }
      }),
  ]
}
