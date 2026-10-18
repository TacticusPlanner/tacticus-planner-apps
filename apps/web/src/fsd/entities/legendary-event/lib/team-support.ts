/** A unit's traits as the support rule reads them. */
export interface SupportCandidate {
  id: string
  traits: readonly string[]
}

const HEALER = "Healer"
const MECHANIC = "Mechanic"
const MECHANICAL = "Mechanical"

const has = (unit: SupportCandidate, trait: string) =>
  unit.traits.includes(trait)

/** Whether `team` holds a support of `trait` with another member it can treat: a Healer heals a
 *  non-Mechanical ally, a Mechanic repairs a Mechanical one. */
function hasUsefulSupport(
  team: readonly SupportCandidate[],
  trait: typeof HEALER | typeof MECHANIC
): boolean {
  const treats = (ally: SupportCandidate) =>
    trait === HEALER ? !has(ally, MECHANICAL) : has(ally, MECHANICAL)
  return team.some(
    (support) =>
      has(support, trait) &&
      team.some((ally) => ally !== support && treats(ally))
  )
}

function swapInSupport(
  team: readonly SupportCandidate[],
  candidates: readonly SupportCandidate[],
  trait: typeof HEALER | typeof MECHANIC
): SupportCandidate[] {
  if (hasUsefulSupport(team, trait)) return [...team]
  const support = candidates.find(
    (candidate) => has(candidate, trait) && !team.includes(candidate)
  )
  const replaced = team.findLastIndex(
    (member) => !has(member, HEALER) && !has(member, MECHANIC)
  )
  if (!support || replaced === -1) return [...team]
  const swapped = team.filter((_, index) => index !== replaced)
  swapped.push(support)
  // Members stay in candidate order.
  swapped.sort((a, b) => candidates.indexOf(a) - candidates.indexOf(b))
  return hasUsefulSupport(swapped, trait) ? swapped : [...team]
}

/**
 * The support step of team suggestions (spec: team suggestions per lane): a full team without a
 * useful Healer takes the first candidate outside it with the Healer trait in place of its last
 * member that is neither Healer nor Mechanic, when that gives it a useful Healer; then the same
 * for a Mechanic. `candidates` is the subset's candidates in order and `team` their first five; a
 * shorter team already holds every candidate.
 */
export function withSupport<T extends SupportCandidate>(
  team: readonly T[],
  candidates: readonly T[],
  teamSize: number
): T[] {
  if (team.length < teamSize) return [...team]
  const healed = swapInSupport(team, candidates, HEALER)
  return swapInSupport(healed, candidates, MECHANIC) as T[]
}
