import { adjacentSwitcherKeys, groupSwitcherInstances } from "@/shared/ui"

import type {
  HomeScreenEventEntry,
  HomeScreenEventInstance,
} from "./select-active-home-screen-event"

export type HomeScreenEventGroups<TEntry extends HomeScreenEventEntry> = {
  /** Running now, by start then definition id. */
  running: HomeScreenEventInstance<TEntry>[]
  /** Not started yet, ascending by start then definition id. */
  upcoming: HomeScreenEventInstance<TEntry>[]
  /** Ended, newest first. */
  past: HomeScreenEventInstance<TEntry>[]
}

/** Splits the chronological instance list into the switcher's Running, Upcoming and Past groups. */
export function groupHomeScreenEventInstances<
  TEntry extends HomeScreenEventEntry,
>(
  instances: readonly HomeScreenEventInstance<TEntry>[]
): HomeScreenEventGroups<TEntry> {
  return groupSwitcherInstances(instances)
}

export type AdjacentHomeScreenEventKeys = {
  previous: string | null
  next: string | null
}

/**
 * The instances the Previous / Next buttons step to: the closest earlier or later start in the
 * chronological list (ties already ordered by definition id), or null at either end. With nothing
 * shown (only past instances, no selection) Previous opens the latest instance and Next is disabled.
 */
export function adjacentHomeScreenEventKeys(
  instances: readonly HomeScreenEventInstance<HomeScreenEventEntry>[],
  selectedKey: string | null
): AdjacentHomeScreenEventKeys {
  return adjacentSwitcherKeys(instances, selectedKey)
}
