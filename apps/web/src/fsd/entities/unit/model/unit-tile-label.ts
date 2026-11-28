import { useTranslation } from "react-i18next"
import { progressionStarsIndex } from "@workspace/game-domain"
import type { Progression } from "@workspace/game-domain"

import { progressionText } from "@/shared/ui"

import type { UnitFaction, UnitTileUnit } from "./types"

/**
 * From the first blue star on, every further ascension costs mythic shards, so an owned unit's tile
 * shows only the shard count that still matters: regular below a blue star, mythic from it.
 */
export function usesMythicShards(progression: Progression): boolean {
  return progressionStarsIndex(progression) >= firstBlueStarIndex
}
const firstBlueStarIndex = 11

/** "Titus, Legendary 4★, Gold I, level 45, active ability level 40, ...". */
export function useUnitTileLabel(
  unit: UnitTileUnit,
  faction?: UnitFaction
): string {
  const { t } = useTranslation(["common", "progression"])
  const { data } = unit
  const parts = faction ? [unit.name, faction.name] : [unit.name]

  if (data.state === "owned") {
    parts.push(...progressionParts(data.progression, t))
    if (data.rank) parts.push(t(`progression:ranks.${data.rank}`))
    if (data.xpLevel !== undefined) {
      parts.push(t("unitTile.level", { level: data.xpLevel }))
    }
    const [first, second] = data.abilityLevels
    parts.push(
      t(
        unit.kind === "character"
          ? "unitTile.characterAbilities"
          : "unitTile.mowAbilities",
        { first, second }
      )
    )
    parts.push(
      usesMythicShards(data.progression)
        ? t("unitTile.mythicShards", { count: data.mythicShards })
        : t("unitTile.shards", { count: data.shards })
    )
    return parts.join(", ")
  }

  parts.push(t("unitTile.notOwned"))
  if (data.shards === undefined) {
    if (data.rarity) {
      parts.push(
        t("unitTile.startsAt", {
          rarity: t(`progression:rarities.${data.rarity}`),
        })
      )
    }
  } else {
    parts.push(
      data.unlockShards === undefined
        ? t("unitTile.shards", { count: data.shards })
        : t("unitTile.shardsToUnlock", {
            count: data.shards,
            required: data.unlockShards,
          })
    )
    if (data.mythicShards !== undefined && data.mythicShards > 0) {
      parts.push(t("unitTile.mythicShards", { count: data.mythicShards }))
    }
  }
  return parts.join(", ")
}

function progressionParts(
  progression: Progression,
  t: ReturnType<typeof useTranslation<["common", "progression"]>>["t"]
): string[] {
  return [progressionText(t, progression)]
}
