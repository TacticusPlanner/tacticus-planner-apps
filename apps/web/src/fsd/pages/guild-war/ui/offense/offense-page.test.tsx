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
  updateAttack: vi.fn(),
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
      if (call.method === "PUT")
        return api.updateAttack(call.params?.path?.attackId, call.body)
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
  lostUnitIds: ["ultraTitus"],
  notes: null,
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

  it("turns logging off with a reason for more than 5 characters", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    window.localStorage.setItem("guildWar.zone", "Armoury")
    renderOffense()

    for (const id of CHARACTERS) await user.click(await tile(id))

    for (const name of ["Won", "Lost", "Log with details"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled()
    }
    expect(screen.getByTestId("guild-war-log-blocked")).toHaveTextContent(
      "Pick at most 5 characters"
    )
  })

  it("logs the first attack with Won, starting the war at level 1 and the page's zone and rarity", async () => {
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
    // The zone and rarity last picked on this device start the toolbar.
    window.localStorage.setItem("guildWar.zone", "Armoury")
    window.localStorage.setItem("guildWar.rarity", "Uncommon")
    renderOffense()

    const toolbar = await screen.findByRole("group", {
      name: "Zone and defenders' rarity",
    })
    expect(
      within(toolbar).getByRole("combobox", { name: "Zone" })
    ).toHaveTextContent("Armoury")
    expect(
      within(toolbar).getByRole("combobox", { name: "Defenders' rarity" })
    ).toHaveTextContent("Uncommon")
    await user.click(await tile("ultraCalgar"))
    await user.click(screen.getByRole("button", { name: "Won" }))

    await waitFor(() => expect(api.createAttack).toHaveBeenCalledTimes(2))
    expect(api.setCurrent).toHaveBeenCalledWith({
      seasonId: "guildWarSeasonA",
      battlefieldLevel: 1,
      revision: 0,
    })
    expect(api.createAttack).toHaveBeenLastCalledWith({
      zoneId: "Armoury",
      // At level 1 the Armoury's first Uncommon slot is the third.
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
      lostUnitIds: [],
      notes: null,
      enemy: null,
      attackedAt: null,
    })
    await waitFor(() =>
      expect(screen.queryByTestId("guild-war-selection-bar")).toBeNull()
    )
  })

  it("logs with details: the lost units, a note and an enemy at the defenders' rarity", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    api.createAttack.mockResolvedValue(
      war({ tokensUsed: 1, deployedUnitIds: ["ultraCalgar"] })
    )
    window.localStorage.setItem("guildWar.zone", "Armoury")
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    await user.click(screen.getByRole("button", { name: "Log with details" }))
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    // At level 5 the Armoury's highest cap is Legendary.
    expect(
      within(dialog).getByTestId("guild-war-log-target")
    ).toHaveTextContent("Armoury · Legendary")
    await user.click(within(dialog).getByRole("radio", { name: "Lost" }))
    await user.click(within(dialog).getByRole("button", { name: /lost$/ }))
    await user.type(
      within(dialog).getByRole("textbox", { name: "Notes" }),
      " Close one. "
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Enemy details (optional)" })
    )
    await user.click(
      within(dialog).getByRole("combobox", { name: "Add an enemy character" })
    )
    await user.click(await screen.findByRole("option", { name: /Titus/ }))
    await user.click(within(dialog).getByRole("button", { name: "Log attack" }))

    await waitFor(() => expect(api.createAttack).toHaveBeenCalledTimes(1))
    expect(api.createAttack).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: "Armoury",
        slot: 0,
        result: "lost",
        lostUnitIds: ["ultraCalgar"],
        notes: "Close one.",
        enemy: {
          characters: [
            {
              unitId: "ultraTitus",
              rarity: "Legendary",
              rank: "Diamond3",
              state: "killed",
            },
          ],
          mow: null,
          buffIds: [],
          boardId: null,
        },
      })
    )
  })

  it("needs a zone before an attack can be logged", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    expect(screen.getByRole("button", { name: "Won" })).toBeDisabled()
    expect(screen.getByTestId("guild-war-log-blocked")).toHaveTextContent(
      "Pick a zone to attack"
    )

    await user.click(screen.getByRole("combobox", { name: "Zone" }))
    await user.click(await screen.findByRole("option", { name: /Armoury/ }))
    expect(screen.getByRole("button", { name: "Won" })).toBeEnabled()
    expect(
      screen.getByRole("combobox", { name: "Defenders' rarity" })
    ).toHaveTextContent("Legendary")
  })

  it("opens a new team with War Offense picked", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    api.teams.mockResolvedValue({ teams: [] })
    renderOffense()

    expect(await screen.findByText("No War Offense teams yet.")).toBeVisible()
    await user.click(await screen.findByRole("button", { name: "Create team" }))
    expect(
      await screen.findByRole("button", { name: "War Offense" })
    ).toHaveAttribute("aria-pressed", "true")
  })

  it("edits an attack's result and note from the log", async () => {
    const user = userEvent.setup()
    const logged = attack({ notes: "Close one." })
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 1,
        deployedUnitIds: ["ultraTitus"],
        attacks: [logged],
      }),
    })
    api.updateAttack.mockResolvedValue(war({ attacks: [logged] }))
    renderOffense()

    const log = await screen.findByTestId("guild-war-attack-log")
    expect(log).toHaveTextContent("Armoury · Epic")
    expect(log).toHaveTextContent("Won · 1 lost")
    expect(within(log).getByTestId("attack-notes")).toHaveTextContent(
      "Close one."
    )
    await user.click(within(log).getByRole("button", { name: "Edit attack" }))
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    expect(within(dialog).getByRole("radio", { name: "Epic" })).toBeChecked()
    await user.click(within(dialog).getByRole("radio", { name: "Lost" }))
    const notes = within(dialog).getByRole("textbox", { name: "Notes" })
    await user.clear(notes)
    await user.type(notes, "Wrong lineup")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(api.updateAttack).toHaveBeenCalledWith("attack-1", {
        zoneId: "Armoury",
        slot: 2,
        characters: logged.characters,
        mow: null,
        result: "lost",
        lostUnitIds: ["ultraTitus"],
        notes: "Wrong lineup",
        enemy: null,
        revision: 1,
      })
    )
  })

  it("deletes an attack only after confirming", async () => {
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
    await user.click(within(log).getByRole("button", { name: "Delete attack" }))
    const confirm = await screen.findByRole("dialog", {
      name: "Delete this attack?",
    })
    expect(api.deleteAttack).not.toHaveBeenCalled()
    await user.click(
      within(confirm).getByRole("button", { name: "Delete attack" })
    )

    await waitFor(() =>
      expect(api.deleteAttack).toHaveBeenCalledWith("war-1", "attack-1")
    )
  })
})
