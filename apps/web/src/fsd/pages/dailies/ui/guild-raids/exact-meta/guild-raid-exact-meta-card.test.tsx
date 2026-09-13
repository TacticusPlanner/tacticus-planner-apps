import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type {
  GuildRaidExactReadinessRecommendationView,
  GuildRaidMetaSourcePresentation,
} from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaCard } from "./guild-raid-exact-meta-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const source: GuildRaidMetaSourcePresentation = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  name: "Terminus Maximus",
  url: "https://terminusmaximus.com/guild-raid/boss-meta/",
}

function recommendation(
  overrides: Partial<GuildRaidExactReadinessRecommendationView> = {}
): GuildRaidExactReadinessRecommendationView {
  return {
    kind: "meta",
    heroes: [
      { id: "heroA", name: "Hero A", kind: "character", owned: true },
      { id: "heroB", name: "Hero B", kind: "character", owned: true },
      { id: "heroC", name: "Hero C", kind: "character", owned: false },
      { id: "heroD", name: "Hero D", kind: "character", owned: false },
      { id: "heroE", name: "Hero E", kind: "character", owned: false },
    ],
    mow: { id: "mowX", name: "Mow X", kind: "mow", owned: true },
    comps: [
      {
        id: "comp1",
        signature: { id: "heroA", name: "Hero A", kind: "character" },
      },
    ],
    classification: "partial",
    ...overrides,
  }
}

describe("GuildRaidExactMetaCard", () => {
  it("shows the kind badge, classification, lineup, Comps, and source on desktop", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-kind-badge")
    ).toHaveTextContent("guildRaids.exactMeta.kind.meta")
    expect(
      screen.getByTestId("guild-raid-exact-meta-classification-badge")
    ).toHaveTextContent("guildRaids.exactMeta.readiness.partial")
    expect(
      screen.getAllByTestId("guild-raid-exact-meta-hero-owned")
    ).toHaveLength(2)
    expect(
      screen.getAllByTestId("guild-raid-exact-meta-hero-missing")
    ).toHaveLength(3)
    expect(
      screen.getByTestId("guild-raid-exact-meta-mow-owned")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-comps")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-source")
    ).toHaveTextContent("guildRaids.exactMeta.sourceLabel")
  })

  it("shows every classification badge variant", () => {
    for (const classification of ["ready", "partial", "unavailable"] as const) {
      const { unmount } = render(
        <GuildRaidExactMetaCard
          isMobile={false}
          recommendation={recommendation({ classification })}
          source={source}
          updatedOn="2026-07-01"
        />
      )
      expect(
        screen.getByTestId("guild-raid-exact-meta-classification-badge")
      ).toHaveTextContent(`guildRaids.exactMeta.readiness.${classification}`)
      unmount()
    }
  })

  it("shows a readiness-unknown badge and no owned/missing decoration when roster is unavailable", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation({
          classification: undefined,
          heroes: recommendation().heroes.map((hero) => ({
            ...hero,
            owned: undefined,
          })),
          mow: { ...recommendation().mow, owned: undefined },
        })}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-classification-badge")
    ).toHaveTextContent("guildRaids.exactMeta.readiness.unknown")
    expect(
      screen.getAllByTestId("guild-raid-exact-meta-hero-unknown")
    ).toHaveLength(5)
    expect(
      screen.getByTestId("guild-raid-exact-meta-mow-unknown")
    ).toBeInTheDocument()
  })

  it("preserves authored heroIds order on both desktop and mobile", () => {
    const { unmount } = render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )
    expect(screen.getByTestId("guild-raid-exact-meta-heroes").textContent).toBe(
      "Hero AguildRaids.exactMeta.ownership.ownedHero BguildRaids.exactMeta.ownership.ownedHero CguildRaids.exactMeta.ownership.missingHero DguildRaids.exactMeta.ownership.missingHero EguildRaids.exactMeta.ownership.missingMow XguildRaids.exactMeta.ownership.owned"
    )
    unmount()

    render(
      <GuildRaidExactMetaCard
        isMobile={true}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )
    expect(screen.getByTestId("guild-raid-exact-meta-heroes").textContent).toBe(
      "Hero AguildRaids.exactMeta.ownership.ownedHero BguildRaids.exactMeta.ownership.ownedHero CguildRaids.exactMeta.ownership.missingHero DguildRaids.exactMeta.ownership.missingHero EguildRaids.exactMeta.ownership.missingMow XguildRaids.exactMeta.ownership.owned"
    )
  })

  it("puts classification and missing count before the lineup on mobile, with Comps/source collapsed", async () => {
    const user = userEvent.setup()
    render(
      <GuildRaidExactMetaCard
        isMobile={true}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-missing-count")
    ).toHaveTextContent('guildRaids.exactMeta.missingCount:{"count":3}')
    expect(
      screen.queryByTestId("guild-raid-exact-meta-source")
    ).not.toBeInTheDocument()

    await user.click(screen.getByTestId("guild-raid-exact-meta-details-toggle"))

    expect(
      screen.getByTestId("guild-raid-exact-meta-source")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-comps")
    ).toBeInTheDocument()
  })
})
