import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { useSilentSignInStatus } from "@/shared/auth"

/**
 * Whether a signed-out first render may still turn into a signed-in one: MSAL is mid-interaction,
 * the silent restore from the account hint is running (a new tab or a relaunched installed app
 * holds no tokens, spec: redirect-authentication), or the instance already holds an account that
 * msal-react's state has not caught up with. Guards wait instead of sending the visitor to the
 * landing page, so a returning user goes from the boot screen straight to their page.
 */
export function useAuthPending() {
  const { inProgress, instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const silentSignInStatus = useSilentSignInStatus()

  if (inProgress !== InteractionStatus.None) return true
  if (isAuthenticated) return false
  return (
    silentSignInStatus === "checking" || instance.getAllAccounts().length > 0
  )
}
