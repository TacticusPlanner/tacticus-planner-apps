import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "@workspace/ui/lib/toast"

import { safeSessionStorage, sessionStorageKeys } from "@/shared/lib"

// sessionStorage, not localStorage: the notice only has to survive this tab's sign-out redirect,
// and sign-out clears the account's localStorage keys.
const NOTICE_KEY = sessionStorageKeys.signInAccountKeptNotice

/** Remembers, across the sign-out redirect, that a purge kept the sign-in account. */
export function rememberSignInAccountKept(): void {
  // Storage blocked: the user is still signed out, just without the notice.
  safeSessionStorage.set(NOTICE_KEY, "1")
}

function takeSignInAccountKept(): boolean {
  const stored = safeSessionStorage.get(NOTICE_KEY) !== null
  safeSessionStorage.remove(NOTICE_KEY)
  return stored
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
