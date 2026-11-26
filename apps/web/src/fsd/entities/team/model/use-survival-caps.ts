import { useCallback } from "react"

import { useCatalogDataset } from "@/shared/local-data"

/** A Survival event's caps on stored characters and MoWs. */
interface SurvivalCaps {
  maxCharacters: number
  maxMows: number
}

const selectCaps = (
  records: readonly {
    id: string
    rules: { maxCharacters: number; maxMows: number }
  }[]
) =>
  new Map<string, SurvivalCaps>(
    records.map((record) => [
      record.id,
      {
        maxCharacters: record.rules.maxCharacters,
        maxMows: record.rules.maxMows,
      },
    ])
  )

/**
 * The cap a Survival rule code is about (`survivalTooManyCharacters`, `survivalTooManyMows`) for
 * the team's event, or undefined for any other code, no event or while the events load.
 */
export function useSurvivalRuleCap() {
  const caps = useCatalogDataset("survival-events", selectCaps)
  const byId = caps.status === "ready" ? caps.data : undefined
  return useCallback(
    (code: string, survivalEventKey?: string | null): number | undefined => {
      const event = survivalEventKey ? byId?.get(survivalEventKey) : undefined
      if (code === "survivalTooManyCharacters") return event?.maxCharacters
      if (code === "survivalTooManyMows") return event?.maxMows
      return undefined
    },
    [byId]
  )
}
