import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import type {
  V1LegendaryEventIssue,
  V1LegendaryEventOutcome,
} from "@/entities/account"
import { useLegendaryEvents } from "@/entities/legendary-event"

import {
  describeLegendaryEventIssue,
  type LegendaryEventIssueCatalog,
} from "./legendary-event-outcome-buckets"

/**
 * The translated line of a Legendary Event import issue and whether its raw value is shown beside
 * it. Run input and mark issues name the event's catalog bound (missions, battles) when the catalog
 * knows the event, and read without it otherwise.
 */
export function useLegendaryEventIssueText() {
  const { t } = useTranslation()
  const events = useLegendaryEvents()
  const data = events.status === "ready" ? events.data : undefined
  const catalogs = useMemo(
    () =>
      new Map(
        (data ?? []).map((event) => [
          event.id,
          {
            regularMissions: event.regularMissions.length,
            premiumMissions: event.premiumMissions.length,
            battleCounts: {
              alpha: event.alpha.battleIds.length,
              beta: event.beta.battleIds.length,
              gamma: event.gamma.battleIds.length,
            },
          } satisfies LegendaryEventIssueCatalog,
        ])
      ),
    [data]
  )

  return (
    issue: V1LegendaryEventIssue,
    outcome: Pick<V1LegendaryEventOutcome, "eventId">
  ): { text: string; showValue: boolean } => {
    const { key, params, showValue } = describeLegendaryEventIssue(
      issue,
      outcome.eventId ? catalogs.get(outcome.eventId) : undefined
    )
    const resolved = Object.fromEntries(
      Object.entries(params).map(([name, value]) => [
        name,
        typeof value === "object" ? t(value.key) : value,
      ])
    )
    return { text: t(key, resolved), showValue }
  }
}
