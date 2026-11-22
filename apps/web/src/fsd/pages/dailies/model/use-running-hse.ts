import { useMemo } from "react"
import type { EventDefinitionStorageModel } from "@workspace/game-catalog"

import {
  useActiveHomeScreenEvent,
  useHomeScreenEventName,
} from "@/features/daily-raids"
import { useCatalogDataset } from "@/shared/local-data"

import { runningPersonalHses } from "./running-hse"
import type { RunningHse } from "./running-hse"

const NONE: readonly RunningHse[] = []

const toConfigs = (definitions: EventDefinitionStorageModel[]) =>
  new Map(definitions.map((definition) => [definition.id, definition.config]))

/**
 * The running personal Home Screen Events (`runningPersonalHses`), for the HRE mission teams to rank
 * the scoring units of the one that scores in each team's mode first. Empty while none runs or the
 * calendar or definitions are still loading.
 */
export function useRunningHses(): readonly RunningHse[] {
  const state = useActiveHomeScreenEvent()
  const eventName = useHomeScreenEventName()
  const configs = useCatalogDataset("event-definitions", toConfigs)
  return useMemo(() => {
    if (state.status !== "ready" || configs.status !== "ready") return NONE
    return runningPersonalHses(
      state.instances,
      (id) => configs.data.get(id),
      (instance) => eventName(instance.entry)
    )
  }, [state, configs, eventName])
}
