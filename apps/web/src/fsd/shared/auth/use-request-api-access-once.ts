import { useEffect, useRef } from "react"

import { isInteractionRequired, requestApiAccess } from "./authentication"

// One redirect for the whole document, however many hook instances (the shell's account menu and
// the onboarding gate both see the same current-user error): a second acquireTokenRedirect while
// the first is in progress rejects with interaction_in_progress and would toast an error mid-redirect.
let apiAccessRequest: Promise<void> | null = null

function requestApiAccessShared() {
  if (apiAccessRequest) return apiAccessRequest
  const request = Promise.resolve().then(() => requestApiAccess())
  apiAccessRequest = request
  const clear = () => {
    if (apiAccessRequest === request) apiAccessRequest = null
  }
  void request.then(clear, clear)
  return request
}

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
    void requestApiAccessShared().catch(onError)
  }, [handling, error, onError])

  return handling
}
