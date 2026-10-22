import { describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventProgress,
  LegendaryEventRosterUnit,
  LegendaryEventRunRecord,
  ReadState,
  RosterSnapshot,
} from "@/entities/legendary-event"
import {
  rosterAfterRun1,
  utharRun1Record,
  utharRun1Snapshot,
  utharRun2Record,
} from "@/test/fixtures/legendary-event-run-records"
import { utharEvent } from "@/test/fixtures/legendary-events"

import {
  buildLastRunClears,
  buildLastRunViewModel,
  historyDeltaCount,
  previousRunRecord,
  progressionStarsKey,
  teamLastRunClearedBattle,
  type LastRunInput,
} from "./last-run.view-model"

const roster = rosterAfterRun1 as unknown as LegendaryEventRosterUnit[]
const run3Record: LegendaryEventRunRecord = {
  ...utharRun2Record,
  id: "record-run-3",
  run: 3,
}
const retry = vi.fn()
// Every record's roster at the time, read.
const snapshots = (records: readonly LegendaryEventRunRecord[]) =>
  new Map(
    records.map((record): [string, ReadState<RosterSnapshot>] => [
      record.id,
      { status: "ready", data: utharRun1Snapshot, retry: () => {} },
    ])
  )
const ready = (
  records: LegendaryEventRunRecord[]
): ReadState<LegendaryEventRunRecord[]> => ({
  status: "ready",
  data: records,
  retry,
})
const progressIn = (run: number) =>
  ({ currentEventRun: run }) as unknown as LegendaryEventProgress

const build = (overrides: Partial<LastRunInput>) =>
  buildLastRunViewModel({
    enabled: true,
    records: ready([]),
    lifecycle: "active",
    progress: undefined,
    roster,
    rosters: snapshots([utharRun1Record, utharRun2Record, run3Record]),
    event: utharEvent,
    ...overrides,
  })

const runsOf = (view: ReturnType<typeof build>) =>
  view.kind === "ready"
    ? {
        previous: view.previous.run,
        earlier: view.earlier.map((history) => history.run),
      }
    : view.kind

describe("buildLastRunViewModel", () => {
  it("active event in its second run: run 1 is the previous run, no earlier runs", () => {
    const view = build({
      records: ready([utharRun2Record, utharRun1Record]),
      progress: progressIn(2),
    })
    expect(runsOf(view)).toEqual({ previous: 1, earlier: [] })
  })

  it("active event before its first sync of run 3: run 2 is previous and earlier runs stay hidden", () => {
    const view = build({
      records: ready([utharRun2Record, utharRun1Record]),
      progress: progressIn(3),
    })
    // Run 1 is an earlier run, which an active event does not list (design D6).
    expect(runsOf(view)).toEqual({ previous: 2, earlier: [] })
  })

  it("upcoming event: the newest is previous and the rest are earlier runs", () => {
    const view = build({
      records: ready([run3Record, utharRun2Record, utharRun1Record]),
      lifecycle: "upcoming",
      progress: progressIn(3),
    })
    expect(runsOf(view)).toEqual({ previous: 3, earlier: [2, 1] })
  })

  it("archived event lists the earlier runs too", () => {
    const view = build({
      records: ready([utharRun2Record, utharRun1Record]),
      lifecycle: "archived",
    })
    expect(runsOf(view)).toEqual({ previous: 2, earlier: [1] })
  })

  it("first recorded run: an active event whose only record is the current run shows nothing", () => {
    expect(
      build({ records: ready([utharRun1Record]), progress: progressIn(1) })
    ).toEqual({ kind: "hidden" })
  })

  it("no records at all: the note", () => {
    expect(build({ records: ready([]) })).toEqual({ kind: "noRecords" })
  })

  it("is loading while the records, the progress or the roster load", () => {
    expect(build({ records: { status: "loading", retry } })).toEqual({
      kind: "loading",
    })
    expect(
      build({ records: ready([utharRun1Record]), progress: "loading" })
    ).toEqual({ kind: "loading" })
    expect(
      build({ records: ready([utharRun1Record]), roster: "loading" })
    ).toEqual({ kind: "loading" })
  })

  it("reports a failed read with its retry", () => {
    expect(build({ records: { status: "error", retry } })).toEqual({
      kind: "error",
      retry,
    })
  })

  it("is hidden when signed out", () => {
    expect(
      build({ enabled: false, records: { status: "loading", retry } })
    ).toEqual({ kind: "hidden" })
  })

  it("asks for a roster sync when the roster cannot be read", () => {
    for (const value of ["error", undefined] as const) {
      const view = build({
        records: ready([utharRun1Record]),
        progress: progressIn(2),
        roster: value,
      })
      expect(view.kind === "ready" && view.previous.deltas).toEqual({
        kind: "noRoster",
      })
    }
  })

  it("reads the previous run's deltas from its roster at the time, as it loads or fails", () => {
    const records = ready([utharRun1Record])
    const deltasWith = (rosters: LastRunInput["rosters"]) => {
      const view = build({ records, progress: progressIn(2), rosters })
      return view.kind === "ready" ? view.previous.deltas : view.kind
    }
    expect(deltasWith(new Map())).toEqual({ kind: "snapshotLoading" })
    expect(
      deltasWith(new Map([["record-run-1", { status: "error", retry }]]))
    ).toEqual({ kind: "snapshotFailed", retry })
    expect(deltasWith(snapshots([utharRun1Record]))).toMatchObject({
      kind: "ready",
    })
  })

  it("names the previous run's record once the records and the progress are known", () => {
    const records = ready([utharRun2Record, utharRun1Record])
    const input = { enabled: true, records, lifecycle: "active" } as const
    expect(previousRunRecord({ ...input, progress: progressIn(2) })).toBe(
      utharRun1Record
    )
    expect(previousRunRecord({ ...input, progress: "loading" })).toBeUndefined()
    expect(
      previousRunRecord({ ...input, enabled: false, progress: progressIn(2) })
    ).toBeUndefined()
  })

  it("active event with failed or missing progress: hidden, since the newest record may be the current run", () => {
    for (const progress of ["error", undefined] as const) {
      expect(
        build({ records: ready([utharRun2Record, utharRun1Record]), progress })
      ).toEqual({ kind: "hidden" })
    }
  })

  it("archived or upcoming events need no progress to pick the previous run", () => {
    for (const lifecycle of ["archived", "upcoming"] as const) {
      const view = build({
        records: ready([utharRun2Record, utharRun1Record]),
        lifecycle,
        progress: "error",
      })
      expect(runsOf(view)).toEqual({ previous: 2, earlier: [1] })
    }
  })

  it("counts the previous run's roster changes for analytics", () => {
    const view = build({
      records: ready([utharRun1Record]),
      progress: progressIn(2),
    })
    expect(view.kind === "ready" && historyDeltaCount(view.previous)).toBe(2)
  })
})

describe("buildLastRunClears", () => {
  const input = {
    enabled: true,
    lifecycle: "active" as const,
    progress: progressIn(2),
  }

  it("maps the previous run's teams to their cleared battle", () => {
    const clears = buildLastRunClears({
      ...input,
      records: ready([utharRun2Record, utharRun1Record]),
    })
    expect(teamLastRunClearedBattle(clears, "team-ultras", "alpha")).toBe(2)
    expect(teamLastRunClearedBattle(clears, "team-melee", "alpha")).toBe(3)
    // Another lane, or a team created since: no line.
    expect(teamLastRunClearedBattle(clears, "team-melee", "beta")).toBe(
      undefined
    )
    expect(teamLastRunClearedBattle(clears, "team-new", "alpha")).toBe(
      undefined
    )
  })

  it("is undefined on an active event with failed or missing progress", () => {
    for (const progress of ["error", undefined] as const) {
      expect(
        buildLastRunClears({
          ...input,
          progress,
          records: ready([utharRun2Record, utharRun1Record]),
        })
      ).toBeUndefined()
    }
  })

  it("is undefined while the records load, after a failed read, or signed out", () => {
    expect(
      buildLastRunClears({ ...input, records: { status: "loading", retry } })
    ).toBeUndefined()
    expect(
      buildLastRunClears({ ...input, records: { status: "error", retry } })
    ).toBeUndefined()
    expect(
      buildLastRunClears({
        ...input,
        enabled: false,
        records: ready([utharRun1Record]),
      })
    ).toBeUndefined()
  })
})

describe("progressionStarsKey", () => {
  it("reads the stars part of a progression", () => {
    expect(progressionStarsKey("Legendary:RedFiveStars")).toBe("RedFiveStars")
    expect(progressionStarsKey("Mythic:OneBlueStar")).toBe("OneBlueStar")
  })
})
