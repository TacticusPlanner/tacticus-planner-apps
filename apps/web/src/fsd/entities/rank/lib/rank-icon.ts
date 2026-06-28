import type { RankId } from "../model/rank"

// Rank icons are sourced from V1. Stone..Diamond use `{tier}{n}.png` (lowercase); Adamantine uses the
// "mythical" icons (ui_icon_rank_mythical_0{n}.png), which exist in V1 under a different name.
const tiersWithIcon = new Set([
  "Stone",
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Diamond",
])

export function rankIcon(id: RankId): string | null {
  const tier = id.replace(/\d+$/, "")
  if (tier === "Adamantine") {
    const n = id.slice("Adamantine".length) // "1" | "2" | "3"
    return `/snowprint_assets/ranks/ui_icon_rank_mythical_0${n}.png`
  }
  if (!tiersWithIcon.has(tier)) return null
  return `/snowprint_assets/ranks/${id.toLowerCase()}.png`
}
