import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

export type ArenaStateKind = "loading" | "error" | "no-characters"

/**
 * The Arena page's own whole-page states: data still loading, a retryable load failure, and the
 * signed-in player owning too few characters for any team. A total game-catalog sync failure is
 * handled by the global gate before this page mounts.
 */
export function ArenaState({
  state,
  onRetry,
}: {
  state: ArenaStateKind
  onRetry?: () => void
}) {
  const { t } = useTranslation("arena")

  if (state === "loading") {
    return (
      <div
        className="flex min-h-48 items-center justify-center"
        data-testid="arena-loading"
      >
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <Card data-testid={`arena-${state}`}>
      <CardContent className="grid justify-items-center gap-4 py-10 text-center text-muted-foreground">
        <p>{state === "error" ? t("state.error") : t("state.noCharacters")}</p>
        {state === "error" && onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            {t("state.retry")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
