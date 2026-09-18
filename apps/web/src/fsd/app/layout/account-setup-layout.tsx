import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"

import { PostHogProvider } from "@/app/providers"

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
 */
// Setup is deliberately not a nav item, so its analytics route group is set literally here.
export function AccountSetupLayout() {
  const { t } = useTranslation()

  return (
    <PostHogProvider routeGroup="/setup">
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <AppLogo className="size-7" />
          <span className="font-heading text-sm font-medium">
            {t("app.name")}
          </span>
        </header>
        <main className="flex-1 pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </main>
      </div>
    </PostHogProvider>
  )
}
