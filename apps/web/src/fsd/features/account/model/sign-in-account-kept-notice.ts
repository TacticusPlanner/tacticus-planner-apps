import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

// sessionStorage, not localStorage: the notice only has to survive this tab's sign-out redirect,
// and sign-out clears the account's localStorage keys.
const NOTICE_KEY = "tp.signInAccountKeptNotice"

/** Remembers, across the sign-out redirect, that a purge kept the sign-in account. */
export function rememberSignInAccountKept(): void {
  try {
    window.sessionStorage.setItem(NOTICE_KEY, "1")
  } catch {
    // Storage blocked: the user is still signed out, just without the notice.
  }
}

function takeSignInAccountKept(): boolean {
  try {
    const stored = window.sessionStorage.getItem(NOTICE_KEY) !== null
    window.sessionStorage.removeItem(NOTICE_KEY)
    return stored
  } catch {
    return false
  }
}

/** Shows, once, the notice left by `rememberSignInAccountKept` on the page reached after sign-out. */
export function useSignInAccountKeptNotice(): void {
  const { t } = useTranslation()
  useEffect(() => {
    if (!takeSignInAccountKept()) return
    toast.error(t("manageAccount.account.signInAccountKeptTitle"), {
      description: t("manageAccount.account.signInAccountKeptDescription"),
      duration: Infinity,
      closeButton: true,
    })
  }, [t])
}
