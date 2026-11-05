import type { TFunction } from "i18next"

import type { TeamSuggestion } from "@/entities/legendary-event"

/**
 * A proposal's one-line reason (spec: Suggest teams dialog): its open covered objectives, depth and
 * points gain, then the tokens it saves; a proposal with neither reads "no gain over your teams
 * yet". `objectives` is the formatted list of the open covered objectives (`hasObjectives` false
 * when there are none) and `points` the formatted gain.
 */
export function suggestionReason(
  suggestion: Pick<TeamSuggestion, "depth" | "gainPoints" | "tokensSaved">,
  {
    t,
    objectives,
    hasObjectives,
    points,
  }: {
    t: TFunction<"legendaryEvents">
    objectives: string
    hasObjectives: boolean
    points: string
  }
): string {
  const { depth, gainPoints, tokensSaved } = suggestion
  if (gainPoints > 0) {
    const reason = hasObjectives
      ? t("suggestions.reason", { objectives, depth, points })
      : t("suggestions.reasonNoObjectives", { depth, points })
    return tokensSaved > 0
      ? `${reason} · ${t("suggestions.savesTokens", { count: tokensSaved })}`
      : reason
  }
  if (tokensSaved > 0) {
    return hasObjectives
      ? t("suggestions.reasonTokens", { objectives, depth, count: tokensSaved })
      : t("suggestions.reasonNoObjectivesTokens", { depth, count: tokensSaved })
  }
  return t("suggestions.reasonNoGain", { objectives, depth })
}
