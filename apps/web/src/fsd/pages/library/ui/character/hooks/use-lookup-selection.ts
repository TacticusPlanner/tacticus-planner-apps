import { useState } from "react"
import { useSearchParams } from "react-router"
import {
  lastRank,
  firstProgression,
  firstRank,
  isAdamantineRank,
  isProgression,
  isRank,
  lastProgression,
  maxRankForProgression,
  minProgressionForRank,
  progressionAt,
  progressionIndex,
  rankAt,
  rankIndex,
  type Progression,
  type Rank,
  unitIdSchema,
  type UnitId,
} from "@workspace/game-domain"

export interface LookupSelection {
  characterId?: UnitId
  rankStart: Rank
  rankEnd: Rank
  progressionStart: Progression
  progressionEnd: Progression
  pointFive: boolean
}

type RangeAuthority = "generated" | "url" | "user"

type RangeSelection = Pick<
  LookupSelection,
  "rankStart" | "rankEnd" | "progressionStart" | "progressionEnd"
>

// Adamantine3 is planned but currently absent from the ladder entirely (see lastRank's own comment
// in @workspace/game-catalog) — clamp any rank entering this page's selection (a shared URL, a
// prefill from synced player data, or a range change) down to lastRank. Currently a no-op (nothing
// typed as Rank can exceed lastRank while Adamantine3 is absent from the ladder), kept so this file
// needs no changes once Adamantine3 ships and could again exceed the reachable ceiling.
const clampToCurrentMax = (rank: Rank): Rank =>
  rankIndex(rank) > rankIndex(lastRank) ? lastRank : rank

/**
 * Builds a meaningful lookup interval from a character's current state. The
 * rank and progression ends are calculated together so the target rank is
 * always attainable at the target progression.
 */
function deriveLookupRange(
  sourceRank: Rank,
  sourceProgression: Progression
): RangeSelection {
  const rankEnd = clampToCurrentMax(sourceRank)
  const rankStart =
    rankEnd === lastRank ? rankAt(rankIndex(lastRank) - 1) : rankEnd
  const nextRank =
    rankEnd === lastRank ? lastRank : rankAt(rankIndex(rankEnd) + 1)

  const progressionEnd =
    sourceProgression === lastProgression
      ? lastProgression
      : progressionAt(
          Math.max(
            progressionIndex(sourceProgression) + 1,
            progressionIndex(minProgressionForRank(nextRank))
          )
        )
  const progressionStart =
    progressionEnd === lastProgression && sourceProgression === lastProgression
      ? progressionAt(progressionIndex(lastProgression) - 1)
      : sourceProgression

  return {
    rankStart,
    rankEnd: nextRank,
    progressionStart,
    progressionEnd,
  }
}

function hasCompleteValidRange(params: URLSearchParams): boolean {
  const rankStart = params.get("rankStart")
  const rankEnd = params.get("rankEnd")
  const progressionStart = params.get("progressionStart")
  const progressionEnd = params.get("progressionEnd")

  return (
    !!rankStart &&
    !!rankEnd &&
    !!progressionStart &&
    !!progressionEnd &&
    isRank(rankStart) &&
    isRank(rankEnd) &&
    isProgression(progressionStart) &&
    isProgression(progressionEnd) &&
    rankIndex(rankStart) < rankIndex(rankEnd) &&
    progressionIndex(progressionStart) <= progressionIndex(progressionEnd) &&
    rankIndex(maxRankForProgression(progressionStart)) >=
      rankIndex(rankStart) &&
    rankIndex(maxRankForProgression(progressionEnd)) >= rankIndex(rankEnd)
  )
}

function selectionFromParams(
  params: URLSearchParams,
  characterId?: string
): { selection: LookupSelection; rangeAuthority: RangeAuthority } {
  const rankStart = params.get("rankStart")
  const progressionStart = params.get("progressionStart")
  const defaultRange = deriveLookupRange(
    clampToCurrentMax(rankStart && isRank(rankStart) ? rankStart : firstRank),
    progressionStart && isProgression(progressionStart)
      ? progressionStart
      : firstProgression
  )
  const rangeAuthority: RangeAuthority = hasCompleteValidRange(params)
    ? "url"
    : "generated"

  return {
    selection: {
      characterId: unitIdSchema.safeParse(characterId).data,
      ...(rangeAuthority === "url"
        ? {
            rankStart: clampToCurrentMax(params.get("rankStart") as Rank),
            rankEnd: clampToCurrentMax(params.get("rankEnd") as Rank),
            progressionStart: params.get("progressionStart") as Progression,
            progressionEnd: params.get("progressionEnd") as Progression,
          }
        : defaultRange),
      pointFive: params.get("pointFive") === "true",
    },
    rangeAuthority,
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
export function useLookupSelection(characterId?: string) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSelection = selectionFromParams(searchParams, characterId)
  const [applied, setApplied] = useState<LookupSelection>(
    initialSelection.selection
  )
  const [draft, setDraft] = useState<LookupSelection>(applied)
  const [rangeAuthority, setRangeAuthority] = useState<RangeAuthority>(
    initialSelection.rangeAuthority
  )
  const selectionKey = `${characterId ?? ""}?${searchParams}`
  const [trackedSelectionKey, setTrackedSelectionKey] = useState(selectionKey)
  const [pendingSearchParams, setPendingSearchParams] = useState<
    { characterId?: string; value: string } | undefined
  >(undefined)

  // Route/search changes must become the source of truth during the same
  // render, before controls read draft selection state.
  if (selectionKey !== trackedSelectionKey) {
    const parsed = selectionFromParams(searchParams, characterId)
    const isInternalNavigation =
      pendingSearchParams?.value === searchParams.toString()
    setTrackedSelectionKey(selectionKey)
    setApplied(parsed.selection)
    setDraft(parsed.selection)
    if (!isInternalNavigation) {
      setRangeAuthority(parsed.rangeAuthority)
    }
    if (pendingSearchParams?.characterId === characterId) {
      setPendingSearchParams(undefined)
    }
  }

  const commitSelection = (
    selection: LookupSelection,
    pendingCharacterId = characterId
  ) => {
    setApplied(selection)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete("character")
        next.set("rankStart", selection.rankStart)
        next.set("rankEnd", selection.rankEnd)
        next.set("progressionStart", selection.progressionStart)
        next.set("progressionEnd", selection.progressionEnd)
        next.set("pointFive", String(selection.pointFive))
        setPendingSearchParams({
          characterId: pendingCharacterId,
          value: next.toString(),
        })
        return next
      },
      { replace: true }
    )
  }

  // Picking a character is the primary action on this page, so it commits immediately instead of
  // waiting on Apply — Apply stays reserved for the rank range/progression/point-five tweaks.
  const setDraftCharacterId = (id: UnitId) => {
    const next: LookupSelection = { ...draft, characterId: id }
    setDraft(next)
    commitSelection(next, id)
  }

  const applyPlayerPrefill = (
    id: UnitId,
    prefill: { rankStart: Rank; progressionStart: Progression }
  ) => {
    if (rangeAuthority !== "generated" || draft.characterId !== id) return

    const next: LookupSelection = {
      ...draft,
      ...deriveLookupRange(prefill.rankStart, prefill.progressionStart),
      characterId: id,
    }
    setDraft(next)
    commitSelection(next, id)
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

  const setDraftRange = (start: Rank, end: Rank) => {
    setRangeAuthority("user")
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
  }

  const setDraftProgressionRange = (start: Progression, end: Progression) => {
    setRangeAuthority("user")
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
  }

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
    applyPlayerPrefill,
    setDraftRange,
    setDraftProgressionRange,
    setDraftPointFive,
    handleApply,
  }
}
