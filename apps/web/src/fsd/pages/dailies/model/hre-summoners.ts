import type { UnitId } from "@workspace/game-domain"

// A `<style="Summon">` span, which may wrap a faction-coloured name.
const SUMMON_SPAN = String.raw`<style="Summon">(?:<style=[^>]*>)?[^<]*(?:</style>)?</style>`

// The ability brings a unit onto the battlefield: "Summons a <Summon>…", "Calls in a <Summon>…",
// or "<Summon>…</style> is summoned / appears". Abilities that only buff, move or target existing
// summons name the span without one of these verbs.
const SUMMON_PATTERNS = [
  /\bsummons?\b[^.]{0,60}?<style="Summon">/i,
  new RegExp(`${SUMMON_SPAN}\\s+(?:is summoned|appears)`, "i"),
  /\bcalls in an? <style="Summon">/i,
]

/** Whether an ability's English rules text summons a unit (design D8). */
export function abilitySummons(description: string): boolean {
  return SUMMON_PATTERNS.some((pattern) => pattern.test(description))
}

/** The characters with an active or passive ability that summons a unit. */
export function buildSummonerIds(
  characters: Iterable<{
    id: UnitId
    activeAbilityNames: readonly string[]
    passiveAbilityNames: readonly string[]
  }>,
  descriptionOf: (abilityId: string) => string | undefined
): Set<UnitId> {
  const summoners = new Set<UnitId>()
  for (const character of characters) {
    const abilities = [
      ...character.activeAbilityNames,
      ...character.passiveAbilityNames,
    ]
    if (abilities.some((id) => abilitySummons(descriptionOf(id) ?? ""))) {
      summoners.add(character.id)
    }
  }
  return summoners
}
