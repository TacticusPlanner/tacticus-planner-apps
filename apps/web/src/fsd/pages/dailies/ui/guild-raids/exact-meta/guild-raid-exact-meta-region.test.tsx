import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { GuildRaidExactReadinessQuery } from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaRegion } from "./guild-raid-exact-meta-region"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const source = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  name: "Terminus Maximus",
  url: "https://terminusmaximus.com/guild-raid/boss-meta/",
}

describe("GuildRaidExactMetaRegion", () => {
  it("renders a loading skeleton", () => {
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "loading" }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-loading")
    ).toBeInTheDocument()
  })

  it("renders a retryable failed state", () => {
    const retry = vi.fn()
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "failed", retry }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-failed")
    ).toBeInTheDocument()
  })

  it("distinguishes an absent local Meta dataset from an unsupported boss", () => {
    const { unmount } = render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "absentMeta" }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-absent")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-no-boss")
    ).not.toBeInTheDocument()
    unmount()

    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "noBossRecommendation" }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-no-boss")
    ).toBeInTheDocument()
  })

  it("shows ideal lineups with a sync prompt when the roster is missing", () => {
    const query: GuildRaidExactReadinessQuery = {
      status: "missingRoster",
      source,
      updatedOn: "2026-07-01",
      recommendations: [
        {
          kind: "meta",
          heroes: [
            { id: "heroA", name: "Hero A", kind: "character" },
            { id: "heroB", name: "Hero B", kind: "character" },
            { id: "heroC", name: "Hero C", kind: "character" },
            { id: "heroD", name: "Hero D", kind: "character" },
            { id: "heroE", name: "Hero E", kind: "character" },
          ],
          mow: { id: "mowX", name: "Mow X", kind: "mow" },
          comps: [],
        },
      ],
    }

    render(<GuildRaidExactMetaRegion isMobile={false} query={query} />)

    expect(
      screen.getByTestId("guild-raid-exact-meta-roster-missing")
    ).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-exact-meta-card")).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-classification-badge")
    ).toHaveTextContent("guildRaids.exactMeta.readiness.unknown")
  })

  it("presents the gaps — without an absence banner — when no team is fully ready", () => {
    const query: GuildRaidExactReadinessQuery = {
      status: "populated",
      source,
      updatedOn: "2026-07-01",
      recommendations: [
        {
          kind: "meta",
          heroes: [
            { id: "heroA", name: "Hero A", kind: "character", owned: true },
            { id: "heroB", name: "Hero B", kind: "character", owned: false },
            { id: "heroC", name: "Hero C", kind: "character", owned: false },
            { id: "heroD", name: "Hero D", kind: "character", owned: false },
            { id: "heroE", name: "Hero E", kind: "character", owned: false },
          ],
          mow: { id: "mowX", name: "Mow X", kind: "mow", owned: false },
          comps: [],
          classification: "partial",
        },
      ],
    }

    render(<GuildRaidExactMetaRegion isMobile={false} query={query} />)

    expect(
      screen.queryByTestId("guild-raid-exact-meta-absent")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-no-boss")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-roster-missing")
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-classification-badge")
    ).toHaveTextContent("guildRaids.exactMeta.readiness.partial")
  })
})
