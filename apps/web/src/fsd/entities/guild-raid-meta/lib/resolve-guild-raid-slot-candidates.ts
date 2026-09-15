import type { GuildRaidMatcherSlot } from "./match-guild-raid-candidates"

export type GuildRaidSlotCandidate = {
  characterId: string
  readiness: number
  isIdeal: boolean
  isSelected: boolean
}

/**
 * Every owned candidate for one slot — the ideal hero (when owned) plus every owned id in
 * `replacementCharacterIds`, each carrying its own investment-readiness percentage — not only the one
 * the matcher selected to fill the slot. Lets a flex-slot display compare alternatives at a glance
 * instead of only showing the single auto-picked lineup (the explicit "readiness of other characters"
 * ask). Authored replacement order is preserved; the ideal hero, when owned, is listed first.
 */
export function resolveGuildRaidSlotCandidates(params: {
  slot: GuildRaidMatcherSlot
  ownedCharacterIds: ReadonlySet<string>
  readinessOf: (characterId: string) => number
  selectedCharacterId: string | null
}): GuildRaidSlotCandidate[] {
  const { slot, ownedCharacterIds, readinessOf, selectedCharacterId } = params

  const orderedIds = [slot.heroId, ...slot.replacementCharacterIds]
  const seen = new Set<string>()
  const candidates: GuildRaidSlotCandidate[] = []

  for (const characterId of orderedIds) {
    if (seen.has(characterId) || !ownedCharacterIds.has(characterId)) continue
    seen.add(characterId)
    candidates.push({
      characterId,
      readiness: readinessOf(characterId),
      isIdeal: characterId === slot.heroId,
      isSelected: characterId === selectedCharacterId,
    })
  }

  return candidates
}
