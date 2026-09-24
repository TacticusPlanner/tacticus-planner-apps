import type { NpcLevelOption, NpcVariation } from "../model/types"

/**
 * Display order for a variation's ladder: rank ascending, then stars ascending, stable on ties so
 * served order is preserved among equal rows. `servedIndex` stays the URL/selection key. Rows that
 * share rank and stars (Survival wave scaling) are flagged so the selector can disambiguate them.
 */
export function orderLevels(variation: NpcVariation): NpcLevelOption[] {
  const keyCounts = new Map<string, number>()
  for (const row of variation.stats) {
    const key = `${row.rank}/${row.stars}`
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
  }

  return variation.stats
    .map((row, servedIndex) => ({
      servedIndex,
      row,
      tie: (keyCounts.get(`${row.rank}/${row.stars}`) ?? 0) > 1,
    }))
    .sort(
      (a, b) =>
        a.row.rank - b.row.rank ||
        a.row.stars - b.row.stars ||
        a.servedIndex - b.servedIndex
    )
}
