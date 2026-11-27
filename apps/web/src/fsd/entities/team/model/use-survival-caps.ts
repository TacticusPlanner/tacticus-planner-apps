import { useCallback } from "react"

import { useCatalogDataset } from "@/shared/local-data"

const selectCaps = (
  records: readonly { id: string; rules: { maxCharacters: number } }[]
) =>
  new Map<string, number>(
    records.map((record) => [record.id, record.rules.maxCharacters])
  )

/**
 * The cap a Survival rule code is about (`survivalTooManyCharacters`) for the team's event, or
 * undefined for any other code, no event or while the events load.
 */
export function useSurvivalRuleCap() {
  const caps = useCatalogDataset("survival-events", selectCaps)
  const byId = caps.status === "ready" ? caps.data : undefined
  return useCallback(
    (code: string, survivalEventKey?: string | null): number | undefined =>
      code === "survivalTooManyCharacters" && survivalEventKey
        ? byId?.get(survivalEventKey)
        : undefined,
    [byId]
  )
}
