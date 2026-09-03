import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

export type ShopsStateKind = "loading" | "error" | "no-project" | "nothing"

/**
 * The Shops page's own local states (loading / page-local read failure / no project / no matching
 * offer). Total game-catalog sync failure is handled by the global gate before this page mounts.
 */
export function ShopsState({
  state,
  onRetry,
}: {
  state: ShopsStateKind
  onRetry?: () => void
}) {
  const { t } = useTranslation("shops")

  if (state === "loading") {
    return (
      <div
        className="flex min-h-48 items-center justify-center"
        data-testid="shops-loading"
      >
        <Spinner className="size-8" />
      </div>
    )
  }

  const message =
    state === "error"
      ? t("state.error")
      : state === "no-project"
        ? t("state.noProject")
        : t("state.nothingToBuy")

  return (
    <Card data-testid={`shops-${state}`}>
      <CardContent className="grid justify-items-center gap-4 py-10 text-center text-muted-foreground">
        <p>{message}</p>
        {state === "error" && onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            {t("state.retry")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
