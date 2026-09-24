import type { NpcGroup, NpcRecord, NpcVariation } from "../model/types"
import { npcSlug } from "./npc-slug"

/** A variation whose every stat row is all zeros has no real ladder (decoys, mines, tutorial dummies). */
export function isVariationAvailable(record: NpcRecord): boolean {
  return record.stats.some(
    (row) => row.health !== 0 || row.armour !== 0 || row.damage !== 0
  )
}

/**
 * The base roster entry: every mode suffix (`LHE`, `Surv`, `C1`, …) lengthens the id, so the shortest
 * available id is the least-specialised variation; ties keep served order.
 */
export function defaultVariationId(
  variations: readonly NpcVariation[]
): string {
  let best = variations[0]
  for (const variation of variations) {
    if (variation.id.length < best.id.length) best = variation
  }
  return best.id
}

/**
 * Groups served `npcs` records into listed NPCs: only `kind: "unit"`, only variations with a usable
 * ladder, one group per catalog name (in served order of first appearance), dropping groups with no
 * available variation. Ladders are never merged or reordered here.
 */
export function buildNpcGroups(records: readonly NpcRecord[]): NpcGroup[] {
  const byName = new Map<string, NpcVariation[]>()
  for (const record of records) {
    if (record.kind !== "unit" || !isVariationAvailable(record)) continue
    const bucket = byName.get(record.name)
    if (bucket) bucket.push(record)
    else byName.set(record.name, [record])
  }

  const groups: NpcGroup[] = []
  const seenSlugs = new Set<string>()
  for (const [name, variations] of byName) {
    const id = npcSlug(name)
    if (seenSlugs.has(id)) {
      throw new Error(`NPC group slug collision: "${id}" (${name})`)
    }
    seenSlugs.add(id)
    groups.push({
      id,
      name,
      factionId: variations[0].factionId,
      alliance: variations[0].alliance,
      defaultVariationId: defaultVariationId(variations),
      variations,
    })
  }
  return groups
}
