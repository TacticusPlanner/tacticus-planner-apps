import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Accordion } from "@workspace/ui/components/accordion"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import { orderIncursions } from "../model/incursions.model"
import { useIncursionsData } from "../model/use-incursions-data"
import { IncursionItem } from "./incursions/incursion-item"

const SECONDS_PER_HOUR = 3600

/**
 * The Incursion page: the event's rules, then one row per Machine of War (newest first) with its
 * allowed factions and, per tier, the run map with every battle's enemies and rewards. Read-only,
 * straight from the `incursions` catalog dataset.
 */
export function IncursionsPage() {
  const { t } = useTranslation("incursions")
  const loaded = useIncursionsData()
  const data = loaded.status === "ready" ? loaded.data : undefined
  const incursions = useMemo(
    () => (data ? orderIncursions(data.incursions) : []),
    [data]
  )

  if (loaded.status === "error") {
    return (
      <Alert variant="destructive" data-testid="incursions-load-error">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("loadError")}
          <Button size="sm" variant="outline" onClick={loaded.retry}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (!data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  const rules = incursions[0]

  return (
    <div className="flex flex-col gap-6" data-testid="incursions-page">
      {rules ? (
        <Card data-testid="incursions-rules">
          <CardHeader>
            <CardTitle>{t("rules.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                {t("rules.tokens", {
                  start: rules.tokens.start,
                  max: rules.tokens.max,
                  hours: Math.round(
                    (rules.tokens.regenSeconds / SECONDS_PER_HOUR) *
                      rules.tokens.regenAmount
                  ),
                  cost: rules.tokens.costPerRun,
                })}
              </li>
              <li>
                {t("rules.team", {
                  count: rules.minUnitsOfGrandAllianceNeeded,
                })}
              </li>
              <li>{t("rules.progress")}</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground" data-testid="incursions-empty">
          {t("empty")}
        </p>
      )}
      {incursions.length > 0 ? (
        <Accordion type="multiple" data-testid="incursions-list">
          {incursions.map((incursion) => (
            <IncursionItem
              key={incursion.mowId}
              incursion={incursion}
              owned={data.ownedMowIds.has(incursion.mowId)}
              npcsById={data.npcsById}
            />
          ))}
        </Accordion>
      ) : null}
    </div>
  )
}
