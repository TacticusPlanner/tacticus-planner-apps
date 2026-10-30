import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  AuthError,
  InteractionStatus,
  PromptValue,
  type RedirectRequest,
} from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "./authentication"
import { useSilentSignInStatus } from "./silent-sign-in"

/** The bare landing page stays browsable once signed in (spec: landing-page), so signing in from it
 *  returns to Home instead; any other start page, `/?next=…` included, is returned to as is. */
function signInRequest(): RedirectRequest {
  const { origin, pathname, search } = window.location
  return pathname === "/" && search === ""
    ? { ...loginRequest, redirectStartPage: new URL("/home", origin).href }
    : loginRequest
}

/** Sign-up opens the identity provider's create-account step directly; it returns like sign-in.
 *  `create` replaces an armed fresh-login prompt: the create-account page is always fresh. */
function signUpRequest(): RedirectRequest {
  return { ...signInRequest(), prompt: PromptValue.CREATE }
}

/** Starts the sign-in or sign-up redirect from a signed-out entry point (public top bar, landing hero).
 *  `disabled` while MSAL is mid-interaction; `checkingSignIn` while the silent restore runs. */
export function useSignInRedirect() {
  const { t } = useTranslation()
  const { inProgress, instance } = useMsal()
  const silentSignInStatus = useSilentSignInStatus()

  const start = useCallback(
    (request: RedirectRequest) => {
      void instance.loginRedirect(request).catch((error: unknown) => {
        if (error instanceof AuthError) {
          console.error("[MSAL] sign-in failed", {
            errorCode: error.errorCode,
            message: error.message,
          })
        } else {
          console.error("[MSAL] sign-in failed", error)
        }

        toast.error(t("auth.error"))
      })
    },
    [instance, t]
  )
  const signIn = useCallback(() => start(signInRequest()), [start])
  const signUp = useCallback(() => start(signUpRequest()), [start])

  return {
    signIn,
    signUp,
    disabled: inProgress !== InteractionStatus.None,
    checkingSignIn: silentSignInStatus === "checking",
  }
}
