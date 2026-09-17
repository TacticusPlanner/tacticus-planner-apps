import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { TokenAvailability } from "./token-availability"

const { useLiveQueryMock } = vi.hoisted(() => ({
  useLiveQueryMock: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn: () => unknown) => useLiveQueryMock(fn),
}))

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

function mockLiveQueries({
  liveProgress,
  metadata,
}: {
  liveProgress: unknown
  metadata: unknown
}) {
  // The component calls useLiveQuery twice, in order: getLiveProgress() then
  // getPlayerDataMetadata(). Distinguish calls by the querier's identity-agnostic call order.
  let call = 0
  useLiveQueryMock.mockImplementation(() => {
    call += 1
    return call === 1 ? liveProgress : metadata
  })
}

describe("TokenAvailability", () => {
  it("shows a loading state while player data has not resolved", () => {
    mockLiveQueries({ liveProgress: undefined, metadata: undefined })

    render(<TokenAvailability />)

    expect(screen.getByTestId("token-availability-loading")).toBeInTheDocument()
  })

  it("shows an empty state, not loading forever, when the account has never synced", () => {
    // getLiveProgress() resolves to `undefined` (no "live-progress" chunk at all) for an
    // account that's never synced. The component maps that to `null` so it's distinguishable
    // from useLiveQuery's own "still loading" `undefined` — this asserts the resolved-null case
    // renders the empty state instead of getting stuck on the loading state forever.
    mockLiveQueries({
      liveProgress: null,
      metadata: new Map(),
    })

    render(<TokenAvailability />)

    expect(screen.getByTestId("token-availability-empty")).toBeInTheDocument()
    expect(
      screen.queryByTestId("token-availability-loading")
    ).not.toBeInTheDocument()
  })

  it("shows an empty state when no token type has data", () => {
    mockLiveQueries({
      liveProgress: {
        gameModeTokens: {
          arena: null,
          guildRaid: null,
          onslaught: null,
          salvageRun: null,
        },
      },
      metadata: new Map([
        ["live-progress", { updatedAt: new Date(NOW).toISOString() }],
      ]),
    })

    render(<TokenAvailability />)

    expect(screen.getByTestId("token-availability-empty")).toBeInTheDocument()
  })

  it("renders a row per available token type and omits missing ones", () => {
    mockLiveQueries({
      liveProgress: {
        gameModeTokens: {
          arena: bucket(),
          guildRaid: {
            tokens: bucket(),
            bombTokens: bucket({ current: 1, max: 1 }),
          },
          onslaught: null,
          salvageRun: bucket(),
        },
      },
      metadata: new Map([
        ["live-progress", { updatedAt: new Date(NOW).toISOString() }],
      ]),
    })

    render(<TokenAvailability />)

    expect(screen.getByTestId("token-row-arena")).toBeInTheDocument()
    expect(screen.getByTestId("token-row-guildRaid")).toBeInTheDocument()
    expect(screen.getByTestId("token-row-bombTokens")).toBeInTheDocument()
    expect(screen.getByTestId("token-row-salvageRun")).toBeInTheDocument()
    expect(screen.queryByTestId("token-row-onslaught")).not.toBeInTheDocument()
  })

  it("shows the stale-sync banner when a token is capped and the last sync was over 5 minutes ago", () => {
    const staleSync = new Date(NOW - 6 * 60_000)
    mockLiveQueries({
      liveProgress: {
        gameModeTokens: {
          arena: bucket({ current: 5, max: 5 }),
          guildRaid: null,
          onslaught: null,
          salvageRun: null,
        },
      },
      metadata: new Map([
        ["live-progress", { updatedAt: staleSync.toISOString() }],
      ]),
    })
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    render(<TokenAvailability />)

    expect(
      screen.getByTestId("token-availability-stale-banner")
    ).toBeInTheDocument()

    vi.useRealTimers()
  })

  it("does not show the stale-sync banner when nothing is capped", () => {
    mockLiveQueries({
      liveProgress: {
        gameModeTokens: {
          arena: bucket({ current: 1, max: 5 }),
          guildRaid: null,
          onslaught: null,
          salvageRun: null,
        },
      },
      metadata: new Map([
        [
          "live-progress",
          { updatedAt: new Date(NOW - 6 * 60_000).toISOString() },
        ],
      ]),
    })

    render(<TokenAvailability />)

    expect(
      screen.queryByTestId("token-availability-stale-banner")
    ).not.toBeInTheDocument()
  })
})
