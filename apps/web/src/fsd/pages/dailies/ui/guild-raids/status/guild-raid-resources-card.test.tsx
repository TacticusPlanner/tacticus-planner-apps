import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { GuildRaidResourcesView } from "../guild-raid-status-view-model"
import { GuildRaidResourcesCard } from "./guild-raid-resources-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const NOW = Date.now()

describe("GuildRaidResourcesCard", () => {
  it("shows the missing-player-data explanation when unavailable", () => {
    render(<GuildRaidResourcesCard resources={{ kind: "unavailable" }} />)
    expect(
      screen.getByTestId("guild-raid-resources-missing")
    ).toBeInTheDocument()
  })

  it("shows current/max and a countdown for a recharging bucket, and 'full' for a maxed one", () => {
    const resources: GuildRaidResourcesView = {
      kind: "available",
      observedAtMs: NOW,
      tokens: {
        current: 2,
        max: 5,
        countdown: { kind: "pending", targetMs: NOW + 300_000 },
      },
      bombs: {
        current: 5,
        max: 5,
        countdown: { kind: "full" },
      },
    }
    render(<GuildRaidResourcesCard resources={resources} />)

    expect(screen.getByTestId("guild-raid-resource-tokens")).toHaveTextContent(
      "2 / 5"
    )
    expect(screen.getByTestId("guild-raid-resource-tokens")).toHaveTextContent(
      "guildRaids.resources.nextLabel"
    )
    expect(screen.getByTestId("guild-raid-resource-bombs")).toHaveTextContent(
      "5 / 5"
    )
    expect(screen.getByTestId("guild-raid-resource-bombs")).toHaveTextContent(
      "guildRaids.resources.full"
    )
  })

  it("shows 'due' for a bucket whose countdown has elapsed", () => {
    const resources: GuildRaidResourcesView = {
      kind: "available",
      observedAtMs: NOW,
      tokens: { current: 3, max: 5, countdown: { kind: "due" } },
      bombs: { current: 1, max: 5, countdown: { kind: "unavailable" } },
    }
    render(<GuildRaidResourcesCard resources={resources} />)

    expect(screen.getByTestId("guild-raid-resource-tokens")).toHaveTextContent(
      "guildRaids.resources.due"
    )
    expect(screen.getByTestId("guild-raid-resource-bombs")).toHaveTextContent(
      "1 / 5"
    )
  })
})
