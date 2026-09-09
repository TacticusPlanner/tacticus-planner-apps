import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { RaidBossSeasonReferenceViewModel } from "./raid-boss-season-reference.view-model"

import { RaidBossSeasonReference } from "./raid-boss-season-reference"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, number>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
  }),
}))

const viewModel = {
  seasonId: "season-1",
  tiers: [
    {
      tier: 6,
      sets: [
        {
          set: 2,
          encounters: [
            {
              seasonId: "season-1",
              tier: 6,
              set: 2,
              encounterIndex: 0,
              encounter: { unitSetId: "prime" },
              setEncounters: [],
              item: {
                unitSetId: "prime",
                kind: "prime",
                isPrimarch: true,
                factionId: "Orks",
                name: "Gibbascrapz",
              },
            },
            {
              seasonId: "season-1",
              tier: 6,
              set: 2,
              encounterIndex: 1,
              encounter: { unitSetId: "boss" },
              setEncounters: [],
              item: {
                unitSetId: "boss",
                kind: "boss",
                isPrimarch: false,
                factionId: "Tyranids",
                name: "Tervigon",
                portraitSrc: "/boss.png",
              },
            },
          ],
        },
      ],
    },
  ],
} as unknown as RaidBossSeasonReferenceViewModel

describe("RaidBossSeasonReference", () => {
  it("keeps touch-sized cards in authored order, includes portrait fallbacks, and supports keyboard selection", async () => {
    const onEncounterSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <RaidBossSeasonReference
        viewModel={viewModel}
        seasonIds={["season-1"]}
        onSeasonChange={vi.fn()}
        onEncounterSelect={onEncounterSelect}
      />
    )

    const cards = screen.getAllByRole("button")
    expect(cards[0]).toHaveAccessibleName("Gibbascrapz")
    expect(cards[1]).toHaveAccessibleName("Tervigon")
    expect(cards[0]).toHaveClass("min-h-24")
    expect(cards[0]?.parentElement).toHaveClass(
      "grid",
      "grid-cols-2",
      "lg:flex"
    )
    expect(screen.getByText("G")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Tervigon" })).toBeInTheDocument()

    cards[0]?.focus()
    await user.keyboard("{Enter}")

    expect(onEncounterSelect).toHaveBeenCalledTimes(1)
    expect(onEncounterSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        seasonId: "season-1",
        tier: 6,
        set: 2,
        encounterIndex: 0,
      })
    )
  })
})
