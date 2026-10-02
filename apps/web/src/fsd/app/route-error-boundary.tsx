import { useEffect, useState } from "react"
import { useNavigate, useRouteError } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { isStaleBuildError, reloadOnceForStaleBuild } from "@/shared/lib"

/**
 * `errorElement` for the root route set and the AppShell route. A stale-build failure (chunk deleted
 * by a newer deploy, local DB moved on by a newer tab) reloads the URL once and renders nothing in
 * the meantime; anything else — or a second stale failure on the same URL — gets the branded
 * fallback page instead of react-router's default error output.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()
  // Decided once per mount, in the state initializer: React uses the first call's result (Strict
  // Mode's second dev-only call sees the session marker already set and is discarded), so the
  // reload fires exactly once and the fallback never flashes before it.
  const [reloading] = useState(
    () => isStaleBuildError(error) && reloadOnceForStaleBuild()
  )

  useEffect(() => {
    if (!reloading) console.error("Route rendering failed", error)
  }, [error, reloading])

  if (reloading) return null

  return (
    <div
      className="flex min-h-svh items-center justify-center p-4"
      data-testid="app-error-page"
      role="alert"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-lg">
        <h1 className="text-lg font-semibold">{t("appError.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("appError.description")}
        </p>
        <div className="flex gap-2">
          <Button
            autoFocus
            data-testid="app-error-reload"
            onClick={() => window.location.reload()}
          >
            {t("appError.reload")}
          </Button>
          <Button
            data-testid="app-error-home"
            onClick={() => void navigate("/home")}
            variant="outline"
          >
            {t("appError.goHome")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("appError.feedbackHint")}
        </p>
      </div>
    </div>
  )
}
