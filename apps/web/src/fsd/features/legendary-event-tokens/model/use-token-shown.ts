import { useEffect, useEffectEvent } from "react"

import type { PlannedToken } from "../lib/token-plan"

/** Calls `onShown` with the shown token once per run, lane, battle and team (none while it is
 *  absent): marks and syncs re-plan often without changing which token shows. */
export function useTokenShown(
  token: PlannedToken,
  run: number | null,
  onShown: ((token: PlannedToken) => void) | undefined
) {
  const key = onShown
    ? `${run}:${token.laneId}:${token.battleIndex}:${token.teamId}`
    : null
  // Reads the latest token and handler: both change with every re-plan, the shown token does not.
  const reportShown = useEffectEvent(() => onShown?.(token))
  useEffect(() => {
    reportShown()
  }, [key])
}
