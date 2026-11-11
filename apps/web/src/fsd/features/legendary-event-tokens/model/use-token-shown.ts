import { useEffect } from "react"

import type { PlannedToken } from "../lib/token-plan"

/** Calls `onShown` with the shown token once per lane, battle and team (none while it is absent):
 *  marks and syncs re-plan often without changing which token shows. */
export function useTokenShown(
  token: PlannedToken,
  onShown: ((token: PlannedToken) => void) | undefined
) {
  const key = onShown
    ? `${token.laneId}:${token.battleIndex}:${token.teamId}`
    : null
  useEffect(() => {
    if (key !== null) onShown?.(token)
    // Once per shown battle and team: the token object and handler change with every re-plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
