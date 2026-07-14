import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import { getPlayerCharacter } from "@workspace/player-data/queries"

// A unique sentinel (not a plain value) so it can be distinguished from a legitimately-resolved
// result via reference equality — the documented Dexie pattern for detecting "still loading" with
// useLiveQuery, since its `defaultResult` argument is only returned before the first resolution.
// Mirrors pages/lookup/.../character-lookup-page.tsx's PLAYER_CHARACTER_LOADING (not imported —
// see use-goal-catalog.ts's note on why pages don't import from each other).
const LOADING = Symbol("loading")

/**
 * The caller's synced record for `characterId` (rank/progressionIndex/abilities/appliedUpgradeSlots),
 * or `undefined` when signed out, not yet synced, or the unit isn't owned. Used to prefill a Rank/
 * Ascension/Ability goal's "start" fields with the character's actual current state.
 */
export function useGoalPrefill(characterId: UnitId | undefined) {
  const isAuthenticated = useIsAuthenticated()

  const result = useLiveQuery(
    () =>
      isAuthenticated && characterId
        ? getPlayerCharacter(characterId).then((data) => ({
            id: characterId as UnitId | undefined,
            data,
          }))
        : { id: characterId, data: undefined },
    [isAuthenticated, characterId],
    LOADING
  )

  const playerCharacter =
    result !== LOADING && result.id === characterId ? result.data : undefined
  const loading =
    isAuthenticated &&
    !!characterId &&
    (result === LOADING || result.id !== characterId)

  return { playerCharacter, loading }
}
