import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { hordeModeTiers } from "@/test/fixtures/horde-mode-tiers"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"
import {
  lysanderBattleNpcs,
  lysanderBattles,
} from "@/test/fixtures/lysander-battles"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

import { TierListPage } from "./tier-list-page"

vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: vi.fn() }),
}))

let i18n: I18n

// Lysander's run opened yesterday (active); Uthar's fixture dates are in the future (upcoming), so
// both are in rotation.
const activeLysander = {
  ...lysanderEvent,
  eventStageStartDatesUtc: [new Date(Date.now() - 86_400_000).toUTCString()],
}

const npcTiers = {
  id: "npc-tiers",
  tiers: [
    { tier: "S", multiplier: 1.9 },
    { tier: "A", multiplier: 1.7 },
    { tier: "B", multiplier: 1.45 },
    { tier: "C", multiplier: 1.2 },
    { tier: "D", multiplier: 1 },
  ],
  npcs: [
    { npcId: "orksNpc3GrotTank", tier: "A" },
    { npcId: "orksNpc1Grot", tier: "D" },
    { npcId: "blackNpc4Havoc", tier: "Z" },
  ],
}

function LocationProbe() {
  const { search } = useLocation()
  return <span data-testid="search">{search}</span>
}

function renderPage(entry = "/legendary-events/tier-list?list=enemies") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route element={<TierListPage />} path="/legendary-events/tier-list" />
      </Routes>
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const tileIds = (container: HTMLElement) =>
  within(container)
    .queryAllByTestId("npc-tier-tile")
    .map((node) => node.dataset.npc)

describe("Tier List Enemies view", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(async () => {
    setViewportWidth(1280)
    await seedGameCatalog({
      characters: legendaryEventCharacters,
      "horde-mode-tiers": [hordeModeTiers],
      lres: [activeLysander, utharEvent],
      "lre-battles": lysanderBattles,
      npcs: lysanderBattleNpcs,
      "npc-tiers": [npcTiers],
    })
  })

  it("switches between Heroes and Enemies through the URL", async () => {
    renderPage("/legendary-events/tier-list")
    expect(await screen.findByTestId("tier-list")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("tier-list-kind-enemies"))
    expect(await screen.findByTestId("npc-tier-list")).toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent("?list=enemies")
  })

  it("lists the record's NPCs in their tier rows and leaves the bosses out", async () => {
    renderPage()
    await screen.findByTestId("npc-tier-list")

    expect(tileIds(screen.getByTestId("npc-tier-list-row-A"))).toEqual([
      "orksNpc3GrotTank",
    ])
    expect(tileIds(screen.getByTestId("npc-tier-list-row-D"))).toEqual([
      "orksNpc1Grot",
    ])
    expect(
      within(screen.getByTestId("npc-tier-list-row-S")).getByTestId(
        "tier-list-row-empty"
      )
    ).toHaveTextContent("No enemy")
    expect(tileIds(screen.getByTestId("npc-tier-list-untiered"))).toEqual([
      "blackNpc4Havoc",
    ])
    expect(screen.queryAllByTestId("npc-tier-tile")).toHaveLength(3)
  })

  it("filters by name", async () => {
    renderPage("/legendary-events/tier-list?list=enemies&q=grot")
    await screen.findByTestId("npc-tier-list")

    expect(tileIds(screen.getByTestId("npc-tier-list-row-A"))).toEqual([
      "orksNpc3GrotTank",
    ])
    expect(screen.queryByTestId("npc-tier-list-untiered")).toBeNull()
  })

  it("opens an NPC's tier and threat notes", async () => {
    i18n.addResourceBundle("en", "npcThreats", {
      orksNpc3GrotTank: { threat: "Armoured stat check.", counter: "Pierce." },
    })
    renderPage()
    await screen.findByTestId("npc-tier-list")

    fireEvent.click(
      within(screen.getByTestId("npc-tier-list-row-A")).getByTestId(
        "npc-tier-tile"
      )
    )
    const details = await screen.findByTestId("npc-tier-details")
    expect(details).toHaveTextContent("A")
    expect(details).toHaveTextContent("1.7×")
    expect(within(details).getByTestId("npc-tier-threat")).toHaveTextContent(
      "Armoured stat check."
    )
    expect(within(details).getByTestId("npc-tier-counter")).toHaveTextContent(
      "Pierce."
    )
  })

  it("lists an upcoming event in the event filter", async () => {
    renderPage()
    await screen.findByTestId("npc-tier-list")
    fireEvent.click(screen.getByTestId("npc-tier-list-event"))
    expect(
      (await screen.findAllByRole("option")).map((option) => option.textContent)
    ).toHaveLength(3)
  })

  it("says so when every event is archived", async () => {
    await seedGameCatalog({
      characters: legendaryEventCharacters,
      lres: [
        {
          ...lysanderEvent,
          eventStageStartDatesUtc: [
            "2024-01-07T00:00:00Z",
            "2024-03-03T00:00:00Z",
            "2024-04-28T00:00:00Z",
          ],
        },
      ],
      "lre-battles": lysanderBattles,
      "npc-tiers": [npcTiers],
    })
    renderPage()
    expect(
      await screen.findByTestId("npc-tier-list-no-event")
    ).toBeInTheDocument()
  })
})
