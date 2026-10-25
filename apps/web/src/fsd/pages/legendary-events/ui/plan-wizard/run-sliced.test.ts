import { describe, expect, it } from "vitest"

import { runSliced, type SliceClock, type SliceScheduler } from "./run-sliced"

/** A fake clock: every `next()` costs `stepMs`; scheduled slices run when `flush` is called. */
function fakeClock(stepMs: number) {
  let time = 0
  const queue: { kind: "normal" | "idle"; run: () => void }[] = []
  const scheduler =
    (kind: "normal" | "idle", budget: number): SliceScheduler =>
    (work) => {
      const entry = { kind, run: () => work(time + budget) }
      queue.push(entry)
      return () => {
        const index = queue.indexOf(entry)
        if (index !== -1) queue.splice(index, 1)
      }
    }
  const clock: SliceClock = {
    now: () => time,
    schedule: scheduler("normal", 8),
    scheduleIdle: scheduler("idle", 3),
  }
  return {
    clock,
    tick: () => {
      time += stepMs
    },
    queue,
    flush: () => queue.shift()?.run(),
  }
}

function* counting(steps: number, tick: () => void) {
  for (let index = 0; index < steps; index++) {
    tick()
    yield index
  }
  return "done"
}

describe("runSliced", () => {
  it("stops each slice once its deadline has passed", () => {
    const fake = fakeClock(2.3)
    const seen: number[] = []
    let done: string | null = null
    runSliced(counting(10, fake.tick), {
      clock: fake.clock,
      onYield: (value) => seen.push(value),
      onDone: (value) => {
        done = value
      },
    })
    expect(seen).toEqual([])
    fake.flush()
    // 2.3, 4.6, 6.9 are under 8 ms; the fourth step (9.2 ms) ends the slice.
    expect(seen).toEqual([0, 1, 2, 3])
    fake.flush()
    expect(seen).toHaveLength(8)
    fake.flush()
    expect(seen).toHaveLength(10)
    expect(done).toBe("done")
    expect(fake.queue).toHaveLength(0)
  })

  it("stops when cancelled", () => {
    const fake = fakeClock(2.3)
    const seen: number[] = []
    const run = runSliced(counting(10, fake.tick), {
      clock: fake.clock,
      onYield: (value) => seen.push(value),
      onDone: () => undefined,
    })
    fake.flush()
    run.cancel()
    expect(fake.queue).toHaveLength(0)
    expect(seen).toHaveLength(4)
  })

  it("schedules later slices at idle priority, stopping at the idle deadline", () => {
    const fake = fakeClock(2)
    const seen: number[] = []
    const run = runSliced(counting(10, fake.tick), {
      clock: fake.clock,
      onYield: (value) => seen.push(value),
      onDone: () => undefined,
    })
    run.lowerPriority()
    fake.flush()
    expect(seen).toHaveLength(4)
    expect(fake.queue[0]?.kind).toBe("idle")
    fake.flush()
    // The fake idle period has 3 ms: two steps of 2 ms.
    expect(seen).toHaveLength(6)
  })
})
