import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import { CreateGoalButton } from "@/entities/goal"
import { EmptyState } from "@/shared/ui"

import type { DailyRaidsViewModel } from "../model/daily-raids.domain"

export function RaidState({
  state,
  onRetry,
  variant = "card",
  noGoalsMessage,
}: {
  state: Exclude<DailyRaidsViewModel["status"], "ready">
  onRetry?: () => void
  // "inline" drops the outer card, for a host that is already a card (Today's plan card).
  variant?: "card" | "inline"
  /** Replaces the no-goals sentence, for a page that is not Today. */
  noGoalsMessage?: string
}) {
  const { t } = useTranslation("dailies")
  if (state === "loading") {
    return (
      <div
        className="flex min-h-48 items-center justify-center"
        data-testid="dailies-loading"
      >
        <Spinner className="size-icon-lg" />
      </div>
    )
  }
  if (state !== "error") {
    // "inline": the host is already a card, so the empty state drops its own border.
    return (
      <EmptyState
        actions={state === "no-goals" ? <CreateGoalButton /> : null}
        className={variant === "inline" ? "border-0" : undefined}
        description={
          state === "no-farmable"
            ? t("empty.noFarmable")
            : (noGoalsMessage ?? t("empty.noGoals"))
        }
        testId={`dailies-${state}`}
      />
    )
  }
  const content = (
    <>
      <p>{t("empty.error")}</p>
      {onRetry ? (
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
