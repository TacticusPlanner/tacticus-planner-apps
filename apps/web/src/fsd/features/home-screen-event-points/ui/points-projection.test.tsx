import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"
import {
  hseFixtureBuckets,
  hseFixturePlayer,
} from "@/test/fixtures/hse-event-points"
import { hseInstance, hseTestI18n, renderHse } from "@/test/fixtures/hse-render"

let i18n: I18n
beforeAll(async () => {
  i18n = await hseTestI18n()
})
beforeEach(() => {
  window.localStorage.clear()
  setViewportWidth(1024)
})
afterEach(() => vi.unstubAllGlobals())

// The spec's running example: buckets synced 48 hours before the 2026-10-23T08:00Z end.
const syncedRunning = {
  player: () =>
    hseFixturePlayer({ observedAtMs: Date.parse("2026-10-21T08:00:00Z") }),
}

const milestonesInput = () =>
  screen.getByTestId("hse-projection-milestones-done-input")
const pointsInput = () =>
  screen.getByTestId("hse-projection-points-in-milestone-input")
/** Types the game's progress: milestones done, then points in the current milestone. */
async function enterProgress(milestones: number, points: number) {
  await userEvent.clear(milestonesInput())
  await userEvent.type(milestonesInput(), String(milestones))
  await userEvent.clear(pointsInput())
  await userEvent.type(pointsInput(), String(points))
}

const total = (id: string) => screen.getByTestId(`hse-projection-${id}`)
const row = (mode: string) => screen.getByTestId(`hse-projection-mode-${mode}`)
const cellsOf = (mode: string) =>
  within(row(mode))
    .getAllByRole("cell")
    .map((cell) => cell.textContent)

describe("PointsProjection: Psyker Boost worked examples", () => {
  it("upcoming: 58 / 15 / 14 tokens, 8.8 kills per token, 758 points projected", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))

    expect(cellsOf("Arena")).toEqual([
      "Arena",
      "58",
      "kills",
      "1 per kill",
      "290 pts",
    ])
    expect(cellsOf("Onslaught")).toEqual([
      "Onslaught",
      "15",
      "kills",
      "1 per kill",
      "300 pts",
    ])
    expect(cellsOf("SalvageRun")).toEqual([
      "Salvage Run",
      "14",
      "kills",
      "1 per kill",
      "168 pts",
    ])
    expect(screen.getByTestId("hse-projection-average-Arena")).toHaveValue(5)
    expect(screen.getByTestId("hse-projection-average-Onslaught")).toHaveValue(
      20
    )
    expect(screen.getByTestId("hse-projection-average-SalvageRun")).toHaveValue(
      12
    )

    expect(total("target")).toHaveTextContent("765 pts")
    expect(total("remaining")).toHaveTextContent("765 pts")
    expect(total("units")).toHaveTextContent("765 kills")
    expect(total("required")).toHaveTextContent("8.8 kills per token")
    expect(total("projected")).toHaveTextContent("758 pts")
    expect(total("projected")).toHaveTextContent(
      "18 of 19 milestones (705 pts)"
    )
    expect(total("projected")).toHaveTextContent("7 pts to the next milestone")
    // Upcoming: no progress inputs.
    expect(
      screen.queryByTestId("hse-projection-milestones-done-input")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("hse-projection-points-in-milestone-input")
    ).not.toBeInTheDocument()
  })

  it("running: 28 / 7 / 8 tokens; 10 milestones (270) plus 30 is 300 so far, 10.9 kills per token and 676 projected", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: syncedRunning,
    })

    expect(cellsOf("Arena")[1]).toBe("28")
    expect(cellsOf("Onslaught")[1]).toBe("7")
    expect(cellsOf("SalvageRun")[1]).toBe("8")

    await enterProgress(10, 30)

    expect(total("progress")).toHaveTextContent(
      "/ 50 pts in the current milestone"
    )
    expect(total("points-so-far")).toHaveTextContent("300 pts")
    expect(total("remaining")).toHaveTextContent("465 pts")
    expect(total("units")).toHaveTextContent("465 kills")
    expect(total("required")).toHaveTextContent("10.9 kills per token")
    expect(cellsOf("Arena")[4]).toBe("140 pts")
    expect(cellsOf("Onslaught")[4]).toBe("140 pts")
    expect(cellsOf("SalvageRun")[4]).toBe("96 pts")
    expect(total("projected")).toHaveTextContent("676 pts")
    expect(total("projected")).toHaveTextContent(
      "17 of 19 milestones (645 pts)"
    )
    expect(total("projected")).toHaveTextContent("29 pts to the next milestone")
    expect(screen.getByTestId("hse-projection-note-sync")).toHaveTextContent(
      /^Tokens from your sync .+, assuming you spend them/
    )
  })

  it("says the final milestone is reached once every milestone is done", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: syncedRunning,
    })
    // 19 milestones (765) plus 35 toward the first 50-point repeat.
    await enterProgress(19, 35)

    expect(total("points-so-far")).toHaveTextContent("800 pts")

    expect(total("remaining")).toHaveTextContent(
      "Final milestone reached · 0 endless rewards so far"
    )
    expect(total("required")).toHaveTextContent("0 kills per token")
  })

  it("shows repeats past the final milestone", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))
    // 58 x 10 + 15 x 20 + 14 x 0 = 880: floor((880 - 765) / 50) = 2
    const arena = screen.getByTestId("hse-projection-average-Arena")
    await userEvent.clear(arena)
    await userEvent.type(arena, "10")
    const salvage = screen.getByTestId("hse-projection-average-SalvageRun")
    await userEvent.clear(salvage)
    await userEvent.type(salvage, "0")

    expect(total("projected")).toHaveTextContent("880 pts")
    expect(total("projected")).toHaveTextContent(
      "19 of 19 milestones (765 pts)"
    )
    expect(total("projected")).toHaveTextContent(
      "2 endless rewards beyond the final milestone"
    )
    expect(total("projected")).toHaveTextContent(
      "35 pts to the next endless reward"
    )
  })
})

describe("PointsProjection: inputs", () => {
  it("lets the progress inputs be cleared and retyped without a leading zero", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: syncedRunning,
    })
    await userEvent.type(milestonesInput(), "10")
    expect(total("remaining")).toHaveTextContent("495 pts")

    await userEvent.clear(milestonesInput())
    expect(milestonesInput()).toHaveDisplayValue("")
    expect(total("remaining")).toHaveTextContent("765 pts")

    await userEvent.type(pointsInput(), "3")
    expect(pointsInput()).toHaveDisplayValue("3")
    expect(total("remaining")).toHaveTextContent("762 pts")
  })

  it("counts points in a milestone only up to that milestone's points", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: syncedRunning,
    })
    // The first milestone is 20 points: 35 counts as 20.
    await userEvent.type(pointsInput(), "35")
    expect(total("progress")).toHaveTextContent(
      "/ 20 pts in the current milestone"
    )
    expect(total("points-so-far")).toHaveTextContent("20 pts")
  })

  it("says the sync time is unknown instead of an empty time", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: { player: () => hseFixturePlayer({ observedAtMs: null }) },
    })
    expect(screen.getByTestId("hse-projection-note-sync")).toHaveTextContent(
      /^Your sync time is unknown, so tokens are counted from now/
    )
  })

  it("keeps an edited average per definition across a reload", async () => {
    const { unmount } = renderHse(
      i18n,
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )
    const onslaught = screen.getByTestId("hse-projection-average-Onslaught")
    await userEvent.clear(onslaught)
    await userEvent.type(onslaught, "25")
    unmount()

    const reload = renderHse(
      i18n,
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )
    expect(screen.getByTestId("hse-projection-average-Onslaught")).toHaveValue(
      25
    )
    reload.unmount()

    renderHse(i18n, hseInstance("hse-trait-boost-flying", "upcoming"))
    expect(screen.getByTestId("hse-projection-average-Onslaught")).toHaveValue(
      20
    )
  })

  it("hides the projected points while an average is cleared", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))
    await userEvent.clear(screen.getByTestId("hse-projection-average-Arena"))

    expect(total("projected")).toHaveTextContent(
      "Enter an average for every mode to see the projected points."
    )
    expect(total("required")).toHaveTextContent("8.8 kills per token")
  })
})

describe("PointsProjection: other events and states", () => {
  it("sums Faction Boost's trackers with a note: 3 per Arena kill, 334 kills", () => {
    renderHse(
      i18n,
      hseInstance("hse-faction-boost", "upcoming", {
        targetFactionId: "DarkAngels",
      })
    )
    expect(cellsOf("Arena")[3]).toBe("3 per kill")
    expect(total("units")).toHaveTextContent("334 kills")
    expect(
      screen.getByTestId("hse-projection-note-summed-Arena")
    ).toHaveTextContent(
      "Arena: 2 point rules apply, so “3 per kill” assumes each one matches all of them."
    )
  })

  it("counts Faction Focus in battles: fixed average, no units to defeat, points per token", () => {
    renderHse(
      i18n,
      hseInstance("hse-faction-focus", "upcoming", {
        hseVariant: "october-2026",
      })
    )
    expect(cellsOf("Arena")).toEqual([
      "Arena",
      "58",
      "1 battle",
      "7 per battle",
      "406 pts",
    ])
    expect(cellsOf("Onslaught")[3]).toBe("20 per battle")
    expect(screen.queryByTestId("hse-projection-units")).not.toBeInTheDocument()
    // 1220 / 87 = 14.02 -> 14.1
    expect(total("required")).toHaveTextContent("14.1 event points per token")
    // 58 x 7 + 15 x 20 + 14 x 20 = 406 + 300 + 280 = 986
    expect(total("projected")).toHaveTextContent("986 pts")
    expect(
      screen.getByTestId("hse-projection-note-battles")
    ).toBeInTheDocument()
  })

  it("lets the player enter Faction Focus's Tournament Arena tokens, which the sync does not cover", async () => {
    renderHse(
      i18n,
      hseInstance("hse-faction-focus", "upcoming", {
        hseVariant: "october-2026",
      })
    )
    expect(cellsOf("TournamentArena")).toEqual([
      "Tournament Arena",
      "",
      "1 battle",
      "7 per battle",
      "0 pts",
    ])
    expect(
      screen.getByTestId("hse-projection-note-manual-tokens")
    ).toHaveTextContent(/^Tournament Arena tokens are not synced/)
    const tokens = screen.getByTestId(
      "hse-projection-tokens-input-TournamentArena"
    )
    expect(tokens).toHaveAccessibleName("Tokens for Tournament Arena")
    await userEvent.type(tokens, "20")
    // 986 + 20 x 7 = 1126; 1220 / 107 = 11.40 -> 11.5
    expect(within(row("TournamentArena")).getByText("140 pts")).toBeVisible()
    expect(total("projected")).toHaveTextContent("1,126 pts")
    expect(total("required")).toHaveTextContent("11.5 event points per token")

    // A fractional count is stored as a whole number and shown as one once the field is left.
    await userEvent.clear(tokens)
    await userEvent.type(tokens, "12.7")
    await userEvent.tab()
    expect(tokens).toHaveValue(12)
  })

  it("asks for Defeat Waves' averages before projecting points", async () => {
    renderHse(i18n, hseInstance("hse-defeat-waves", "upcoming"))

    expect(
      screen.queryByTestId("hse-projection-mode-Arena")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("hse-projection-average-Onslaught")).toHaveValue(
      null
    )
    // 340 / (15 + 14) = 11.72 -> 11.8
    expect(total("required")).toHaveTextContent("11.8 waves per token")
    expect(total("projected")).toHaveTextContent(
      "Enter an average for every mode"
    )

    await userEvent.type(
      screen.getByTestId("hse-projection-average-Onslaught"),
      "10"
    )
    await userEvent.type(
      screen.getByTestId("hse-projection-average-SalvageRun"),
      "5"
    )
    expect(total("projected")).toHaveTextContent("220 pts")
  })

  it("leaves out a mode that is not unlocked, with a note", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"), {
      reads: {
        player: () =>
          hseFixturePlayer({
            buckets: { ...hseFixtureBuckets, Onslaught: null },
          }),
      },
    })
    expect(
      screen.queryByTestId("hse-projection-mode-Onslaught")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("hse-projection-note-locked")).toHaveTextContent(
      "Not unlocked yet, left out: Onslaught."
    )
  })

  it("says so when no scoring mode is unlocked", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"), {
      reads: {
        player: () =>
          hseFixturePlayer({
            buckets: { Arena: null, Onslaught: null, SalvageRun: null },
          }),
      },
    })
    expect(screen.getByTestId("hse-projection-all-locked")).toHaveTextContent(
      "None of the modes this event scores in is unlocked yet: Arena, Onslaught, and Salvage Run."
    )
  })

  it("covers Warp Surge's Arena only and points campaign raids to the farm list", () => {
    renderHse(i18n, hseInstance("hse-warp-surge", "running"), {
      reads: syncedRunning,
      hasRaidLists: true,
    })
    expect(screen.getAllByTestId(/^hse-projection-mode-/)).toHaveLength(1)
    expect(cellsOf("Arena")[3]).toBe("25 per kill")
    expect(
      screen.getByTestId("hse-projection-note-campaign")
    ).toHaveTextContent(
      "Campaign raids also earn points in this event; they are planned in the farm list below."
    )
    expect(screen.getByTestId("hse-projection-note-enemy")).toBeInTheDocument()
  })

  it("states that only some enemies count for For the Emperor", () => {
    renderHse(i18n, hseInstance("hse-for-the-emperor", "upcoming"))
    expect(screen.getByTestId("hse-projection-note-enemy")).toBeInTheDocument()
    expect(
      screen.queryByTestId("hse-projection-note-campaign")
    ).not.toBeInTheDocument()
  })

  it("is not shown for a past instance, a Global event or a guild event", () => {
    const past = renderHse(i18n, hseInstance("hse-trait-boost-psyker", "past"))
    expect(screen.getByTestId("hse-event-details")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
    past.unmount()

    const global = renderHse(
      i18n,
      hseInstance("hse-global-operation-imperator", "running")
    )
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
    global.unmount()

    renderHse(i18n, hseInstance("hse-arsenal-of-war", "running"))
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
  })

  it("shows an inline error, keeping the details, when the player data cannot be read", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: { player: () => ({ status: "error" }) },
    })
    expect(screen.getByTestId("hse-projection-error")).toHaveTextContent(
      "Your synced tokens could not be read."
    )
    expect(screen.getByTestId("hse-milestones")).toBeInTheDocument()
  })

  it("shows a loading state while the player data loads", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: { player: () => undefined },
    })
    expect(screen.getByTestId("hse-projection-loading")).toBeInTheDocument()
  })
})

describe("PointsProjection: layouts", () => {
  it("lays the modes out as a table with mode, tokens, average, points per unit and points on desktop", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))
    const table = screen.getByTestId("hse-projection-table")
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent)
    ).toEqual([
      "Mode",
      "Tokens",
      "Average per token",
      "Points per unit",
      "Points",
    ])
    expect(screen.queryByTestId("hse-projection-rows")).not.toBeInTheDocument()
  })

  it("stacks one row per mode under the totals on mobile", () => {
    setViewportWidth(420)
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))

    expect(screen.queryByTestId("hse-projection-table")).not.toBeInTheDocument()
    const rows = screen.getByTestId("hse-projection-rows")
    expect(
      screen
        .getByTestId("hse-projection-totals")
        .compareDocumentPosition(rows) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    const arena = row("Arena")
    expect(arena).toHaveTextContent("58 tokens")
    expect(
      within(arena).getByTestId("hse-projection-average-Arena")
    ).toHaveValue(5)
    expect(arena).toHaveTextContent("290 pts")
  })
})
