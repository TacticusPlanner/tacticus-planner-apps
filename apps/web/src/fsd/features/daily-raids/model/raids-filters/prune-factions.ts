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
