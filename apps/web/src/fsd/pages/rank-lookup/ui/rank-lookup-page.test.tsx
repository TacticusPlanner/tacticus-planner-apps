import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"
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
        { rank: "Stone2", upgradeIds: ["h3"] },
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
      farmLocations: [{ battleId: "STD01" }, { battleId: "STD02" }],
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
      farmLocations: [{ battleId: "EVT01" }],
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
    {
      id: "h3",
      label: "Point Five Upgrade",
      rarity: "Legendary",
      stat: "Health",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
  ],
  "campaign-battles": [
    {
      id: "STD01",
      campaignGroupId: "indomitus",
      difficulty: "standard",
      nodeNumber: 3,
    },
    {
      id: "STD02",
      campaignGroupId: "indomitus",
      difficulty: "standard",
      nodeNumber: 7,
    },
    {
      id: "EVT01",
      campaignGroupId: "death-guard-vs-admech",
      difficulty: "eventStandard",
      nodeNumber: 5,
    },
  ],
  "campaign-definitions": [
    { groupId: "indomitus", releaseType: "standard" },
    { groupId: "death-guard-vs-admech", releaseType: "event" },
  ],
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

function renderPage() {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <RankLookupPage />
      </TooltipProvider>
    </MemoryRouter>
  )
}

describe("RankLookupPage", () => {
  it("renders publicly and lists the required base upgrades for the default range", () => {
    renderPage()

    expect(screen.getByTestId("rank-lookup-page")).toBeInTheDocument()
    // Default character + the Stone1 → Stone2 range surfaces that rank's upgrades as base materials.
    expect(screen.getByText("Health Base")).toBeInTheDocument()
    expect(screen.getByText("Armour Base")).toBeInTheDocument()
  })

  it("gates recomputation behind the Apply button", () => {
    renderPage()

    // Stone2's upgrade only surfaces via the point-five toggle, which starts off.
    expect(screen.queryByText("Point Five Upgrade")).not.toBeInTheDocument()

    const applyButton = screen.getByRole("button", { name: "rankLookup.apply" })
    expect(applyButton).toBeDisabled()

    fireEvent.click(screen.getByRole("switch"))

    // Toggling the switch only edits the draft — results must not change yet.
    expect(screen.queryByText("Point Five Upgrade")).not.toBeInTheDocument()
    expect(applyButton).not.toBeDisabled()

    fireEvent.click(applyButton)

    expect(screen.getByText("Point Five Upgrade")).toBeInTheDocument()
    expect(applyButton).toBeDisabled()
  })

  it("splits farm locations into campaign and campaign-event columns, labeled by campaign + short code + node numbers", () => {
    renderPage()

    // h1 farms from two nodes (3 and 7) on "indomitus"/"standard", a "standard"
    // campaign-definition, so it must land in the campaign column as a single chip listing both
    // node numbers, not the event column.
    const healthRow = screen.getByText("Health Base").closest("tr")
    expect(healthRow).not.toBeNull()
    expect(healthRow?.textContent).toContain("Indomitus S 3, 7")
    expect(healthRow?.textContent).not.toContain("Adeptus Mechanicus")

    // a1's location is on "death-guard-vs-admech"/"eventStandard" node 5, an "event"
    // campaign-definition, so the reverse must hold.
    const armourRow = screen.getByText("Armour Base").closest("tr")
    expect(armourRow).not.toBeNull()
    expect(armourRow?.textContent).toContain("Adeptus Mechanicus S 5")
    expect(armourRow?.textContent).not.toContain("Indomitus")
  })
})
