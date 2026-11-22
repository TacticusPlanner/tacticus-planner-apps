import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"

import type { UnderCap } from "@/entities/team"

const PARTS = ["rarity", "rank", "level", "abilities"] as const

/** Says what of a unit is under the cap, e.g. "Under Epic: rank, abilities"; null when nothing. */
export function useUnderCapText() {
  const { t, i18n } = useTranslation(["teams", "progression"])
  return (under: UnderCap | undefined, cap: Rarity) => {
    if (!under?.any) return null
    const parts = PARTS.filter((part) =>
      part === "abilities"
        ? under.abilities[0] || under.abilities[1]
        : under[part]
    ).map((part) => t(`picker.capParts.${part}`))
    return t("picker.underCap", {
      rarity: t(`progression:rarities.${cap}`),
      parts: new Intl.ListFormat(i18n.language, {
        type: "conjunction",
        style: "narrow",
      }).format(parts),
    })
  }
}
