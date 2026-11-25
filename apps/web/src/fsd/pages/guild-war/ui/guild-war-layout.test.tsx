import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { guildWarFixture } from "@workspace/game-catalog/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { GuildWar } from "../model/types"
import { render, screen, waitFor, within } from "@/test/render"
import { resetTestDatabases, seedGameCatalog } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

const api = vi.hoisted(() => ({
  current: vi.fn(),
  setCurrent: vi.fn(),
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient((call) => {
      if (call.path === "/api/v1/guild-wars/current" && call.method === "GET")
        return api.current()
      if (call.path === "/api/v1/guild-wars/current" && call.method === "PUT")
        return api.setCurrent(call.body)
      return undefined
    }),
  }
})

import { GuildWarLayout } from "./guild-war-layout"
import { WarSummary } from "./offense/war-summary"

const war = (overrides: Partial<GuildWar> = {}): GuildWar => ({
  id: "war-1",
  revision: 3,
  seasonId: "guildWarSeasonD",
  battlefieldLevel: 2,
  startedAt: "2026-11-20T10:00:00Z",
  endedAt: null,
  tokensUsed: 0,
  deployedUnitIds: [],
  attacks: [],
  ...overrides,
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuildWarLayout />} path="/guild/war">
          <Route element={<WarSummary />} path="offense" />
          <Route element={<WarSummary />} path="history" />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("GuildWarLayout", () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    setViewportWidth(1440)
    window.localStorage.clear()
    await seedGameCatalog({ "guild-war": guildWarFixture })
  })
  afterEach(async () => {
    await resetTestDatabases()
  })

  it("shows the first season at level 5 and no tokens used with no war", async () => {
    api.current.mockResolvedValue({ war: null })
    renderAt("/guild/war/offense")

    expect(
      await screen.findByTestId("guild-war-settings-summary")
    ).toHaveTextContent("Season A · Battlefield level 5")
    expect(screen.getByTestId("guild-war-summary")).toHaveTextContent("0 / 10")
    expect(screen.getByTestId("guild-war-zone")).toHaveTextContent(
      "Pick a zone"
    )
  })

  it("restores the remembered zone and slot, and clears a zone the season lacks", async () => {
    api.current.mockResolvedValue({ war: war() })
    window.localStorage.setItem("guildWar.zone", "Armoury")
    window.localStorage.setItem("guildWar.slot", "2")
    const { unmount } = renderAt("/guild/war/history")

    expect(await screen.findByTestId("guild-war-zone")).toHaveTextContent(
      "Armoury"
    )
    expect(screen.getByTestId("guild-war-slot")).toHaveTextContent("Slot 3")
    expect(screen.getByTestId("guild-war-settings-summary")).toHaveTextContent(
      "Season D · Battlefield level 2"
    )
    unmount()

    // Season D has no Landing Pad.
    window.localStorage.setItem("guildWar.zone", "LandingPad1")
    renderAt("/guild/war/offense")
    expect(await screen.findByTestId("guild-war-zone")).toHaveTextContent(
      "Pick a zone"
    )
  })

  it("saves a new battlefield level from Settings over the war's revision", async () => {
    const user = userEvent.setup()
    let stored = war()
    api.current.mockImplementation(() => Promise.resolve({ war: stored }))
    api.setCurrent.mockImplementation((body: { battlefieldLevel: number }) => {
      stored = war({ revision: 4, battlefieldLevel: body.battlefieldLevel })
      return Promise.resolve(stored)
    })
    renderAt("/guild/war/offense")

    await user.click(await screen.findByTestId("guild-war-settings-button"))
    const dialog = await screen.findByTestId("guild-war-settings")
    await user.click(within(dialog).getByTestId("guild-war-level"))
    await user.click(await screen.findByRole("option", { name: "Level 4" }))

    await waitFor(() =>
      expect(api.setCurrent).toHaveBeenCalledWith({
        seasonId: "guildWarSeasonD",
        battlefieldLevel: 4,
        revision: 3,
      })
    )
    await user.click(within(dialog).getByRole("button", { name: "Done" }))
    expect(
      await screen.findByTestId("guild-war-settings-summary")
    ).toHaveTextContent("Season D · Battlefield level 4")
  })
})
