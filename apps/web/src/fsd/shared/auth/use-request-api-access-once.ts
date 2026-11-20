import { useEffect, useRef } from "react"

import { isInteractionRequired, requestInteraction } from "./authentication"

/**
 * When `error` says the session needs interaction (consent, expired refresh token, a silent
 * request that timed out), start the in-app re-authentication redirect exactly once for as long as
 * that error stays in place; a different/absent error re-arms it. The redirect itself is shared with
 * every other caller in the page load (`requestInteraction`). Returns whether the given error
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
    void requestInteraction().catch(onError)
  }, [handling, error, onError])

  return handling
}
