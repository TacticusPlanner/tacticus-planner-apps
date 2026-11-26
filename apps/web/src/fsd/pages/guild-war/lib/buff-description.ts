import type { Rarity } from "@workspace/game-domain"

import type { GuildWarSeason } from "./season"

const SLOT = /\{\[(\w+)\]\}/g

/** The values of a number the game ships for every ability level, as one figure ("20") or, when
 *  they differ, their range ("10–80"): which level a war applies is not in the game data. */
function figure(values: readonly number[] | undefined): string | undefined {
  if (!values || values.length === 0) return undefined
  const low = Math.min(...values)
  const high = Math.max(...values)
  return low === high ? String(low) : `${low}–${high}`
}

/**
 * A buff's description with its `{[variable]}` slots filled from the season's buff abilities: the
 * ability for the defenders' rarity when the game keys them by rarity, else its only one. A slot
 * the season gives no value for reads "?". Undefined without a description.
 */
export function fillBuffDescription(
  template: string | undefined,
  season: GuildWarSeason | undefined,
  buffId: string,
  rarity: Rarity | undefined
): string | undefined {
  if (!template) return undefined
  const abilities =
    season?.buffs.find((buff) => buff.id === buffId)?.abilities ?? []
  const ability =
    abilities.find((entry) => entry.rarity === rarity) ??
    abilities.find((entry) => entry.rarity === null) ??
    abilities[0]
  return template.replaceAll(
    SLOT,
    (_, name: string) => figure(ability?.variables[name]) ?? "?"
  )
}
