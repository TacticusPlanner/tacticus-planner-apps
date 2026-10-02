import { useEffect, useRef } from "react"

import { isInteractionRequired, requestApiAccess } from "./authentication"

/**
 * When `error` says the session needs interaction (consent, expired refresh token, a silent
 * request that timed out), start the in-app re-authentication redirect exactly once for as long as
 * that error stays in place; a different/absent error re-arms it. Returns whether the given error
 * is one this hook is handling, so the caller can show a loading state instead of an error card.
 */
export function useRequestApiAccessOnce(
  error: unknown,
  onError: (error: unknown) => void
) {
  const handling = error !== undefined && isInteractionRequired(error)
  const requested = useRef(false)

  useEffect(() => {
    if (!handling) {
      requested.current = false
      return
    }
    if (requested.current) return
    requested.current = true
    void requestApiAccess().catch(onError)
  }, [handling, error, onError])

  return handling
}
