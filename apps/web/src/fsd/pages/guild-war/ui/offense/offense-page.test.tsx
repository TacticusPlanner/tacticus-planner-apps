import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { guildWarFixture } from "@workspace/game-catalog/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Team } from "@/entities/team"
import { ApiError } from "@/shared/api"
import { render, screen, waitFor, within } from "@/test/render"
import {
  resetTestDatabases,
  seedGameCatalog,
  seedPlayerData,
} from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

import type { GuildWar, GuildWarAttack } from "../../model/types"

const api = vi.hoisted(() => ({
  current: vi.fn(),
  setCurrent: vi.fn(),
  createAttack: vi.fn(),
  deleteAttack: vi.fn(),
  teams: vi.fn(),
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => ({
    isSyncing: false,
    statusText: "",
    syncDisabled: false,
    syncNow: vi.fn(),
  }),
}))
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient((call) => {
      if (call.path === "/api/v1/teams") return api.teams()
      if (call.path === "/api/v1/guild-wars/current") {
        return call.method === "GET" ? api.current() : api.setCurrent(call.body)
      }
      if (call.path === "/api/v1/guild-wars/current/attacks")
        return api.createAttack(call.body)
      if (call.method === "DELETE")
        return api.deleteAttack(
          call.params?.path?.warId,
          call.params?.path?.attackId
        )
      return undefined
    }),
  }
})

import { GuildWarLayout } from "../guild-war-layout"
import { OffensePage } from "./offense-page"

const CHARACTERS = [
  "ultraCalgar",
  "ultraTitus",
  "ultraTigurius",
  "ultraApothecary",
  "ultraEliminatorSgt",
  "ultraInceptorSgt",
]

const character = (id: string) => ({
  id,
  name: id,
  faction: "Ultramarines",
  alliance: "Imperial",
  initialRarity: "Common",
  traits: [],
  meleeDamage: "Power",
  meleeHits: 2,
  rangedDamage: null,
  rangedHits: null,
  rangeDistance: null,
  movement: 3,
  activeAbilityDamage: [],
  passiveAbilityDamage: [],
})

const rosterUnit = (unitId: string) => ({
  unitId,
  progressionIndex: "Legendary:RedFiveStars",
  rank: "Diamond3",
  xp: 0,
  xpLevel: 50,
  shards: 0,
  mythicShards: 0,
  abilities: [
    { abilityId: "a", level: 40 },
    { abilityId: "b", level: 35 },
  ],
  appliedUpgradeSlots: [],
  equippedItems: [],
})

const war = (overrides: Partial<GuildWar> = {}): GuildWar => ({
  id: "war-1",
  revision: 1,
  seasonId: "guildWarSeasonA",
  battlefieldLevel: 5,
  startedAt: "2026-11-20T10:00:00Z",
  endedAt: null,
  tokensUsed: 0,
  deployedUnitIds: [],
  attacks: [],
  ...overrides,
})

const attack = (overrides: Partial<GuildWarAttack> = {}): GuildWarAttack => ({
  id: "attack-1",
  revision: 1,
  attackedAt: "2026-11-21T10:00:00Z",
  zoneId: "Armoury",
  slot: 2,
  rarityCap: "Epic",
  characters: [
    {
      unitId: "ultraTitus",
      progression: "Legendary:RedFiveStars",
      rank: "Diamond3",
      xpLevel: 50,
      abilityLevels: [40, 35],
    },
  ],
  mow: null,
  result: "won",
  unitsLost: 1,
  enemy: null,
  ...overrides,
})

const team = (id: string, overrides: Partial<Team> = {}): Team => ({
  id,
  revision: 1,
  position: 1,
  name: `Team ${id}`,
  modes: ["warOffense"],
  characterIds: [],
  flexStartIndex: null,
  mowIds: [],
  mowFlexStartIndex: null,
  campaignGroupId: null,
  incursionMowIds: [],
  notes: null,
  rarityCap: null,
  issues: [],
  ...overrides,
})

function renderOffense() {
  return render(
    <MemoryRouter initialEntries={["/guild/war/offense"]}>
      <Routes>
        <Route element={<GuildWarLayout />} path="/guild/war">
          <Route element={<OffensePage />} path="offense" />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

const tiles = () => screen.queryAllByTestId("team-picker-tile")
const tileOf = (unitId: string) =>
  tiles().find((tile) => tile.dataset.unit === unitId)
async function tile(unitId: string) {
  await waitFor(() => expect(tileOf(unitId)).toBeDefined())
  return within(tileOf(unitId) as HTMLElement).getByRole("checkbox")
}

describe("OffensePage", () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    setViewportWidth(1440)
    window.localStorage.clear()
    api.teams.mockResolvedValue({ teams: [] })
    await seedGameCatalog({
      "guild-war": guildWarFixture,
      characters: CHARACTERS.map(character),
      mows: [
        {
          id: "ultraDreadnought",
          name: "Dreadnought",
          faction: "Ultramarines",
          alliance: "Imperial",
        },
      ],
    })
    await seedPlayerData({
      characters: CHARACTERS.map(rosterUnit),
      mows: [],
    })
  })
  afterEach(async () => {
    await resetTestDatabases()
  })

  it("lists ready teams first and says which unit blocks the others", async () => {
    api.current.mockResolvedValue({
      war: war({ tokensUsed: 1, deployedUnitIds: ["ultraTitus"] }),
    })
    api.teams.mockResolvedValue({
      teams: [
        team("blocked", { characterIds: ["ultraTitus", "ultraCalgar"] }),
        team("defense", {
          modes: ["warDefense"],
          characterIds: ["ultraCalgar"],
        }),
        team("ready", { characterIds: ["ultraCalgar", "ultraTigurius"] }),
      ],
    })
    renderOffense()

    await waitFor(() =>
      expect(screen.getAllByTestId("guild-war-team")).toHaveLength(2)
    )
    const [first, second] = screen.getAllByTestId("guild-war-team")
    expect(first).toHaveTextContent("Team ready")
    expect(second).toHaveTextContent("Team blocked")
    expect(
      within(second as HTMLElement).getByTestId("guild-war-team-blocked")
    ).toHaveTextContent(/already attacked in this war/)
    // A deployed unit is not offered again.
    await tile("ultraCalgar")
    expect(tileOf("ultraTitus")).toBeUndefined()
  })

  it("turns Log attack off with a reason for more than 5 characters", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    window.localStorage.setItem("guildWar.zone", "Armoury")
    window.localStorage.setItem("guildWar.slot", "2")
    renderOffense()

    for (const id of CHARACTERS) await user.click(await tile(id))

    expect(screen.getByTestId("guild-war-log-attack")).toBeDisabled()
    expect(screen.getByTestId("guild-war-log-blocked")).toHaveTextContent(
      "Pick at most 5 characters"
    )
  })

  it("logs the first attack, starting the war with the shown season and level", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: null })
    api.createAttack
      .mockRejectedValueOnce(
        new ApiError(409, "No current war", {
          issueCode: "guildWarNotStarted",
        })
      )
      .mockResolvedValueOnce(
        war({ tokensUsed: 1, deployedUnitIds: ["ultraCalgar"] })
      )
    api.setCurrent.mockResolvedValue(war())
    window.localStorage.setItem("guildWar.zone", "Armoury")
    window.localStorage.setItem("guildWar.slot", "2")
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    await user.click(screen.getByTestId("guild-war-log-attack"))
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    expect(dialog).toHaveTextContent("Armoury · Slot 3")
    await user.click(within(dialog).getByRole("radio", { name: "Won" }))
    await user.click(within(dialog).getByTestId("guild-war-log-save"))

    await waitFor(() => expect(api.createAttack).toHaveBeenCalledTimes(2))
    expect(api.setCurrent).toHaveBeenCalledWith({
      seasonId: "guildWarSeasonA",
      battlefieldLevel: 5,
      revision: 0,
    })
    expect(api.createAttack).toHaveBeenLastCalledWith({
      zoneId: "Armoury",
      slot: 2,
      characters: [
        {
          unitId: "ultraCalgar",
          progression: "Legendary:RedFiveStars",
          rank: "Diamond3",
          xpLevel: 50,
          abilityLevels: [40, 35],
        },
      ],
      mow: null,
      result: "won",
      unitsLost: 0,
      enemy: null,
      attackedAt: null,
    })
    await waitFor(() =>
      expect(screen.queryByTestId("guild-war-log-dialog")).toBeNull()
    )
    expect(screen.queryByTestId("guild-war-selection-bar")).toBeNull()
  })

  it("undoes an attack from the log", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 1,
        deployedUnitIds: ["ultraTitus"],
        attacks: [attack()],
      }),
    })
    api.deleteAttack.mockResolvedValue(war())
    renderOffense()

    const log = await screen.findByTestId("guild-war-attack-log")
    expect(log).toHaveTextContent("Armoury · Slot 3")
    expect(log).toHaveTextContent("Won · 1 lost")
    await user.click(within(log).getByTestId("guild-war-undo"))

    await waitFor(() =>
      expect(api.deleteAttack).toHaveBeenCalledWith("war-1", "attack-1")
    )
  })
})
