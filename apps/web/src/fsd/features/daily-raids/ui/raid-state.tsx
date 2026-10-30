import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import type { DailyRaidsViewModel } from "../model/daily-raids.domain"

export function RaidState({
  state,
  onRetry,
  variant = "card",
}: {
  state: Exclude<DailyRaidsViewModel["status"], "ready">
  onRetry?: () => void
  // "inline" drops the outer card, for a host that is already a card (Today's plan card).
  variant?: "card" | "inline"
}) {
  const { t } = useTranslation("dailies")
  if (state === "loading") {
    return (
      <div
        className="flex min-h-48 items-center justify-center"
        data-testid="dailies-loading"
      >
        <Spinner className="size-8" />
      </div>
    )
  }
  const key =
    state === "no-farmable"
      ? "empty.noFarmable"
      : state === "error"
        ? "empty.error"
        : "empty.noGoals"
  const content = (
    <>
      <p>{t(key)}</p>
      {state === "error" && onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {t("empty.retry")}
        </Button>
      ) : null}
    </>
  )
  if (variant === "inline") {
    return (
      <div
        className="grid justify-items-center gap-4 py-10 text-center text-muted-foreground"
        data-testid={`dailies-${state}`}
      >
        {content}
      </div>
    )
  }
  return (
    <Card data-testid={`dailies-${state}`}>
      <CardContent className="grid justify-items-center gap-4 py-10 text-center text-muted-foreground">
        {content}
      </CardContent>
    </Card>
  )
}
