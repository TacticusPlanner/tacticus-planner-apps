import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { GuildRaidsViewModel } from "../guild-raid-status-view-model"
import { GuildRaidStatusRegion } from "./guild-raid-status-region"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const NOW = Date.now()

function activeViewModel(
  overrides: Partial<
    Extract<GuildRaidsViewModel["status"], { kind: "active" }>
  > = {}
): GuildRaidsViewModel {
  return {
    status: {
      kind: "active",
      freshness: "fresh",
      observedAtMs: NOW - 5 * 60_000,
      lastGuildSyncSucceededAtMs: NOW - 10 * 60_000,
      catalogWarning: false,
      season: {
        seasonNumber: 12,
        tierNumber: 3,
        setNumber: 2,
        setCount: 3,
        difficulty: "Epic",
        endsAt: { kind: "unavailable" },
        boss: {
          unitSetId: "GuildBoss4Boss1OrksGhazghkull",
          name: "Ghazghkull",
          portraitSrc: undefined,
          remainingHp: 1000,
          maximumHp: 5000,
          isUpcoming: false,
        },
        primes: [
          {
            encounterIndex: 1,
            unitSetId: "GuildBoss4MiniBoss1OrksBigMek",
            name: "Gibbascrapz",
            portraitSrc: undefined,
            hp: { kind: "known", remaining: 200, max: 800 },
            modifiers: [
              {
                modifierId: "mod-1",
                description: { kind: "amount", text: "−15% damage" },
                activation: { kind: "known", remainingHp: 500, active: false },
              },
              {
                modifierId: "mod-2",
                description: {
                  kind: "effect",
                  direction: "reduces",
                  label: "movement",
                },
                activation: { kind: "unknown" },
              },
            ],
          },
          {
            encounterIndex: 2,
            unitSetId: "GuildBoss4MiniBoss2OrksNob",
            name: "Tanksmasha",
            portraitSrc: undefined,
            hp: { kind: "known", remaining: 300, max: 900 },
            modifiers: [
              {
                modifierId: "mod-3",
                description: { kind: "amount", text: "−10% armor" },
                activation: { kind: "known", remainingHp: 700, active: true },
              },
            ],
          },
        ],
      },
      ...overrides,
    },
    resources: { kind: "unavailable" },
    refresh: vi.fn(),
    isRefreshing: false,
    hasRefreshError: false,
  }
}

describe("GuildRaidStatusRegion", () => {
  it("renders the loading state", () => {
    const viewModel: GuildRaidsViewModel = {
      status: { kind: "loading" },
      resources: { kind: "unavailable" },
      refresh: vi.fn(),
      isRefreshing: false,
      hasRefreshError: false,
    }
    render(<GuildRaidStatusRegion isMobile={false} viewModel={viewModel} />)
    expect(screen.getByTestId("guild-raid-status-loading")).toBeInTheDocument()
  })

  it("renders the error state with a retry action", () => {
    const retry = vi.fn()
    const viewModel: GuildRaidsViewModel = {
      status: { kind: "error", retry },
      resources: { kind: "unavailable" },
      refresh: vi.fn(),
      isRefreshing: false,
      hasRefreshError: false,
    }
    render(<GuildRaidStatusRegion isMobile={false} viewModel={viewModel} />)
    expect(screen.getByTestId("guild-raid-status-error")).toBeInTheDocument()
  })

  it("renders the never-observed syncing state", () => {
    const viewModel: GuildRaidsViewModel = {
      status: { kind: "neverObserved" },
      resources: { kind: "unavailable" },
      refresh: vi.fn(),
      isRefreshing: true,
      hasRefreshError: false,
    }
    render(<GuildRaidStatusRegion isMobile={false} viewModel={viewModel} />)
    expect(
      screen.getByTestId("guild-raid-status-never-observed")
    ).toBeInTheDocument()
  })

  it("renders the no-active-season message", () => {
    const viewModel: GuildRaidsViewModel = {
      status: {
        kind: "noActiveSeason",
        freshness: "fresh",
        observedAtMs: NOW,
        lastGuildSyncSucceededAtMs: NOW,
      },
      resources: { kind: "unavailable" },
      refresh: vi.fn(),
      isRefreshing: false,
      hasRefreshError: false,
    }
    render(<GuildRaidStatusRegion isMobile={false} viewModel={viewModel} />)
    expect(
      screen.getByTestId("guild-raid-status-no-active-season")
    ).toBeInTheDocument()
  })

  it("renders the boss card first, followed by the two prime cards in encounter order", () => {
    render(
      <GuildRaidStatusRegion isMobile={false} viewModel={activeViewModel()} />
    )

    expect(screen.getByTestId("guild-raid-status-card")).toBeInTheDocument()
    const cards = screen.getAllByTestId(/guild-raid-(prime|boss)-card/)
    expect(cards.map((card) => card.textContent)).toEqual([
      expect.stringContaining("Ghazghkull"),
      expect.stringContaining("Gibbascrapz"),
      expect.stringContaining("Tanksmasha"),
    ])
  })

  it("shows the catalog warning banner when the view model flags one", () => {
    render(
      <GuildRaidStatusRegion
        isMobile={false}
        viewModel={activeViewModel({ catalogWarning: true })}
      />
    )
    expect(screen.getByTestId("guild-raid-catalog-warning")).toBeInTheDocument()
  })

  it("omits the right prime slot entirely when the season only has one prime", () => {
    const viewModel = activeViewModel()
    const status = viewModel.status
    if (status.kind !== "active") throw new Error("expected active status")
    const [leftPrime] = status.season.primes

    render(
      <GuildRaidStatusRegion
        isMobile={false}
        viewModel={activeViewModel({
          season: { ...status.season, primes: [leftPrime!] },
        })}
      />
    )

    expect(screen.getAllByTestId("guild-raid-prime-card")).toHaveLength(1)
    expect(screen.getByTestId("guild-raid-boss-card")).toBeInTheDocument()
  })

  it("renders the compact mobile card layout when isMobile is true", () => {
    render(
      <GuildRaidStatusRegion isMobile={true} viewModel={activeViewModel()} />
    )

    // Compact mobile cards drop the season-ends line that only the desktop layout renders.
    expect(
      screen.queryByTestId("guild-raid-season-ends")
    ).not.toBeInTheDocument()
    expect(screen.getByText("Ghazghkull")).toBeInTheDocument()
  })
})
