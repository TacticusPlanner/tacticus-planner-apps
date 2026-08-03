import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import type { DailyRaidsViewModel } from "../model/daily-raids.domain"

export function RaidState({
  state,
}: {
  state: Exclude<DailyRaidsViewModel["status"], "ready">
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
        : "empty.noProject"
  return (
    <Card data-testid={`dailies-${state}`}>
      <CardContent className="py-10 text-center text-muted-foreground">
        {t(key)}
      </CardContent>
    </Card>
  )
}
