import { useEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { IPublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"

import { startSilentSignInOnce, takeSignInRedirectFailure } from "@/shared/auth"

type AuthProviderProps = {
  children: ReactNode
  instance: IPublicClientApplication
}

export function AuthProvider({ children, instance }: AuthProviderProps) {
  useEffect(() => {
    startSilentSignInOnce(instance)
  }, [instance])

  return (
    <MsalProvider instance={instance}>
      {children}
      <SignInRedirectFailureToast />
    </MsalProvider>
  )
}

/** A sign-in redirect that came back with an error lands on whatever page it started from, public
 *  ones included, so the toast lives here rather than in the app shell's account menu. A deliberate
 *  cancel stays quiet. Rendered after the children so the Toaster has subscribed first. */
function SignInRedirectFailureToast() {
  const { t } = useTranslation()

  useEffect(() => {
    // One-shot: StrictMode's second effect run reads null.
    if (takeSignInRedirectFailure() === "failed") toast.error(t("auth.error"))
  }, [t])

  return null
}
