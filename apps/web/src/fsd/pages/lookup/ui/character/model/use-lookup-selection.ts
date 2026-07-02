import { useState } from "react"
import { useSearchParams } from "react-router"
import {
  firstProgression,
  firstRank,
  isAdamantineRank,
  isProgression,
  isRank,
  maxRankForProgression,
  minProgressionForRank,
  rankAt,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-catalog"

export interface LookupSelection {
  characterId?: string
  rankStart: Rank
  rankEnd: Rank
  progressionStart: Progression
  progressionEnd: Progression
  pointFive: boolean
}

function selectionFromParams(params: URLSearchParams): LookupSelection {
  const start = params.get("rankStart")
  const end = params.get("rankEnd")
  const progressionStart = params.get("progressionStart")
  const progressionEnd = params.get("progressionEnd")
  return {
    characterId: params.get("character") ?? undefined,
    rankStart: start && isRank(start) ? start : firstRank,
    rankEnd: end && isRank(end) ? end : rankAt(1),
    progressionStart:
      progressionStart && isProgression(progressionStart)
        ? progressionStart
        : firstProgression,
    progressionEnd:
      progressionEnd && isProgression(progressionEnd)
        ? progressionEnd
        : firstProgression,
    pointFive: params.get("pointFive") === "true",
  }
}

/**
 * Owns the Character Lookup page's URL-synced selection: the character id, rank range,
 * progression range, and point-five toggle. Exposes a `draft`/`applied` split — `draft` mirrors
 * what the controls show; `applied` drives computation and only updates on `handleApply` (or
 * immediately on character change, since that's the page's primary action). This keeps dragging
 * the rank slider from recomputing + re-rendering the whole results tree on every intermediate
 * value.
 */
export function useLookupSelection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [applied, setApplied] = useState<LookupSelection>(() =>
    selectionFromParams(searchParams)
  )
  const [draft, setDraft] = useState<LookupSelection>(applied)

  const commitSelection = (selection: LookupSelection) => {
    setApplied(selection)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (selection.characterId) next.set("character", selection.characterId)
        else next.delete("character")
        next.set("rankStart", selection.rankStart)
        next.set("rankEnd", selection.rankEnd)
        next.set("progressionStart", selection.progressionStart)
        next.set("progressionEnd", selection.progressionEnd)
        next.set("pointFive", String(selection.pointFive))
        return next
      },
      { replace: true }
    )
  }

  // Picking a character is the primary action on this page, so it commits immediately instead of
  // waiting on Apply — Apply stays reserved for the rank range/progression/point-five tweaks.
  const setDraftCharacterId = (id: string) => {
    const next = { ...draft, characterId: id }
    setDraft(next)
    commitSelection(next)
  }

  // A character can only be ranked up as far as its rarity/stars allow (see
  // `maxRankForProgression`), so the rank and progression ranges keep each other in bounds:
  // picking a rank raises progression to the minimum that unlocks it, and lowering progression
  // pulls the rank back down to what it now allows.
  const bumpProgressionForRank = (
    progression: Progression,
    rank: Rank
  ): Progression =>
    rankIndex(maxRankForProgression(progression)) < rankIndex(rank)
      ? minProgressionForRank(rank)
      : progression

  const clampRankForProgression = (
    rank: Rank,
    progression: Progression
  ): Rank => {
    const maxRank = maxRankForProgression(progression)
    return rankIndex(rank) > rankIndex(maxRank) ? maxRank : rank
  }

  const setDraftRange = (start: Rank, end: Rank) =>
    setDraft((prev) => ({
      ...prev,
      rankStart: start,
      rankEnd: end,
      progressionStart: bumpProgressionForRank(prev.progressionStart, start),
      progressionEnd: bumpProgressionForRank(prev.progressionEnd, end),
      // Adamantine ranks have no point-five step.
      pointFive: isAdamantineRank(end) ? false : prev.pointFive,
    }))

  const setDraftProgressionRange = (start: Progression, end: Progression) =>
    setDraft((prev) => {
      const rankEnd = clampRankForProgression(prev.rankEnd, end)
      // Clamping rankEnd down for a lowered "to" progression can leave rankStart above it —
      // pull rankStart down to match so the range selects keep start <= end.
      const rankStart = rankAt(
        Math.min(
          rankIndex(clampRankForProgression(prev.rankStart, start)),
          rankIndex(rankEnd)
        )
      )
      return {
        ...prev,
        progressionStart: start,
        progressionEnd: end,
        rankStart,
        rankEnd,
      }
    })

  const setDraftPointFive = (value: boolean) =>
    setDraft((prev) => ({ ...prev, pointFive: value }))

  const isDirty =
    draft.characterId !== applied.characterId ||
    draft.rankStart !== applied.rankStart ||
    draft.rankEnd !== applied.rankEnd ||
    draft.progressionStart !== applied.progressionStart ||
    draft.progressionEnd !== applied.progressionEnd ||
    draft.pointFive !== applied.pointFive

  const handleApply = () => commitSelection(draft)

  return {
    applied,
    draft,
    isDirty,
    setDraftCharacterId,
    setDraftRange,
    setDraftProgressionRange,
    setDraftPointFive,
    handleApply,
  }
}
