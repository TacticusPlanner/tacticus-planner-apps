import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

export function EventsCalendarState({
  state,
  onRetry,
}: {
  state: "loading" | "error" | "empty"
  onRetry?: () => void
}) {
  const { t } = useTranslation("events")

  if (state === "loading") {
    return (
      <div
        className="flex min-h-48 items-center justify-center"
        data-testid="events-calendar-loading"
      >
        <Spinner className="size-8" />
      </div>
    )
  }

  const key = state === "error" ? "states.error" : "states.empty"

  return (
    <Card data-testid={`events-calendar-${state}`}>
      <CardContent className="grid justify-items-center gap-4 py-10 text-center text-muted-foreground">
        <p>{t(key)}</p>
        {state === "error" && onRetry ? (
          <Button onClick={onRetry} variant="outline">
            {t("states.retry")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
