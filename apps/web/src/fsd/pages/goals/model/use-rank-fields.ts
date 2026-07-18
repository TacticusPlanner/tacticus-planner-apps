import { useMemo, useState } from "react"

import {
  firstRank,
  lastRank,
  rankAt,
  rankIndex,
  rankOrder,
  type Rank,
} from "@workspace/game-domain"

/**
 * The Rank goal's own target-range state — start/end rank, the "point five" (half-step) toggles
 * at each end, and the option lists each select offers (start options are bounded below by the
 * unit's actual current rank; end options must exceed start). Split out of `use-create-goal-form.ts`
 * purely for that file's own max-lines budget. `currentRank` is the unit's live synced rank
 * (`playerCharacter?.rank`) — undefined for a Mow (no rank ladder) or an unowned/locked character.
 */
export function useRankFields(currentRank: Rank | undefined) {
  const [rankStart, setRankStart] = useState<Rank>(firstRank)
  const [rankEnd, setRankEnd] = useState<Rank>(rankAt(1))
  const [rankStartPointFive, setRankStartPointFive] = useState(false)
  const [rankEndPointFive, setRankEndPointFive] = useState(false)

  const rankEndOptions = useMemo(() => {
    const options = rankOrder.filter((r) => rankIndex(r) > rankIndex(rankStart))
    return options.length > 0 ? options : [rankStart]
  }, [rankStart])
  const rankStartOptions = useMemo(
    () =>
      rankOrder.filter(
        (rank) => rankIndex(rank) >= rankIndex(currentRank ?? rankStart)
      ),
    [currentRank, rankStart]
  )

  const reset = () => {
    setRankStart(firstRank)
    setRankEnd(rankAt(1))
    setRankStartPointFive(false)
    setRankEndPointFive(false)
  }

  // Applies the synced current-rank prefill once per entity selection — called from the parent's
  // single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render. Uses
  // functional no-op updaters when `rank` is undefined (a Mow) so the caller can call this
  // unconditionally, matching that effect's own set-state-in-effect lint idiom.
  const prefillFrom = (rank: Rank | undefined) => {
    setRankStart((current) => rank ?? current)
    setRankEnd((current) => {
      if (!rank) return current
      return rankIndex(current) > rankIndex(rank)
        ? current
        : rankAt(Math.min(rankIndex(rank) + 1, rankIndex(lastRank)))
    })
  }

  return {
    state: {
      rankStart,
      setRankStart,
      rankEnd,
      setRankEnd,
      rankEndOptions,
      rankStartOptions,
      rankStartPointFive,
      setRankStartPointFive,
      rankEndPointFive,
      setRankEndPointFive,
    },
    reset,
    prefillFrom,
  }
}
