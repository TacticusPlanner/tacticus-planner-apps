import { useState } from "react"
import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useMsal } from "@azure/msal-react"

import { PostHogProvider } from "@/app/providers"
import { signOut, useActiveAccountId } from "@/shared/auth"

import { AppLogo } from "./app-logo"

/**
 * Minimal chrome for account setup, deliberately NOT the app shell.
 *
 * A user on this screen has no configured API key, so every shell affordance is either a trap or
 * noise: the nav links lead to protected routes that bounce straight back here, the create-goal and
 * search controls act on data that does not exist yet, the game-catalog init gate throws a blocking
 * overlay over the form, and the player-data provider auto-syncs on mount and parks a red "sync
 * failed" badge on the very screen asking for the key it is missing.
 *
 * PostHog is mounted here on purpose: it otherwise lives inside `AppShell`, and setup would emit no
 * page-views at all — which is the measurement the per-step addresses exist to provide.
 *
 * Sign-out lives here, opposite the logo, rather than as a footer on the screen content: it is the
 * one shell-like affordance this deliberately shell-less flow still needs (a user who wants neither
 * setup path must not be trapped), and belongs to every step alike, so the persistent header is a
 * better home for it than a screen that varies per step.
 */
// Setup is deliberately not a nav item, so its analytics route group is set literally here.
export function AccountSetupLayout() {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const accountId = useActiveAccountId()
  const [isSigningOut, setIsSigningOut] = useState(false)

  return (
    <PostHogProvider routeGroup="/setup">
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <header className="flex items-center justify-between gap-2 border-b bg-sidebar px-4 py-3">
          <div className="flex items-center gap-2">
            <AppLogo className="size-7" />
            <span className="font-heading text-sm font-medium">
              {t("app.name")}
            </span>
          </div>
          <Button
            data-testid="account-setup-sign-out"
            disabled={!accountId || isSigningOut}
            onClick={() => {
              if (accountId) {
                setIsSigningOut(true)
                void signOut(instance, accountId).catch((error: unknown) => {
                  console.error("[MSAL] sign-out failed", error)
                  // Only reset on failure — a successful sign-out navigates away, so there is no
                  // "back to idle" state to restore this button to.
                  setIsSigningOut(false)
                })
              }
            }}
            size="sm"
            variant="ghost"
          >
            {t("auth.signOut")}
          </Button>
        </header>
        <main className="flex-1 pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </main>
      </div>
    </PostHogProvider>
  )
}
