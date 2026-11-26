import {
  progressionRarity,
  rankIndex,
  rarityOrder,
  rarityRank,
} from "@workspace/game-domain"
import type { Rank, Rarity } from "@workspace/game-domain"

import type { TeamRosterUnit } from "@/entities/team"

import type { UnitKind } from "./offense"

/** The rank a rarity's cap allows, as the Teams page caps units (`capRosterUnit`). Mythic, which
 *  caps nothing there, starts at Adamantine 1: the first rank past Legendary's Diamond 3. */
const CAP_RANK: Record<Rarity, Rank> = {
  Common: "Iron1",
  Uncommon: "Bronze1",
  Rare: "Silver1",
  Epic: "Gold1",
  Legendary: "Diamond3",
  Mythic: "Adamantine1",
}

/**
 * A picked unit against the defenders' cap, by what matters most, its rank: `over` when the rank
 * reaches the next rarity's cap, so the unit could fight at that cap instead (a Gold 1 Khârn on a
 * Rare slot, not a Silver 3 one); `under` when the rank is at or below the previous rarity's cap,
 * so the unit only fills a lower cap (a Silver 1 unit on an Epic slot). A Machine of War has no
 * rank and is judged by its rarity the same way. Null when it fits, the unit is not synced, or no
 * cap is picked.
 */
export type CapFit =
  { fit: "over"; rarity: Rarity } | { fit: "under"; rarity: Rarity } | null

export function capFit(
  kind: UnitKind,
  unit: TeamRosterUnit | undefined,
  cap: Rarity | undefined
): CapFit {
  if (!unit || !cap) return null
  const at = rarityOrder.indexOf(cap)
  const next = rarityOrder[at + 1]
  const previous = at > 0 ? rarityOrder[at - 1] : undefined
  if (kind === "mow") {
    const rarity = rarityRank(progressionRarity(unit.progression))
    if (next && rarity >= rarityRank(next)) return { fit: "over", rarity: next }
    if (previous && rarity <= rarityRank(previous)) {
      return { fit: "under", rarity: previous }
    }
    return null
  }
  if (!unit.rank) return null
  const rank = rankIndex(unit.rank)
  if (next && rank >= rankIndex(CAP_RANK[next])) {
    return { fit: "over", rarity: next }
  }
  if (previous && rank <= rankIndex(CAP_RANK[previous])) {
    return { fit: "under", rarity: previous }
  }
  return null
}

/** The rarity whose cap a rank belongs to: the lowest cap that allows it (Silver 3 is Epic's). */
export function rankCapRarity(rank: Rank): Rarity {
  return (
    rarityOrder.find(
      (rarity) => rankIndex(rank) <= rankIndex(CAP_RANK[rarity])
    ) ?? "Mythic"
  )
}
