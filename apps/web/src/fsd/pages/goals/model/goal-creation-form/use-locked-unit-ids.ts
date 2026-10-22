import { useMemo } from "react"

import type { FactionGroup, UnitId } from "@workspace/game-domain"

import { usePlayerChunk } from "@/shared/local-data"

import { chunkOrUndefined, readyData } from "../shared/read-data"

/**
 * The merged Unit picker's locked-id set (plan: goal-creation combobox lock badge) — every
 * catalog id minus whatever's actually synced to the caller's roster. `undefined` until both the
 * catalog groups and the synced roster have loaded, so the combobox shows no locked state (rather
 * than a flash of "everything locked") during the initial load. Split out of
 * `use-create-goal-form.ts` purely for that file's own max-lines budget. No auth check here — the
 * caller (`CreateGoalSheet`) only ever mounts once `AppShell` has confirmed the user is signed in.
 */
export function useLockedUnitIds(
  characterGroups: FactionGroup[],
  mowGroups: FactionGroup[]
): ReadonlySet<UnitId> | undefined {
  const ownedCharacters = readyData(
    usePlayerChunk("characters", chunkOrUndefined)
  )
  const ownedMows = readyData(usePlayerChunk("mows", chunkOrUndefined))
  // Built off characterGroups/mowGroups (not charactersById/mowsById directly) since those already
  // carry a properly branded `UnitId` per member — the raw catalog maps are keyed by plain `string`.
  const lockedCharacterIds = useMemo(() => {
    if (!ownedCharacters) return undefined
    const owned = new Set(ownedCharacters.map((c) => c.unitId))
    return new Set(
      characterGroups
        .flatMap((group) => group.members)
        .map((member) => member.id)
        .filter((id) => !owned.has(id))
    )
  }, [characterGroups, ownedCharacters])
  const lockedMowIds = useMemo(() => {
    if (!ownedMows) return undefined
    const owned = new Set(ownedMows.map((m) => m.unitId))
    return new Set(
      mowGroups
        .flatMap((group) => group.members)
        .map((member) => member.id)
        .filter((id) => !owned.has(id))
    )
  }, [mowGroups, ownedMows])

  return useMemo(
    () =>
      lockedCharacterIds && lockedMowIds
        ? new Set([...lockedCharacterIds, ...lockedMowIds])
        : undefined,
    [lockedCharacterIds, lockedMowIds]
  )
}
