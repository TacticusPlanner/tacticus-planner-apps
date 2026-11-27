type Pool = { available: number; needed: number }

/** One available/needed figure for several rarities of the same material. A rarity counts at most
 *  what it needs: a surplus of Common badges can't stand in for missing Legendary ones, so summing
 *  raw availability would read as "covered" when it isn't. */
export function sumPools(parts: readonly { pool?: Pool }[]): Pool {
  let available = 0
  let needed = 0
  for (const { pool } of parts) {
    if (!pool) continue
    available += Math.min(pool.available, pool.needed)
    needed += pool.needed
  }
  return { available, needed }
}
