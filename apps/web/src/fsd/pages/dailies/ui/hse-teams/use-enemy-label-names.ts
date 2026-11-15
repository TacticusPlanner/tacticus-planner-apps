import { useTranslation } from "react-i18next"

import type { HseEnemyLabel } from "@/features/team-recommendations"

/** Localized names of enemy labels, as one "A, B or C" list. Shared with the matching team's card. */
export function useEnemyLabelNames(): (
  labels: readonly HseEnemyLabel[]
) => string {
  const { t, i18n } = useTranslation([
    "dailies",
    "common",
    "traits",
    "factions",
    "npcs",
  ])
  const list = new Intl.ListFormat(i18n.language, { type: "disjunction" })
  const name = (label: HseEnemyLabel): string => {
    switch (label.via) {
      case "alliance":
        return t(`common:alliances.${label.id}`, { defaultValue: label.id })
      case "trait":
        return t(`traits:${label.id}`, { defaultValue: label.id })
      case "faction":
        return t(`factions:${label.id}`, { defaultValue: label.id })
      case "unit":
        return t(`npcs:${label.id}`, { defaultValue: label.id })
    }
  }
  return (labels) => list.format(labels.map(name))
}
