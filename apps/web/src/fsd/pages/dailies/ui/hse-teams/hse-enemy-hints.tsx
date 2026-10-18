import { useTranslation } from "react-i18next"

import type {
  HseEnemyHint,
  HseEnemyLabel,
  HseTeamMode,
} from "../../model/hse-team-recommendations.types"

/** The enemy-side rules of one mode's scoring (For the Emperor: only non-Imperial enemies count;
 * Squig Smash: only Large Squigs), one line each. Nothing when every enemy counts. */
export function HseEnemyHints({
  mode,
  hints,
}: {
  mode: HseTeamMode
  hints: readonly HseEnemyHint[]
}) {
  const { t, i18n } = useTranslation([
    "dailies",
    "common",
    "traits",
    "factions",
    "npcs",
  ])
  if (hints.length === 0) return null

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
  const names = (labels: readonly HseEnemyLabel[]) =>
    list.format(labels.map(name))

  const line = (hint: HseEnemyHint): string => {
    if (hint.allowed.length === 0)
      return t("dailies:hse.teams.hints.excluded", {
        enemies: names(hint.excluded),
      })
    if (hint.allowed.every((label) => label.via === "unit"))
      return t("dailies:hse.teams.hints.units", {
        units: names(hint.allowed),
      })
    if (hint.excluded.length > 0)
      return t("dailies:hse.teams.hints.allowedExcluded", {
        enemies: names(hint.allowed),
        excluded: names(hint.excluded),
      })
    return t("dailies:hse.teams.hints.allowed", {
      enemies: names(hint.allowed),
    })
  }

  return (
    <ul
      className="space-y-1 text-sm text-muted-foreground"
      data-testid={`hse-teams-hints-${mode.toLowerCase()}`}
    >
      {hints.map((hint) => (
        <li key={JSON.stringify(hint)}>{line(hint)}</li>
      ))}
    </ul>
  )
}
