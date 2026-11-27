import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { guildWarFixture } from "@workspace/game-catalog/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { GuildWar } from "../model/types"
import { render, screen } from "@/test/render"
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
          <Route element={<WarSummary onShowLog={vi.fn()} />} path="offense" />
          <Route element={<WarSummary onShowLog={vi.fn()} />} path="history" />
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

  it("says which season a war uses when the calendar names none, and has no Settings", async () => {
    api.current.mockResolvedValue({ war: null })
    renderAt("/guild/war/offense")

    expect(
      await screen.findByTestId("guild-war-season-not-listed")
    ).toHaveTextContent(
      "The events calendar doesn't list the running Guild War season, so this war uses Season A."
    )
    expect(screen.getByTestId("guild-war-summary")).toHaveTextContent("0 / 10")
    // The battlefield level is picked on Offense; Settings is gone.
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull()
  })

  it("says attacks are logged by hand until the note is dismissed on this device", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: null })
    const { unmount } = renderAt("/guild/war/offense")

    expect(await screen.findByTestId("guild-war-api-notice")).toHaveTextContent(
      "The Tacticus API doesn't return Guild War data, so attacks are logged by hand here."
    )
    await user.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(screen.queryByTestId("guild-war-api-notice")).toBeNull()

    unmount()
    renderAt("/guild/war/history")
    await screen.findByTestId("guild-war-page")
    expect(screen.queryByTestId("guild-war-api-notice")).toBeNull()
  })

  it("names the season the calendar says is running", async () => {
    api.current.mockResolvedValue({ war: null })
    await seedGameCatalog({
      "events-calendar": {
        "2020-01-03": [
          {
            occurrenceId: "occ-gw",
            definitionId: "guild-war-season",
            confirmed: true,
            startUtc: "2020-01-03T09:00:00Z",
            endUtc: "2020-01-18T09:00:00Z",
            parameters: { season: 29, seasonConfigId: "guildWarSeasonD" },
          },
        ],
      },
    })
    renderAt("/guild/war/offense")

    // Players know the season by its number, not the config letter it runs.
    expect(
      await screen.findByTestId("guild-war-season-line")
    ).toHaveTextContent("Season 29")
    expect(screen.queryByTestId("guild-war-season-not-listed")).toBeNull()
  })

  it("jumps to the attack log from the summary once the war has attacks", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({
      war: war({ tokensUsed: 1, attacks: [{} as GuildWar["attacks"][number]] }),
    })
    const onShowLog = vi.fn()
    render(
      <MemoryRouter initialEntries={["/guild/war/offense"]}>
        <Routes>
          <Route element={<GuildWarLayout />} path="/guild/war">
            <Route
              element={<WarSummary onShowLog={onShowLog} />}
              path="offense"
            />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    await user.click(
      await screen.findByRole("button", { name: "Attack log (1)" })
    )
    expect(onShowLog).toHaveBeenCalledTimes(1)
  })
})
