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
  trait: typeof HEALER | typeof MECHANIC,
  canSupport: (candidate: SupportCandidate) => boolean
): SupportCandidate[] {
  if (hasUsefulSupport(team, trait)) return [...team]
  const support = candidates.find(
    (candidate) =>
      has(candidate, trait) &&
      !team.includes(candidate) &&
      canSupport(candidate)
  )
  if (!support) return [...team]
  const other = trait === HEALER ? MECHANIC : HEALER
  const keepOther = hasUsefulSupport(team, other)
  // The last member that is neither Healer nor Mechanic goes first; an earlier one is tried when
  // that swap would leave no one to treat for the new support or for the support already there.
  for (let replaced = team.length - 1; replaced >= 0; replaced--) {
    const member = team[replaced]!
    if (has(member, HEALER) || has(member, MECHANIC)) continue
    const swapped = team.filter((_, index) => index !== replaced)
    swapped.push(support)
    // Members stay in candidate order.
    swapped.sort((a, b) => candidates.indexOf(a) - candidates.indexOf(b))
    if (
      hasUsefulSupport(swapped, trait) &&
      (!keepOther || hasUsefulSupport(swapped, other))
    )
      return swapped
  }
  return [...team]
}

/**
 * The support step of team suggestions (spec: team suggestions per lane): a full team without a
 * useful Healer takes the first candidate outside it with the Healer trait in place of its last
 * member that is neither Healer nor Mechanic, when that gives it a useful Healer and keeps a
 * useful Mechanic it had (else an earlier such member, else no swap); then the same for a
 * Mechanic. `candidates` is the subset's candidates in order and `team` their first five; a
 * shorter team already holds every candidate. Only a candidate passing `canSupport` (the
 * suggestions pass "the player holds it") is swapped in.
 */
export function withSupport<T extends SupportCandidate>(
  team: readonly T[],
  candidates: readonly T[],
  teamSize: number,
  canSupport: (candidate: T) => boolean = () => true
): T[] {
  if (team.length < teamSize) return [...team]
  const allowed = canSupport as (candidate: SupportCandidate) => boolean
  const healed = swapInSupport(team, candidates, HEALER, allowed)
  return swapInSupport(healed, candidates, MECHANIC, allowed) as T[]
}
