import type { GameCatalogHseTracker } from "@workspace/game-catalog"

import {
  useActiveHomeScreenEvent,
  useHomeScreenEventName,
} from "@/features/daily-raids"
import { useHseProjection } from "@/features/home-screen-event-points"

export type RunningHse = {
  /** The event's localized name, e.g. "Faction Boost: Dark Angels". */
  name: string
  trackers: readonly GameCatalogHseTracker[]
}

/**
 * The running personal Home Screen Event's point trackers (its resolved variant), for the HRE
 * mission teams to rank its scoring units first. Null while none runs, it is still loading, or it
 * is a Global event (its points are not the player's own).
 */
export function useRunningHse(): RunningHse | null {
  const state = useActiveHomeScreenEvent()
  const eventName = useHomeScreenEventName()
  const active = state.status === "ready" ? state.active : null
  const instance =
    state.status === "ready" && active
      ? (state.instances.find(
          (candidate) =>
            candidate.status === "running" &&
            candidate.entry.definitionId === active.definitionId &&
            candidate.entry.startUtc === active.startUtc
        ) ?? null)
      : null
  const points = useHseProjection(instance)
  if (!instance || points.status !== "ready") return null
  if (points.details.scope === "Global") return null
  return { name: eventName(instance.entry), trackers: points.details.trackers }
}
