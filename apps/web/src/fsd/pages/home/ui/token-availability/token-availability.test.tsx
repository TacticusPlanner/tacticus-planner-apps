import { replacePlayerDataChunk } from "@workspace/player-data/testing"
import { afterEach, describe, expect, it, vi } from "vitest"

import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { render, screen } from "@/test/render"

import { TokenAvailability } from "./token-availability"

function bucket(
  overrides: Partial<{
    current: number
    max: number
    nextTokenInSeconds: number
  }> = {}
) {
  return {
    current: 3,
    max: 5,
    nextTokenInSeconds: 1200,
    regenDelayInSeconds: 3600,
    ...overrides,
  }
}

const NOW = Date.parse("2026-07-12T12:00:00.000Z")

// Stores the "live-progress" chunk as a sync observed at `observedAtMs` would.
function seedLiveProgress(liveProgress: unknown, observedAtMs = NOW) {
  return replacePlayerDataChunk("live-progress", liveProgress, {
    key: "live-progress",
    hash: "live-progress-test",
    schemaVersion: 1,
    updatedAt: new Date(observedAtMs).toISOString(),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("TokenAvailability", () => {
  it("shows a loading state while player data has not resolved", () => {
    render(<TokenAvailability />)

    expect(screen.getByTestId("token-availability-loading")).toHaveTextContent(
      "Loading token status…"
    )
  })

  it("shows an empty state, not loading forever, when the account has never synced", async () => {
    // A never-synced account has no "live-progress" chunk at all (`usePlayerChunk` yields `null`);
    // this asserts that resolved-null case renders the empty state instead of loading forever.
    render(<TokenAvailability />)

    expect(
      await screen.findByTestId("token-availability-empty")
    ).toHaveTextContent("No token data available yet.")
    expect(
      screen.queryByTestId("token-availability-loading")
    ).not.toBeInTheDocument()
  })

  it("shows the local read failure with Retry when player data cannot be read", async () => {
    const reads = spyOnIndexedDbReads()
    reads.fail("tacticus-planner-player-data")

    render(<TokenAvailability />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't read this data from your device."
    )
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })

  it("shows an empty state when no token type has data", async () => {
    await seedLiveProgress({
      gameModeTokens: {
        arena: null,
        guildRaid: null,
        onslaught: null,
        salvageRun: null,
      },
    })

    render(<TokenAvailability />)

    expect(
      await screen.findByTestId("token-availability-empty")
    ).toBeInTheDocument()
  })

  it("renders a row per available token type and omits missing ones", async () => {
    await seedLiveProgress({
      gameModeTokens: {
        arena: bucket(),
        guildRaid: {
          tokens: bucket(),
          bombTokens: bucket({ current: 1, max: 1 }),
        },
        onslaught: null,
        salvageRun: bucket(),
      },
    })

    render(<TokenAvailability />)

    expect(await screen.findByTestId("token-row-arena")).toBeInTheDocument()
    expect(screen.getByTestId("token-row-guildRaid")).toBeInTheDocument()
    expect(screen.getByTestId("token-row-bombTokens")).toBeInTheDocument()
    expect(screen.getByTestId("token-row-salvageRun")).toBeInTheDocument()
    expect(screen.queryByTestId("token-row-onslaught")).not.toBeInTheDocument()
  })

  it("shows a pending token's exact countdown without a relative-time label", async () => {
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW)
    await seedLiveProgress(
      {
        gameModeTokens: {
          arena: bucket({ nextTokenInSeconds: 1200 }),
          guildRaid: null,
          onslaught: null,
          salvageRun: null,
        },
      },
      NOW - 300_000
    )

    render(<TokenAvailability />)

    const row = await screen.findByTestId("token-row-arena")
    expect(row).toHaveTextContent("0:15:00")
    expect(row).not.toHaveTextContent(/Next in/)
    dateNowSpy.mockRestore()
  })

  it("styles a capped token distinctly from a counting-down one", async () => {
    await seedLiveProgress({
      gameModeTokens: {
        arena: bucket({ current: 5, max: 5 }),
        guildRaid: null,
        onslaught: null,
        salvageRun: null,
      },
    })

    render(<TokenAvailability />)

    const row = await screen.findByTestId("token-row-arena")
    expect(row).toHaveTextContent("Capped")
    expect(row.querySelector("img")).toHaveClass("animate-pulse")
  })

  it("does not apply capped styling to a token still counting down", async () => {
    await seedLiveProgress({
      gameModeTokens: {
        arena: bucket({ current: 1, max: 5 }),
        guildRaid: null,
        onslaught: null,
        salvageRun: null,
      },
    })

    render(<TokenAvailability />)

    const row = await screen.findByTestId("token-row-arena")
    expect(row.querySelector("img")).not.toHaveClass("animate-pulse")
  })
})
