/** What the event switcher reads of an event instance: its key and its status at the selection instant. */
export type SwitcherInstance = {
  key: string
  status: "running" | "upcoming" | "past"
}

export type SwitcherGroups<TInstance extends SwitcherInstance> = {
  /** Running now, in list order. */
  running: TInstance[]
  /** Not started yet, in list order (ascending by start). */
  upcoming: TInstance[]
  /** Ended, newest first. */
  past: TInstance[]
}

/** Splits a chronological instance list into the switcher's Running, Upcoming and Past groups. */
export function groupSwitcherInstances<TInstance extends SwitcherInstance>(
  instances: readonly TInstance[]
): SwitcherGroups<TInstance> {
  return {
    running: instances.filter((instance) => instance.status === "running"),
    upcoming: instances.filter((instance) => instance.status === "upcoming"),
    past: instances
      .filter((instance) => instance.status === "past")
      .toReversed(),
  }
}

export type AdjacentSwitcherKeys = {
  previous: string | null
  next: string | null
}

/**
 * The instances the Previous / Next buttons step to: the closest earlier or later entry in the
 * chronological list, or null at either end. With nothing shown (only past instances, no
 * selection) Previous opens the latest instance and Next is disabled.
 */
export function adjacentSwitcherKeys(
  instances: readonly SwitcherInstance[],
  selectedKey: string | null
): AdjacentSwitcherKeys {
  const index = instances.findIndex((instance) => instance.key === selectedKey)
  if (index === -1)
    return { previous: instances.at(-1)?.key ?? null, next: null }
  return {
    previous: instances[index - 1]?.key ?? null,
    next: instances[index + 1]?.key ?? null,
  }
}

/** "Oct 19 – 23, 2026" in the player's locale and timezone (end is the exclusive end instant). */
export function formatEventWindow(
  entry: { startUtc: string; endUtc: string },
  locale: string
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).formatRange(
    new Date(entry.startUtc),
    new Date(entry.endUtc)
  )
}
