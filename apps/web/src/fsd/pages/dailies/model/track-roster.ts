import type { Alliance, UnitId } from "@workspace/game-domain"

import { characterDamageTypes } from "@/shared/lib"

import type {
  SalvageRosterCatalog,
  SalvageTrack,
} from "./salvage-recommendations.types"

type TrackCatalogEntry = Parameters<typeof characterDamageTypes>[0] & {
  traits?: readonly string[] | null
  alliance: Alliance
}

/**
 * The owned characters of the selected track's alliance, plus the catalog map (traits / damage
 * types / alliance) and the trait / damage-type unions the preference controls offer — all
 * computed over the track roster only, so a control never offers a value the track cannot field.
 * Shared by the Salvage Run and Onslaught pages.
 */
export function buildTrackRoster<R extends { unitId: string }>(
  roster: readonly R[] | undefined,
  catalog: ReadonlyMap<string, TrackCatalogEntry> | undefined,
  track: SalvageTrack
): {
  trackRoster: R[]
  rosterCatalog: SalvageRosterCatalog
  availableTraits: string[]
  availableDamageTypes: string[]
} {
  const map = new Map<
    UnitId,
    SalvageRosterCatalog extends ReadonlyMap<UnitId, infer V> ? V : never
  >()
  const traits = new Set<string>()
  const damageTypes = new Set<string>()
  const inTrack: R[] = []
  for (const character of roster && catalog ? roster : []) {
    const view = catalog?.get(character.unitId)
    if (!view) continue
    const characterTraits = view.traits ?? []
    const characterDamage = characterDamageTypes(view)
    map.set(character.unitId as UnitId, {
      traits: characterTraits,
      damageTypes: characterDamage,
      alliance: view.alliance,
    })
    if (view.alliance !== track) continue
    inTrack.push(character)
    for (const trait of characterTraits) traits.add(trait)
    for (const damage of characterDamage) damageTypes.add(damage)
  }
  return {
    trackRoster: inTrack,
    rosterCatalog: map,
    availableTraits: [...traits].sort(),
    availableDamageTypes: [...damageTypes].sort(),
  }
}
