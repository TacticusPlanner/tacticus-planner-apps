import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

// The page must work for unauthenticated users with no user data — it reads only the public catalog.
// (No MSAL / user-state mocks are needed, which is the point: nothing user-specific is imported.)
vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

const records: Record<string, unknown[]> = {
  characters: [
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      alliance: "Imperial",
      rankUpUpgrades: [
        { rank: "Stone1", upgradeIds: ["h1", "h2", "d1", "d2", "a1", "a2"] },
      ],
    },
  ],
  upgrades: [
    {
      id: "h1",
      label: "Health Base",
      rarity: "Common",
      stat: "Health",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "h2",
      label: "Health Two",
      rarity: "Uncommon",
      stat: "Health",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "d1",
      label: "Damage Base",
      rarity: "Common",
      stat: "Damage",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "d2",
      label: "Damage Two",
      rarity: "Common",
      stat: "Damage",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "a1",
      label: "Armour Base",
      rarity: "Rare",
      stat: "Armour",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "a2",
      label: "Armour Two",
      rarity: "Common",
      stat: "Armour",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
  ],
  "campaign-battles": [],
}

vi.mock("@workspace/game-catalog", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@workspace/game-catalog")>()
  return {
    ...original,
    useDatasetRecords: (key: string) => ({
      data: records[key] ?? [],
      loading: false,
      error: null,
    }),
  }
})

import { RankLookupPage } from "./rank-lookup-page"

describe("RankLookupPage", () => {
  it("renders publicly and lists the required base materials for the default range", () => {
    render(
      <TooltipProvider>
        <RankLookupPage />
      </TooltipProvider>
    )

    expect(screen.getByTestId("rank-lookup-page")).toBeInTheDocument()
    // Default character + the Stone1 → Stone2 range surfaces that rank's upgrades as base materials.
    expect(screen.getByText("Health Base")).toBeInTheDocument()
    expect(screen.getByText("Armour Base")).toBeInTheDocument()
  })
})
