/** How long one slice of the search may run before it yields to the browser (spec: the search runs
 *  in slices). */
export const SLICE_BUDGET_MS = 8
/** The longest an idle slice waits for an idle period before it runs anyway. */
const IDLE_TIMEOUT_MS = 1000

/** Runs `work` in a later task and returns a cancel; `work` receives the time it may run until. */
export type SliceScheduler = (work: (deadlineMs: number) => void) => () => void

export interface SliceClock {
  now: () => number
  /** Normal priority: as soon as the browser has handled pending input. */
  schedule: SliceScheduler
  /** Idle priority: in an idle period, stopping at its deadline. */
  scheduleIdle: SliceScheduler
}

/** The browser's schedulers: a `MessageChannel` post (no timer clamping) for normal priority, and
 *  `requestIdleCallback` for idle priority where it exists, else the normal schedule (never a
 *  fixed timer gap). */
export function browserSliceClock(): SliceClock {
  const now = () => performance.now()
  const schedule: SliceScheduler = (work) => {
    const channel = new MessageChannel()
    let cancelled = false
    channel.port1.onmessage = () => {
      channel.port1.close()
      if (!cancelled) work(now() + SLICE_BUDGET_MS)
    }
    channel.port2.postMessage(null)
    return () => {
      cancelled = true
      channel.port1.close()
    }
  }
  const scheduleIdle: SliceScheduler =
    typeof window.requestIdleCallback === "function"
      ? (work) => {
          const handle = window.requestIdleCallback(
            (deadline) =>
              work(
                now() +
                  (deadline.didTimeout
                    ? SLICE_BUDGET_MS
                    : Math.min(SLICE_BUDGET_MS, deadline.timeRemaining()))
              ),
            { timeout: IDLE_TIMEOUT_MS }
          )
          return () => window.cancelIdleCallback(handle)
        }
      : schedule
  return { now, schedule, scheduleIdle }
}

export interface SlicedRun {
  cancel: () => void
  /** Later slices run at idle priority. */
  lowerPriority: () => void
}

/**
 * Drives `iterator` in slices: each slice calls `next()` until its deadline has passed, then
 * schedules the next slice, so no slice runs longer than its budget plus one step. `onYield` sees
 * every yielded value, `onDone` the return value.
 */
export function runSliced<Y, R>(
  iterator: Iterator<Y, R>,
  {
    clock,
    onYield,
    onDone,
  }: {
    clock: SliceClock
    onYield: (value: Y) => void
    onDone: (value: R) => void
  }
): SlicedRun {
  let idle = false
  let cancelCurrent: () => void = () => {}
  let stopped = false
  const slice = (deadlineMs: number) => {
    do {
      const next = iterator.next()
      if (next.done) {
        stopped = true
        onDone(next.value)
        return
      }
      onYield(next.value)
      if (stopped) return
    } while (clock.now() < deadlineMs)
    cancelCurrent = (idle ? clock.scheduleIdle : clock.schedule)(slice)
  }
  cancelCurrent = clock.schedule(slice)
  return {
    cancel: () => {
      stopped = true
      cancelCurrent()
    },
    lowerPriority: () => {
      idle = true
    },
  }
}
