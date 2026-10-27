import { homeScreenEventEntryRule } from "./home-screen-event-raid-rule"
import {
  useHomeScreenEventCalendar,
  type ActiveHomeScreenEventState,
} from "./use-home-screen-event-calendar"

export type { ActiveHomeScreenEventState }

/** The Home Screen Event calendar state with each event's raid-point rule from its `config.hse`. */
export function useActiveHomeScreenEvent(): ActiveHomeScreenEventState {
  return useHomeScreenEventCalendar(homeScreenEventEntryRule)
}
