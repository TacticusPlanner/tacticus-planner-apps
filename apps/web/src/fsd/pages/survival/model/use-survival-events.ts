import { useCatalogDataset } from "@/shared/local-data"

import { compareSurvivalEvents } from "./survival-event-status"
import type { SurvivalEvent } from "./survival-event"

const byStart = (events: SurvivalEvent[]) =>
  events.toSorted(compareSurvivalEvents)

/** The served Survival events, dated ones by start then undated ones. */
export function useSurvivalEvents() {
  return useCatalogDataset("survival-events", byStart)
}
