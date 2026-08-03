import { useMemo, useState } from "react"

import {
  firstRank,
  lastRank,
  rankAt,
  rankIndex,
  rankOrder,
  type Rank,
} from "@workspace/game-domain"

import {
  additionalTargetOptions,
  type RankAdditionalTarget,
} from "@/features/goal-farming"

/**
 * The Rank goal's own target-range state — a read-only start rank (always the unit's live synced
 * rank, set only via `prefillFrom` — never user-editable), the target rank, the target rank's
 * "Additional target" (V1's Point Five / Mythic-tier partial-upgrade selection, see
 * rank-additional-target.ts), and the option lists each select offers. Split out of
 * `use-create-goal-form.ts` purely for that file's own max-lines budget.
 */
export function useRankFields() {
  const [rankStart, setRankStart] = useState<Rank>(firstRank)
  const [rankEnd, setRankEndState] = useState<Rank>(rankAt(1))
  const [rankAdditionalTarget, setRankAdditionalTarget] =
    useState<RankAdditionalTarget>("None")

  const rankEndOptions = useMemo(() => {
    const options = rankOrder.filter((r) => rankIndex(r) > rankIndex(rankStart))
    return options.length > 0 ? options : [rankStart]
  }, [rankStart])
  const additionalTargetChoices = useMemo(
    () => additionalTargetOptions(rankEnd),
    [rankEnd]
  )

  // Changing the target rank can invalidate the selected Additional target (e.g. moving off a
  // Mythic-tier rank drops its numbered partial options) — reset to None rather than leave a
  // selection the new rank doesn't actually offer.
  const setRankEnd = (rank: Rank) => {
    setRankEndState(rank)
    setRankAdditionalTarget("None")
  }

  const reset = () => {
    setRankStart(firstRank)
    setRankEndState(rankAt(1))
    setRankAdditionalTarget("None")
  }

  // Applies the synced current-rank prefill once per entity selection — called from the parent's
  // single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render. Uses
  // functional no-op updaters when `rank` is undefined (a Mow) so the caller can call this
  // unconditionally, matching that effect's own set-state-in-effect lint idiom. `rankStart` is
  // never otherwise settable — the "From" field always reflects this synced value.
  const prefillFrom = (rank: Rank | undefined) => {
    setRankStart((current) => rank ?? current)
    setRankEndState((current) => {
      if (!rank) return current
      return rankIndex(current) > rankIndex(rank)
        ? current
        : rankAt(Math.min(rankIndex(rank) + 1, rankIndex(lastRank)))
    })
    setRankAdditionalTarget("None")
  }

  return {
    state: {
      rankStart,
      rankEnd,
      setRankEnd,
      rankEndOptions,
      rankAdditionalTarget,
      setRankAdditionalTarget,
      additionalTargetChoices,
    },
    reset,
    prefillFrom,
  }
}
