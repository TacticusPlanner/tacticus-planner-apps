import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { capRosterUnit, underCap } from "@/entities/team"
import type { TeamRosterUnit } from "@/entities/team"

/** The parts of a unit a rarity cap compares, in the order they are named. */
export type CapPart = "rarity" | "rank" | "level" | "abilities"

/** How a picked unit sits against the defenders' cap, by the Teams page's rules: `over` lists what
 *  the cap brings down (the unit fights weaker than it is), `under` what falls short of the cap. */
export interface CapMarks {
  over: CapPart[]
  under: CapPart[]
}

/**
 * A picked unit against the cap: over when the cap brings anything down (`capRosterUnit`, so a
 * Mythic Khârn with maxed abilities on a Rare slot), under when anything is below the cap's targets
 * (`underCap`, so an Uncommon unit, or one with an ability below the Rare maximum). Null when the
 * unit is not synced or no cap is picked.
 */
export function capMarks(
  unit: TeamRosterUnit | undefined,
  cap: Rarity | undefined
): CapMarks | null {
  if (!unit || !cap) return null
  const capped = capRosterUnit(unit, cap, progressionRarity)
  const over: CapPart[] = []
  if (capped.progression !== unit.progression) over.push("rarity")
  if (capped.rank !== unit.rank) over.push("rank")
  if (capped.xpLevel !== unit.xpLevel) over.push("level")
  if (
    capped.abilityLevels[0] !== unit.abilityLevels[0] ||
    capped.abilityLevels[1] !== unit.abilityLevels[1]
  ) {
    over.push("abilities")
  }
  const short = underCap(unit, cap, progressionRarity)
  const under: CapPart[] = []
  if (short.rarity) under.push("rarity")
  if (short.rank) under.push("rank")
  if (short.level) under.push("level")
  if (short.abilities[0] || short.abilities[1]) under.push("abilities")
  return { over, under }
}
