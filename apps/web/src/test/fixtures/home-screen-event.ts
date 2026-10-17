import {
  listHomeScreenEventInstances,
  selectActiveHomeScreenEvent,
  type HomeScreenEventEntry,
} from "@/features/daily-raids/model/select-active-home-screen-event"

// Shared by the Dailies > HSE page and tour tests, which mock `useActiveHomeScreenEvent` but keep
// the real selection model, so the page sees the state the hook would derive from these entries.
const homeScreenEventDefinitions = new Map(
  [
    "hse-machine-hunt",
    "hse-warp-surge",
    "hse-faction-boost",
    "hse-against-the-tide",
    "hse-trait-boost-psyker",
    "hse-faction-focus",
    "hse-global-operation-imperator",
  ].map((id) => [id, { type: "HomeScreenEvent" }])
)

/** The hook's ready state for these calendar entries at `nowMs`. */
export function homeScreenEventReadyAt<TEntry extends HomeScreenEventEntry>(
  entries: TEntry[],
  nowMs = Date.now()
) {
  return {
    status: "ready" as const,
    ...selectActiveHomeScreenEvent(entries, homeScreenEventDefinitions, nowMs),
    instances: listHomeScreenEventInstances(
      entries,
      homeScreenEventDefinitions,
      nowMs
    ),
    nowMs,
  }
}
