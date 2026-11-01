import { useState } from "react"

import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { hasAccountHint } from "@/shared/auth"

/**
 * Whether a visitor who arrived with no session on this device (no cached account, no account hint)
 * has since become signed in, without this page load completing the redirect itself: the sign-in
 * finished in another tab or browsing context of the installed app, and MSAL picked the account up
 * from the shared token cache. initializeAuthentication only moves a sign-in it completed on the
 * bare "/" on to Home, so the landing page does it for these (spec: redirect-authentication).
 * A returning user restored silently arrived with an account or a hint, so they stay on "/".
 */
export function useSignedInDuringVisit() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [arrivedSignedOut] = useState(
    () => instance.getAllAccounts().length === 0 && !hasAccountHint()
  )

  return arrivedSignedOut && isAuthenticated
}
