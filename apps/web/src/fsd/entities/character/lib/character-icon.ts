import characterIcons from "../model/character-icons.json"

// characterId → round-portrait asset path, generated from the catalog source data
// (scripts/generate-game-data.mjs). Characters without a mapped asset return undefined.
const icons = characterIcons as Record<string, string>

export function characterIcon(id: string): string | undefined {
  return icons[id]
}
