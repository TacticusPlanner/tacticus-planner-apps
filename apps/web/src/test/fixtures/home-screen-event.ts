import { homeScreenEventRaidRule } from "@/features/daily-raids/model/home-screen-event-rules"
import {
  homeScreenEventEntryRule,
  listHomeScreenEventInstances,
  selectActiveHomeScreenEvent,
  type HomeScreenEventEntry,
} from "@/features/daily-raids/model/select-active-home-screen-event"

import {
  hseDefinitionConfig,
  type HseFixtureId,
} from "./home-screen-event-scoring"
import scoring from "./home-screen-event-scoring.json"

/** An HSE definition as the catalog serves it: its fixture `config.hse`, or no config (Against the
 * Tide). */
export function homeScreenEventDefinition(id: string) {
  return {
    type: "HomeScreenEvent",
    config: id in scoring ? hseDefinitionConfig(id as HseFixtureId) : undefined,
  }
}

// Shared by the Dailies > HSE page and tour tests, which mock `useActiveHomeScreenEvent` but keep
// the real selection model, so the page sees the state the hook would derive from these entries.
/** The raid-point rule of a definition's default variant, from its fixture `config.hse`. */
export function homeScreenEventRaidRuleOf(id: string) {
  return homeScreenEventRaidRule(homeScreenEventDefinition(id).config, null)
}

const homeScreenEventDefinitions = new Map(
  [
    "hse-machine-hunt",
    "hse-warp-surge",
    "hse-faction-boost",
    "hse-against-the-tide",
    "hse-trait-boost-psyker",
    "hse-faction-focus",
    "hse-global-operation-imperator",
    "hse-arsenal-of-war",
    "hse-defeat-waves",
    "hse-squig-smash",
    "hse-for-the-emperor",
    "hse-training-rush",
    "hse-trait-boost-flying",
  ].map((id) => [id, homeScreenEventDefinition(id)])
)

/** The hook's ready state for these calendar entries at `nowMs`. */
export function homeScreenEventReadyAt<TEntry extends HomeScreenEventEntry>(
  entries: TEntry[],
  nowMs = Date.now()
) {
  const selection = selectActiveHomeScreenEvent(
    entries,
    homeScreenEventDefinitions,
    nowMs
  )
  return {
    status: "ready" as const,
    ...selection,
    activeRaidRule: selection.active
      ? homeScreenEventEntryRule(selection.active, homeScreenEventDefinitions)
      : null,
    instances: listHomeScreenEventInstances(
      entries,
      homeScreenEventDefinitions,
      nowMs
    ),
    nowMs,
  }
}
