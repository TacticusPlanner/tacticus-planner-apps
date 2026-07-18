import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { useMsal } from "@azure/msal-react"

import { useCurrentUser } from "@/entities/account"
import { isInteractionRequired, requestApiAccess } from "@/shared/auth"

import { usePlayerDataStatus } from "./player-data-provider"

/**
 * acquireTokenSilent has no way to renew a session without a browser redirect once the cached
 * refresh token is gone (expired session, third-party cookies blocked, etc.) — every caller just
 * sees the same silent-auth timeout. Rather than each surface (account panel, player-data sync)
 * showing its own quiet error icon, this dialog watches both signals app-wide and interrupts with
 * a single explicit "sign in again / sign out" prompt the moment either one needs it.
 */
export function ReauthDialog() {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const { state: accountState } = useCurrentUser()
  const { requiresReauth: playerDataRequiresReauth, status: playerDataStatus } =
    usePlayerDataStatus()

  const accountRequiresReauth =
    accountState.status === "error" && isInteractionRequired(accountState.error)
  const needsReauth =
    accountRequiresReauth ||
    (playerDataStatus === "error" && playerDataRequiresReauth)

  // Dismissible rather than a hard block — cached data usually still renders — but it should
  // reappear for a fresh failure even if the user dismissed a previous one.
  const [dismissed, setDismissed] = useState(false)
  const wasNeeded = useRef(false)

  useEffect(() => {
    if (needsReauth && !wasNeeded.current) {
      setDismissed(false)
    }
    wasNeeded.current = needsReauth
  }, [needsReauth])

  const handleSignIn = () => {
    void requestApiAccess().catch((error: unknown) => {
      console.error("[MSAL] reauth sign-in failed", error)
      toast.error(t("auth.error"))
    })
  }

  const handleSignOut = () => {
    const account = instance.getActiveAccount() ?? undefined

    void instance.logoutRedirect({ account }).catch((error: unknown) => {
      console.error("[MSAL] reauth sign-out failed", error)
      toast.error(t("auth.error"))
    })
  }

  return (
    <Dialog
      open={needsReauth && !dismissed}
      onOpenChange={(open) => {
        if (!open) {
          setDismissed(true)
        }
      }}
    >
      <DialogContent data-testid="reauth-dialog">
        <DialogHeader>
          <DialogTitle>{t("auth.reauthDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("auth.reauthDialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            data-testid="reauth-dialog-sign-out"
            onClick={handleSignOut}
            variant="outline"
          >
            {t("auth.signOut")}
          </Button>
          <Button data-testid="reauth-dialog-sign-in" onClick={handleSignIn}>
            {t("auth.signIn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
