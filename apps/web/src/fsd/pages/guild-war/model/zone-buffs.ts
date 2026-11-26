import type { GuildWarSeason } from "../lib/season"

type SeasonBuff = GuildWarSeason["buffs"][number]

/** The buff a zone gives its own defenders; null for a zone with none (or none picked). */
export function zoneOwnBuff(
  season: GuildWarSeason | undefined,
  zoneId: string | null
): string | null {
  return season?.zones.find((zone) => zone.id === zoneId)?.buffId ?? null
}

/**
 * The buffs that can be active in a zone: its own, and every Global or Regional buff another zone
 * of the season gives (zones can be moved, so which neighbours reach it is not known). A Local buff
 * of another zone (Fortified, when attacking a Trench) and a buff no zone gives this season are left
 * out, so are copies of one name. Buffs already ticked stay, so an older attack keeps its own.
 * With no zone picked, every buff a zone gives.
 */
export function zoneBuffOptions(
  season: GuildWarSeason | undefined,
  zoneId: string | null,
  ticked: readonly string[]
): SeasonBuff[] {
  if (!season) return []
  const own = zoneOwnBuff(season, zoneId)
  const given = new Set(
    season.zones.flatMap((zone) => (zone.buffId ? [zone.buffId] : []))
  )
  return season.buffs.filter(
    (buff) =>
      buff.id === own ||
      ticked.includes(buff.id) ||
      (given.has(buff.id) && (zoneId === null || buff.scope !== "Local"))
  )
}
