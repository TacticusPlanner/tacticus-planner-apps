import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { zoneTierId } from "../lib/season"
import type { GuildWarSeason } from "../lib/season"
import type { GuildWar, GuildWarAttack } from "./types"

/** Attacks with a result, and how many of them were won. */
export interface WinRate {
  key: string
  won: number
  decided: number
}

/** The most lineups the totals list. */
const TOP_LINEUPS = 3

function tally(entries: readonly { key: string; attack: GuildWarAttack }[]) {
  const rates = new Map<string, WinRate>()
  for (const { key, attack } of entries) {
    if (attack.result === null) continue
    const rate = rates.get(key) ?? { key, won: 0, decided: 0 }
    rate.decided += 1
    if (attack.result === "won") rate.won += 1
    rates.set(key, rate)
  }
  return rates
}

/**
 * The totals across the loaded wars: the win rate by zone tier (each zone's tier at its war's
 * level, in the season's tier order) and by slot rarity (highest first), counting attacks with a
 * result; and the lineups used most, by their characters.
 */
export function historyTotals(
  wars: readonly GuildWar[],
  seasons: readonly GuildWarSeason[]
): {
  byTier: WinRate[]
  byRarity: (WinRate & { key: Rarity })[]
  lineups: { characterIds: string[]; count: number }[]
} {
  const bySeason = new Map(seasons.map((season) => [season.id, season]))
  const attacks = wars.flatMap((war) =>
    war.attacks.map((attack) => ({ war, attack }))
  )
  const tiers = tally(
    attacks.flatMap(({ war, attack }) => {
      const season = bySeason.get(war.seasonId)
      const tierId = season
        ? zoneTierId(season, war.battlefieldLevel, attack.zoneId)
        : undefined
      return tierId ? [{ key: tierId, attack }] : []
    })
  )
  const tierOrder = [
    ...new Set(
      seasons.flatMap((season) => season.tiers.map((tier) => tier.id))
    ),
  ]
  const rarities = tally(
    attacks.map(({ attack }) => ({ key: attack.rarityCap, attack }))
  )
  const lineupCounts = new Map<
    string,
    { characterIds: string[]; count: number }
  >()
  for (const { attack } of attacks) {
    // The same characters in any order are one lineup, shown as first logged.
    const characterIds = attack.characters.map((unit) => unit.unitId)
    const key = characterIds
      .toSorted((left, right) => left.localeCompare(right))
      .join(",")
    const entry = lineupCounts.get(key) ?? { characterIds, count: 0 }
    entry.count += 1
    lineupCounts.set(key, entry)
  }
  return {
    byTier: tierOrder.flatMap((tier) => {
      const rate = tiers.get(tier)
      return rate ? [rate] : []
    }),
    byRarity: rarityOrder.toReversed().flatMap((rarity) => {
      const rate = rarities.get(rarity)
      return rate ? [{ ...rate, key: rarity }] : []
    }),
    lineups: [...lineupCounts.values()]
      .filter((entry) => entry.count > 1)
      .toSorted((a, b) => b.count - a.count)
      .slice(0, TOP_LINEUPS),
  }
}
