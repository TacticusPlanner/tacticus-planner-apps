import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { GuildRaidSeasonView } from "../guild-raid-status-view-model"
import { GuildRaidBossCard } from "./guild-raid-boss-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

function season(
  overrides: Partial<GuildRaidSeasonView> = {}
): GuildRaidSeasonView {
  return {
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
    primes: [],
    ...overrides,
  }
}

describe("GuildRaidBossCard", () => {
  it("renders the boss label, name, difficulty, position, and HP on desktop", () => {
    render(<GuildRaidBossCard isMobile={false} season={season()} />)

    expect(screen.getByText("guildRaids.status.bossLabel")).toBeInTheDocument()
    expect(screen.getByText("Ghazghkull")).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-difficulty-badge")).toHaveTextContent(
      "guildRaids.status.difficulty.epic"
    )
    expect(screen.getByTestId("guild-raid-position-label")).toHaveTextContent(
      '"tier":3'
    )
    expect(screen.getByTestId("guild-raid-boss-hp")).toHaveTextContent(
      "guildRaids.status.hp"
    )
    expect(screen.getByTestId("guild-raid-season-ends")).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-boss-upcoming-badge")
    ).not.toBeInTheDocument()
  })

  it("shows the upcoming badge and unavailable HP fallback is not fabricated when boss is upcoming", () => {
    render(
      <GuildRaidBossCard
        isMobile={false}
        season={season({
          boss: {
            unitSetId: "GuildBoss4Boss1OrksGhazghkull",
            name: "Ghazghkull",
            portraitSrc: undefined,
            remainingHp: 5000,
            maximumHp: 5000,
            isUpcoming: true,
          },
        })}
      />
    )

    expect(
      screen.getByTestId("guild-raid-boss-upcoming-badge")
    ).toBeInTheDocument()
  })

  it("renders a compact single-row layout without the season-ends line on mobile", () => {
    render(<GuildRaidBossCard isMobile={true} season={season()} />)

    expect(screen.getByText("Ghazghkull")).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-difficulty-badge")
    ).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-position-label")).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-boss-hp")).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-season-ends")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText("guildRaids.status.bossLabel")
    ).not.toBeInTheDocument()
  })
})
