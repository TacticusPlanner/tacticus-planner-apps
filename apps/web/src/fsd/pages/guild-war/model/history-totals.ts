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

/** A unit or lineup, how often it attacked, and its win rate over the attacks with a result. */
export interface UsageRate extends WinRate {
  count: number
}

/** Most first, then by key, so ties list the same way every time. */
const byCountThenKey = (
  a: { count: number; key: string },
  b: { count: number; key: string }
) => (b.count === a.count ? a.key.localeCompare(b.key) : b.count - a.count)

/** The most rows each "top" list shows. */
const TOP_UNITS = 5

function topUsage(
  entries: readonly { key: string; attack: GuildWarAttack }[]
): UsageRate[] {
  const usage = new Map<string, UsageRate>()
  for (const { key, attack } of entries) {
    const rate = usage.get(key) ?? { key, won: 0, decided: 0, count: 0 }
    rate.count += 1
    if (attack.result !== null) rate.decided += 1
    if (attack.result === "won") rate.won += 1
    usage.set(key, rate)
  }
  return [...usage.values()].toSorted(byCountThenKey)
}

/**
 * The totals across the loaded wars:
 * - `overall`: attacks, won, lost, and lineup units lost
 * - win rate by zone tier (each zone's tier at its war's level, in the season's tier order), by
 *   zone (most attacked first) and by slot rarity (highest first), counting attacks with a result
 * - `characters`: the characters that attacked most, with their win rate
 * - `lineups`: the lineups used more than once, by their characters, with their win rate
 * - `enemies`: the enemy characters met most in lost attacks
 */
export function historyTotals(
  wars: readonly GuildWar[],
  seasons: readonly GuildWarSeason[]
): {
  overall: { attacks: number; won: number; lost: number; unitsLost: number }
  byTier: WinRate[]
  byZone: WinRate[]
  byRarity: (WinRate & { key: Rarity })[]
  characters: UsageRate[]
  lineups: (UsageRate & { characterIds: string[] })[]
  enemies: { key: string; count: number }[]
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
  const zones = topUsage(
    attacks.map(({ attack }) => ({ key: attack.zoneId, attack }))
  )
  const characters = topUsage(
    attacks.flatMap(({ attack }) =>
      attack.characters.map((unit) => ({ key: unit.unitId, attack }))
    )
  )
  // The same characters in any order are one lineup, shown as first logged.
  const firstOrder = new Map<string, string[]>()
  const lineups = topUsage(
    attacks.map(({ attack }) => {
      const characterIds = attack.characters.map((unit) => unit.unitId)
      const key = characterIds
        .toSorted((left, right) => left.localeCompare(right))
        .join(",")
      if (!firstOrder.has(key)) firstOrder.set(key, characterIds)
      return { key, attack }
    })
  )
  const enemies = new Map<string, number>()
  for (const { attack } of attacks) {
    if (attack.result !== "lost") continue
    for (const unit of attack.enemy?.characters ?? []) {
      enemies.set(unit.unitId, (enemies.get(unit.unitId) ?? 0) + 1)
    }
  }
  return {
    overall: {
      attacks: attacks.length,
      won: attacks.filter(({ attack }) => attack.result === "won").length,
      lost: attacks.filter(({ attack }) => attack.result === "lost").length,
      unitsLost: attacks.reduce(
        (sum, { attack }) => sum + (attack.lostUnitIds?.length ?? 0),
        0
      ),
    },
    byTier: tierOrder.flatMap((tier) => {
      const rate = tiers.get(tier)
      return rate ? [rate] : []
    }),
    byZone: zones
      .filter((zone) => zone.decided > 0)
      .map(({ key, won, decided }) => ({ key, won, decided })),
    byRarity: rarityOrder.toReversed().flatMap((rarity) => {
      const rate = rarities.get(rarity)
      return rate ? [{ ...rate, key: rarity }] : []
    }),
    characters: characters.slice(0, TOP_UNITS),
    lineups: lineups
      .filter((entry) => entry.count > 1)
      .slice(0, TOP_LINEUPS)
      .map((entry) => ({
        ...entry,
        characterIds: firstOrder.get(entry.key) ?? [],
      })),
    enemies: [...enemies]
      .map(([key, count]) => ({ key, count }))
      .toSorted(byCountThenKey)
      .slice(0, TOP_UNITS),
  }
}
