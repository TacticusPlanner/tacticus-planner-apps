export type GuildRaidTeamReadinessSlot = {
  readiness: number
  essential: boolean
}

// Weights are a display-layer constant, not authored data — adjustable later without a schema change.
// See design.md's "Team score weights essential slots higher than flex" decision.
const essentialWeight = 2
const flexWeight = 1

/**
 * Combines the five hero-slot percentages and the Machine-of-War percentage into one team readiness
 * percentage (0-100, rounded): a plain weighted average, essential hero slots weighted twice a flex
 * slot or the Machine of War.
 */
export function resolveGuildRaidTeamReadiness(
  heroSlots: readonly GuildRaidTeamReadinessSlot[],
  mowReadiness: number
): number {
  const slots: GuildRaidTeamReadinessSlot[] = [
    ...heroSlots,
    { readiness: mowReadiness, essential: false },
  ]

  let weightedSum = 0
  let totalWeight = 0
  for (const slot of slots) {
    const weight = slot.essential ? essentialWeight : flexWeight
    weightedSum += slot.readiness * weight
    totalWeight += weight
  }

  return totalWeight === 0 ? 0 : Math.round(weightedSum / totalWeight)
}
