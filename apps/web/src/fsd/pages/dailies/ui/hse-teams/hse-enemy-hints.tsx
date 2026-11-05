import { useTranslation } from "react-i18next"

import type { HseEnemyHint, HseTeamMode } from "@/features/team-recommendations"

import { useEnemyLabelNames } from "./use-enemy-label-names"

/** The enemy-side rules of one mode's scoring (For the Emperor: only non-Imperial enemies count;
 * Squig Smash: only Large Squigs), one line each. Nothing when every enemy counts. */
export function HseEnemyHints({
  mode,
  hints,
}: {
  mode: HseTeamMode
  hints: readonly HseEnemyHint[]
}) {
  const { t } = useTranslation("dailies")
  const names = useEnemyLabelNames()
  if (hints.length === 0) return null

  const line = (hint: HseEnemyHint): string => {
    if (hint.allowed.length === 0)
      return t("hse.teams.hints.excluded", {
        enemies: names(hint.excluded),
      })
    if (hint.allowed.every((label) => label.via === "unit"))
      return t("hse.teams.hints.units", {
        units: names(hint.allowed),
      })
    if (hint.excluded.length > 0)
      return t("hse.teams.hints.allowedExcluded", {
        enemies: names(hint.allowed),
        excluded: names(hint.excluded),
      })
    return t("hse.teams.hints.allowed", {
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
