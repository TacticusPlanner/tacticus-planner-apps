/** Keeps only the selected factions that still belong to one of the selected alliances. */
export function pruneFactions(
  factions: readonly string[],
  alliances: readonly string[],
  factionAlliance: ReadonlyMap<string, string>
): string[] {
  if (alliances.length === 0 || factionAlliance.size === 0) return [...factions]
  return factions.filter((faction) =>
    alliances.includes(factionAlliance.get(faction) ?? "")
  )
}

/** Each faction's alliance, from the catalog's `factions`; a module-level selector. */
export function toFactionAlliance(
  factions: readonly { id: string; alliance: string }[]
): Map<string, string> {
  return new Map(factions.map((faction) => [faction.id, faction.alliance]))
}
