import { useState } from "react"
import { useSearchParams } from "react-router"
import {
  lastRank,
  firstProgression,
  firstRank,
  isAdamantineRank,
  isProgression,
  isRank,
  maxRankForProgression,
  minProgressionForRank,
  progressionIndex,
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

// Adamantine3 is planned but currently absent from the ladder entirely (see lastRank's own comment
// in @workspace/game-catalog) — clamp any rank entering this page's selection (a shared URL, a
// prefill from synced player data, or a range change) down to lastRank. Currently a no-op (nothing
// typed as Rank can exceed lastRank while Adamantine3 is absent from the ladder), kept so this file
// needs no changes once Adamantine3 ships and could again exceed the reachable ceiling.
const clampToCurrentMax = (rank: Rank): Rank =>
  rankIndex(rank) > rankIndex(lastRank) ? lastRank : rank

function selectionFromParams(params: URLSearchParams): LookupSelection {
  const start = params.get("rankStart")
  const end = params.get("rankEnd")
  const progressionStart = params.get("progressionStart")
  const progressionEnd = params.get("progressionEnd")
  return {
    characterId: params.get("character") ?? undefined,
    rankStart: clampToCurrentMax(start && isRank(start) ? start : firstRank),
    rankEnd: clampToCurrentMax(end && isRank(end) ? end : rankAt(1)),
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
  // `prefill` lets a caller seed the "from" rank/progression from the player's synced roster data
  // instead of the firstRank/firstProgression defaults (see character-lookup-page.tsx); it is only
  // ever supplied when that data is actually available, so behavior is unchanged otherwise.
  const setDraftCharacterId = (
    id: string,
    prefill?: { rankStart: Rank; progressionStart: Progression }
  ) => {
    const next: LookupSelection = { ...draft, characterId: id }

    if (prefill) {
      next.rankStart = clampToCurrentMax(prefill.rankStart)
      next.progressionStart = prefill.progressionStart
      // A prefilled "from" can exceed the range's current "to" (e.g. a highly-ranked unit selected
      // while the range still sits at its firstRank/firstProgression default) — bump "to" up to
      // match so start <= end always holds, the same invariant setDraftRange/
      // setDraftProgressionRange maintain below.
      if (rankIndex(next.rankEnd) < rankIndex(next.rankStart)) {
        next.rankEnd = next.rankStart
      }
      if (
        progressionIndex(next.progressionEnd) <
        progressionIndex(next.progressionStart)
      ) {
        next.progressionEnd = next.progressionStart
      }
    }

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
    setDraft((prev) => {
      const clampedStart = clampToCurrentMax(start)
      const clampedEnd = clampToCurrentMax(end)

      // When only the "from" rank actually changed — the "to" value passed in still matches what it
      // was before (the mobile "From" select always passes the current "to" unchanged; dragging just
      // the slider's start thumb likewise leaves "to" as-is) — auto-advance "to" to "from" + 1 instead
      // of leaving it wherever it was. Clamp at the practical ceiling: if "from" is already there,
      // there's no valid "one rank up" left, so "to" just stays put (collapsing to a single rank).
      const onlyStartChanged =
        clampedStart !== prev.rankStart && clampedEnd === prev.rankEnd
      const nextEnd = onlyStartChanged
        ? rankAt(Math.min(rankIndex(clampedStart) + 1, rankIndex(lastRank)))
        : clampedEnd

      return {
        ...prev,
        rankStart: clampedStart,
        rankEnd: nextEnd,
        progressionStart: bumpProgressionForRank(
          prev.progressionStart,
          clampedStart
        ),
        progressionEnd: bumpProgressionForRank(prev.progressionEnd, nextEnd),
        // Adamantine ranks have no point-five step.
        pointFive: isAdamantineRank(nextEnd) ? false : prev.pointFive,
      }
    })

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
