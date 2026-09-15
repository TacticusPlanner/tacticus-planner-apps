export type GuildRaidMatcherSlot = {
  heroId: string
  essential: boolean
  replacementCharacterIds: readonly string[]
}

export type GuildRaidMatcherAssignment = {
  /** The character id filling this slot — the ideal hero when `isIdeal`, otherwise one of the slot's
   * authored `replacementCharacterIds`. */
  characterId: string
  isIdeal: boolean
}

export type GuildRaidMatcherResult = {
  /** One entry per input slot, in the same order; `null` when no owned candidate fills that slot. */
  assignments: (GuildRaidMatcherAssignment | null)[]
}

type SearchOutcome = {
  assignment: ReadonlyMap<number, string>
  essentialFilled: number
  totalFilled: number
  readinessSum: number
}

function isBetter(candidate: SearchOutcome, best: SearchOutcome): boolean {
  if (candidate.essentialFilled !== best.essentialFilled) {
    return candidate.essentialFilled > best.essentialFilled
  }
  if (candidate.totalFilled !== best.totalFilled) {
    return candidate.totalFilled > best.totalFilled
  }
  return candidate.readinessSum > best.readinessSum
}

/**
 * Bounded constrained-assignment search over a recommendation's open (ideal-hero-unowned) slots: tries
 * every combination of assigning an owned, not-yet-used candidate from each open slot's explicit
 * `replacementCharacterIds` (or leaving it unfilled), maximizing filled essential slots first, then
 * total filled slots, then — the one signal ported differently from the removed
 * `add-dailies-guild-raid-playable-variants` design — the sum of investment-readiness percentage
 * instead of raw combat power. Exhaustive rather than greedy: a greedy single pass could hand a shared
 * candidate to whichever slot it visits first, even when reserving that candidate for an essential slot
 * would fill strictly more essential slots overall.
 */
function search(
  openSlots: readonly { index: number; slot: GuildRaidMatcherSlot }[],
  ownedCharacterIds: ReadonlySet<string>,
  readinessOf: (characterId: string) => number
): SearchOutcome {
  let best: SearchOutcome = {
    assignment: new Map(),
    essentialFilled: 0,
    totalFilled: 0,
    readinessSum: 0,
  }

  function backtrack(
    position: number,
    used: ReadonlySet<string>,
    assignment: ReadonlyMap<number, string>,
    essentialFilled: number,
    totalFilled: number,
    readinessSum: number
  ) {
    if (position === openSlots.length) {
      const outcome: SearchOutcome = {
        assignment,
        essentialFilled,
        totalFilled,
        readinessSum,
      }
      if (isBetter(outcome, best)) best = outcome
      return
    }

    const { index, slot } = openSlots[position]!

    // Leave this slot unfilled.
    backtrack(
      position + 1,
      used,
      assignment,
      essentialFilled,
      totalFilled,
      readinessSum
    )

    // Try every owned, not-yet-used explicit replacement, in authored order.
    for (const candidateId of slot.replacementCharacterIds) {
      if (!ownedCharacterIds.has(candidateId) || used.has(candidateId)) continue

      backtrack(
        position + 1,
        new Set(used).add(candidateId),
        new Map(assignment).set(index, candidateId),
        essentialFilled + (slot.essential ? 1 : 0),
        totalFilled + 1,
        readinessSum + readinessOf(candidateId)
      )
    }
  }

  backtrack(0, new Set(), new Map(), 0, 0, 0)
  return best
}

/**
 * Fills a recommendation's slots from the owned roster: a slot whose ideal hero is owned is locked to
 * that hero (never renegotiated away to free up a candidate elsewhere); every other slot is filled, if
 * possible, from its own explicit `replacementCharacterIds` by the constrained search above. Comp
 * membership is never consulted — only the authored replacement list.
 */
export function matchGuildRaidCandidates(params: {
  slots: readonly GuildRaidMatcherSlot[]
  ownedCharacterIds: ReadonlySet<string>
  readinessOf: (characterId: string) => number
}): GuildRaidMatcherResult {
  const { slots, ownedCharacterIds, readinessOf } = params

  const assignments: (GuildRaidMatcherAssignment | null)[] = slots.map(
    () => null
  )
  const openSlots: { index: number; slot: GuildRaidMatcherSlot }[] = []

  slots.forEach((slot, index) => {
    if (ownedCharacterIds.has(slot.heroId)) {
      assignments[index] = { characterId: slot.heroId, isIdeal: true }
    } else {
      openSlots.push({ index, slot })
    }
  })

  const outcome = search(openSlots, ownedCharacterIds, readinessOf)
  for (const [index, characterId] of outcome.assignment) {
    assignments[index] = { characterId, isIdeal: false }
  }

  return { assignments }
}
