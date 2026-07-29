import { useEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"
import { useMsal } from "@azure/msal-react"

import { useGameCatalogStatus } from "@/app/providers"
import { signOut, useActiveAccountId } from "@/shared/auth"

/**
 * Blocks the home content with a full-screen overlay while the game catalog initializes/syncs. Shows
 * first-use vs update messaging (with the game version) and download progress; offers retry on error.
 */
export function GameCatalogInitGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const accountId = useActiveAccountId()
  const { status, progress, gameVersion, firstTime, error, retry } =
    useGameCatalogStatus()

  // The error detail (e.g. a multi-record zod dump) is too long for the UI — log it for debugging and
  // show only a short message on screen.
  useEffect(() => {
    if (status === "error" && error) {
      console.error("Game catalog initialization failed:", error)
    }
  }, [status, error])

  // Ready or stale (a usable cache exists) → reveal the app.
  if (status === "ready" || status === "stale") {
    return <>{children}</>
  }

  // `progress` stays null until dataset files actually start downloading (see syncGameCatalog) —
  // while it's null we're still just checking the manifest (often a fast 304), so don't block the
  // app on that. Errors always block, even if they happened before any file download started.
  if (status !== "error" && !progress) {
    return <>{children}</>
  }

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : undefined

  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        data-testid="catalog-init-overlay"
        role="status"
        aria-live="polite"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-lg">
          {status === "error" ? (
            <>
              <h2 className="text-lg font-semibold">
                {t("catalog.init.errorTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("catalog.init.errorDescription")}
              </p>
              <div className="flex gap-2">
                <Button data-testid="catalog-init-retry" onClick={retry}>
                  {t("catalog.init.retry")}
                </Button>
                <Button
                  data-testid="catalog-init-sign-out"
                  disabled={!accountId}
                  onClick={() => {
                    if (accountId) {
                      void signOut(instance, accountId).catch(
                        (signOutError) => {
                          console.error("[MSAL] sign-out failed", signOutError)
                        }
                      )
                    }
                  }}
                  variant="outline"
                >
                  {t("auth.signOut")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Spinner className="size-8 text-primary" />
              <h2 className="text-lg font-semibold">
                {firstTime
                  ? t("catalog.init.firstTimeTitle")
                  : t("catalog.init.updatingTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {firstTime
                  ? t("catalog.init.firstTimeDescription")
                  : t("catalog.init.updatingDescription", {
                      version: gameVersion ?? "",
                    })}
              </p>
              {progress && progress.total > 0 ? (
                <div className="flex w-full flex-col gap-2">
                  <Progress value={percent} />
                  <p className="text-xs text-muted-foreground">
                    {t("catalog.init.progress", {
                      done: progress.downloaded,
                      total: progress.total,
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("catalog.init.preparing")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
