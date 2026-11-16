import type { Namespace, TFunction } from "i18next"
import { progressionVisual } from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"
import type { Progression } from "@workspace/game-domain"

/**
 * A progression as short text — "Legendary 5★", "Mythic wings", or just "Common" before the first
 * star — for the places only text fits (accessible names, select search text, sentences). Stars are
 * never spelled out ("Red Five Stars"): on screen the app shows `CompactProgression` instead.
 */
export function progressionText<Ns extends Namespace>(
  translate: TFunction<Ns>,
  value: Progression
): string {
  // Any caller's `t` reaches `progression:*` by the namespace prefix, whatever its own namespaces.
  const t = translate as unknown as (
    key: string,
    options: Record<string, unknown>
  ) => string
  const rarity = progressionRarity(value)
  const rarityName = t(`progression:rarities.${rarity}`, {
    defaultValue: rarity,
  })
  const visual = progressionVisual(value)
  if (visual.kind === "none") return rarityName
  if (visual.kind === "wings") {
    return t("progression:short.wings", { rarity: rarityName })
  }
  return t("progression:short.stars", {
    rarity: rarityName,
    count: visual.count,
  })
}
