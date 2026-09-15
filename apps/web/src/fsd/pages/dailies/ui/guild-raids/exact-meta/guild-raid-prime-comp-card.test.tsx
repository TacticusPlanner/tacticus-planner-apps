import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { GuildRaidPrimeCompCard } from "./guild-raid-prime-comp-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

let catalogState: unknown
vi.mock("@/entities/guild-raid-meta", () => ({
  useGuildRaidMetaCatalog: () => catalogState,
}))

function heroSlot(heroId: string) {
  return {
    heroId,
    roleId: "flex",
    essential: false,
    replacementCharacterIds: [],
  }
}

function recommendation(id: string, kind: string, efficiency: number) {
  const heroIds = ["heroA", "heroB", "heroC", "heroD", "heroE"]
  return {
    id,
    kind,
    heroSlots: heroIds.map(heroSlot),
    mowId: "mowX",
    mowReplacementIds: [],
    compIds: [],
    efficiency,
  }
}

function readyCatalog(primes: unknown[]) {
  return {
    status: "ready",
    meta: { primes },
    presentation: {
      resolveRecommendation: (r: { id: string; kind: string }) => ({
        recommendation: r,
        kind: { id: r.kind, label: r.kind },
        heroes: [],
        heroSlots: [
          {
            hero: { id: "heroA", name: "Hero A" },
            role: { id: "flex", label: "Flex" },
          },
        ],
        mow: { id: "mowX", name: "Mow X" },
        mowReplacements: [],
        comps: [],
      }),
    },
    retry: vi.fn(),
  }
}

describe("GuildRaidPrimeCompCard", () => {
  it("renders every curated recommendation with its kind, efficiency, roster, and Machine of War", () => {
    catalogState = readyCatalog([
      {
        primeUnitSetId: "Prime1",
        recommendations: [
          recommendation("Prime1-admech", "admech", 1.25),
          recommendation("Prime1-custodes", "custodes", 1.0),
        ],
      },
    ])

    render(<GuildRaidPrimeCompCard primeUnitSetId="Prime1" />)

    expect(screen.getByTestId("guild-raid-prime-comp-card")).toBeInTheDocument()
    expect(
      screen.getAllByTestId("guild-raid-prime-comp-recommendation")
    ).toHaveLength(2)
    expect(
      screen
        .getAllByTestId("guild-raid-prime-comp-kind-badge")
        .map((el) => el.textContent)
    ).toEqual(["admech", "custodes"])
    expect(screen.getAllByTestId("guild-raid-prime-comp-hero")).toHaveLength(2)
    expect(screen.getAllByTestId("guild-raid-prime-comp-mow")).toHaveLength(2)
  })

  it("falls back to the existing roster-agnostic display (renders nothing) for a prime with no curated comp", () => {
    catalogState = readyCatalog([
      {
        primeUnitSetId: "OtherPrime",
        recommendations: [recommendation("x", "admech", 1)],
      },
    ])

    const { container } = render(
      <GuildRaidPrimeCompCard primeUnitSetId="Prime1" />
    )

    expect(container).toBeEmptyDOMElement()
    expect(
      screen.queryByTestId("guild-raid-prime-comp-card")
    ).not.toBeInTheDocument()
  })

  it("renders nothing while the catalog is not yet ready", () => {
    catalogState = { status: "loading" }

    const { container } = render(
      <GuildRaidPrimeCompCard primeUnitSetId="Prime1" />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
