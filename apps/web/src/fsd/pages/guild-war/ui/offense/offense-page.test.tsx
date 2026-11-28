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
  startWar: vi.fn(),
  teams: vi.fn(),
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@workspace/ui/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
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
      if (call.path === "/api/v1/guild-wars") return api.startWar(call.body)
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
import { storedPreference, writePreference } from "@/shared/lib"

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
  survivalEventKey: null,
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

/** The level and zone this device picked for the current war. */
function pickTarget(zoneId = "Armoury") {
  writePreference(storedPreference("guildWar", "zone"), zoneId)
  writePreference(storedPreference("guildWar", "level"), "picked")
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

  it("lists ready teams first and names every unit that blocks the others", async () => {
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 2,
        deployedUnitIds: ["ultraTitus", "ultraApothecary"],
      }),
    })
    api.teams.mockResolvedValue({
      teams: [
        team("blocked", {
          characterIds: ["ultraTitus", "ultraCalgar", "ultraApothecary"],
        }),
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
    ).toHaveTextContent(/^\S+ and \S+ already attacked in this war\.$/)
    // Only the deployed units are dimmed.
    expect(
      within(second as HTMLElement).getAllByRole("listitem", {
        name: /already attacked/,
      })
    ).toHaveLength(2)
    // A deployed unit is not offered again.
    await tile("ultraCalgar")
    expect(tileOf("ultraTitus")).toBeUndefined()
  })

  it("stops at 5 characters and says why on the others", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    pickTarget()
    renderOffense()

    for (const id of CHARACTERS.slice(0, 5)) await user.click(await tile(id))
    const sixth = await tile("ultraInceptorSgt")
    expect(sixth).toHaveAttribute("aria-disabled", "true")
    await user.hover(sixth)
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "5 characters picked"
    )
    await user.click(sixth)

    expect(sixth).not.toBeChecked()
    expect(screen.getAllByTestId("guild-war-staged-unit")).toHaveLength(5)
    expect(screen.getByRole("button", { name: "Won" })).toBeEnabled()
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
    pickTarget()
    writePreference(storedPreference("guildWar", "rarity"), "Uncommon")
    renderOffense()

    const toolbar = await screen.findByRole("group", {
      name: "Battlefield level, zone and defenders' rarity",
    })
    expect(
      within(toolbar).getByRole("combobox", { name: "Battlefield level" })
    ).toHaveTextContent("Level 1")
    expect(
      within(toolbar).getByRole("combobox", { name: "Zone" })
    ).toHaveTextContent("Armoury")
    expect(
      within(toolbar).getByRole("combobox", { name: "Defenders' rarity" })
    ).toHaveTextContent("Uncommon")
    await user.click(await tile("ultraCalgar"))
    // The Diamond 3 Calgar could fight at a higher cap than Uncommon, and the bar says so.
    expect(
      screen.getByRole("button", {
        name: /^1 over cap\. Over the Uncommon cap/,
      })
    ).toHaveAccessibleName(/\(Legendary rank\)/)
    expect(screen.queryByRole("button", { name: /under cap/ })).toBeNull()
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

  it("logs the first attack in a war another device just started", async () => {
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
    api.setCurrent.mockRejectedValue(
      new ApiError(409, "Stale", {
        issueCode: "guildWarRevisionStale",
        current: war({ revision: 1 }),
      })
    )
    pickTarget()
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    await user.click(screen.getByRole("button", { name: "Won" }))

    // The stale start is ignored and the attack logged once more, with no second tap.
    await waitFor(() => expect(api.createAttack).toHaveBeenCalledTimes(2))
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
    pickTarget()
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    await user.click(screen.getByRole("button", { name: "Log with details" }))
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    // It starts at the page's zone and, at level 5, the Armoury's highest cap, Legendary.
    expect(
      within(dialog).getByRole("combobox", { name: "Zone" })
    ).toHaveTextContent("Armoury")
    expect(
      within(dialog).getByRole("radio", { name: "Legendary" })
    ).toBeChecked()
    // Picking Epic here moves the page's rarity too (checked once the dialog closes).
    await user.click(within(dialog).getByRole("radio", { name: "Epic" }))
    await user.click(within(dialog).getByRole("radio", { name: "Lost" }))
    await user.click(within(dialog).getByRole("button", { name: /lost$/ }))
    await user.type(
      within(dialog).getByRole("textbox", { name: "Notes" }),
      " Close one. "
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Enemy details (optional)" })
    )
    // The Armoury's own buff starts ticked; another zone's Local buff is not offered.
    expect(
      within(dialog).getByTestId("guild-war-buff-EnvArmourSupplies_Regional")
    ).toBeChecked()
    expect(
      within(dialog).queryByTestId("guild-war-buff-EnvFortified_Local")
    ).toBeNull()
    await user.click(
      within(dialog).getByRole("combobox", { name: "Add an enemy character" })
    )
    await user.click(await screen.findByRole("option", { name: /Titus/ }))
    await user.click(within(dialog).getByRole("button", { name: "Log attack" }))

    await waitFor(() => expect(api.createAttack).toHaveBeenCalledTimes(1))
    expect(api.createAttack).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: "Armoury",
        // At level 5 the Armoury's first Epic slot is the third.
        slot: 2,
        result: "lost",
        lostUnitIds: ["ultraCalgar"],
        notes: "Close one.",
        enemy: {
          characters: [
            {
              unitId: "ultraTitus",
              rarity: "Epic",
              rank: "Gold1",
              state: "killed",
            },
          ],
          mow: null,
          buffIds: ["EnvArmourSupplies_Regional"],
          boardId: null,
        },
      })
    )
    await waitFor(() =>
      expect(screen.queryByTestId("guild-war-log-dialog")).toBeNull()
    )
    expect(
      screen.getByRole("combobox", { name: "Defenders' rarity" })
    ).toHaveTextContent("Epic")
  })

  it("starts a detailed log as won, keeps the lineup rows for every result, and picks a map by its picture", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    api.createAttack.mockResolvedValue(
      war({ tokensUsed: 1, deployedUnitIds: ["ultraCalgar"] })
    )
    pickTarget()
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    await user.click(screen.getByRole("button", { name: "Log with details" }))
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    expect(within(dialog).getByRole("radio", { name: "Won" })).toBeChecked()
    const lostToggle = within(dialog).getByRole("button", { name: /lost$/ })
    expect(lostToggle).toBeEnabled()
    // Not recorded keeps the same rows, disabled, so the dialog keeps its height.
    await user.click(
      within(dialog).getByRole("radio", { name: "Not recorded" })
    )
    expect(
      within(dialog).getByText("Tap the units you lost")
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: /lost$/ })).toBeDisabled()
    await user.click(within(dialog).getByRole("radio", { name: "Won" }))

    await user.click(
      within(dialog).getByRole("button", { name: "Enemy details (optional)" })
    )
    const maps = within(dialog).getByTestId("guild-war-enemy-map")
    // The season's pool, each board by its picture.
    expect(within(maps).getAllByRole("radio")).toHaveLength(4)
    const board = within(maps).getByRole("radio", { name: "Map 2" })
    expect(within(board).getByRole("presentation")).toHaveAttribute(
      "src",
      "/game_catalog/curated/guild_war_boards/C1_37.webp"
    )
    await user.click(board)
    expect(board).toHaveAttribute("data-state", "on")
    // A board's magnifier opens it large; Next and Pick this map pick another from there.
    await user.click(
      within(dialog).getByRole("button", { name: "Zoom in on map 1" })
    )
    const viewer = await screen.findByTestId("guild-war-map-viewer")
    expect(within(viewer).getByRole("img", { name: "Map 1" })).toHaveAttribute(
      "src",
      "/game_catalog/curated/guild_war_boards_large/EC1_09.webp"
    )
    await user.click(within(viewer).getByRole("button", { name: "Next map" }))
    expect(
      within(viewer).getByRole("button", { name: "Picked" })
    ).toBeDisabled()
    await user.click(within(viewer).getByRole("button", { name: "Next map" }))
    await user.click(
      within(viewer).getByRole("button", { name: "Pick this map" })
    )
    await waitFor(() =>
      expect(screen.queryByTestId("guild-war-map-viewer")).toBeNull()
    )
    expect(within(maps).getByRole("radio", { name: "Map 3" })).toHaveAttribute(
      "data-state",
      "on"
    )
    await user.click(board)
    await user.click(within(dialog).getByRole("button", { name: "Log attack" }))

    await waitFor(() => expect(api.createAttack).toHaveBeenCalledTimes(1))
    expect(api.createAttack).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "won",
        lostUnitIds: [],
        enemy: expect.objectContaining({ boardId: "C1_37" }),
      })
    )
  })

  it("needs a level and a zone before an attack can be logged", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    expect(screen.getByRole("button", { name: "Won" })).toBeDisabled()
    expect(screen.getByTestId("guild-war-log-blocked")).toHaveTextContent(
      "Pick a battlefield level"
    )

    // The war's own level is picked as it is, with no save.
    await user.click(
      screen.getByRole("combobox", { name: "Battlefield level" })
    )
    expect(screen.queryByRole("option", { name: "Level 0" })).toBeNull()
    await user.click(await screen.findByRole("option", { name: "Level 5" }))
    expect(api.setCurrent).not.toHaveBeenCalled()
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

  it("saves a newly picked battlefield level over the war's revision", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    api.setCurrent.mockResolvedValue(war({ battlefieldLevel: 3, revision: 2 }))
    renderOffense()

    await user.click(
      await screen.findByRole("combobox", { name: "Battlefield level" })
    )
    await user.click(await screen.findByRole("option", { name: "Level 3" }))

    await waitFor(() =>
      expect(api.setCurrent).toHaveBeenCalledWith({
        seasonId: "guildWarSeasonA",
        battlefieldLevel: 3,
        revision: 1,
      })
    )
  })

  it("starts a new war with no level or zone picked", async () => {
    const user = userEvent.setup()
    const next = war({ id: "war-2", battlefieldLevel: 1 })
    api.current.mockImplementation(async () => ({
      war: api.startWar.mock.calls.length > 0 ? next : war(),
    }))
    api.startWar.mockResolvedValue(next)
    pickTarget()
    renderOffense()

    const zone = await screen.findByRole("combobox", { name: "Zone" })
    expect(zone).toHaveTextContent("Armoury")
    await user.click(screen.getByRole("button", { name: "Start new war" }))
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Start new war",
      })
    )

    await waitFor(() => expect(api.startWar).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Zone" })).toHaveTextContent(
        "Pick a zone"
      )
    )
    expect(
      screen.getByRole("combobox", { name: "Battlefield level" })
    ).toHaveTextContent("Pick a level")
  })

  it("shows deployed units under a divider, flagged with their zone", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 1,
        deployedUnitIds: ["ultraTitus"],
        attacks: [attack()],
      }),
    })
    renderOffense()

    await tile("ultraCalgar")
    expect(tileOf("ultraTitus")).toBeUndefined()
    // Owned only is on from the start, and the badge counts it.
    await user.click(screen.getByRole("button", { name: "Filters, 1 active" }))
    await user.click(
      await screen.findByRole("switch", { name: "Show deployed" })
    )
    await user.keyboard("{Escape}")

    const deployed = await screen.findByTestId("guild-war-deployed")
    const titus = within(deployed).getByRole("checkbox", { name: /Titus/ })
    expect(titus).toHaveAttribute("aria-disabled", "true")
    expect(
      within(deployed).getByTestId("guild-war-deployed-zone")
    ).toHaveTextContent("Armoury")
    expect(
      screen.getByRole("button", { name: "Filters, 2 active" })
    ).toBeInTheDocument()
  })

  it("shows 12 characters on phones until Show all, and every match for a search", async () => {
    const user = userEvent.setup()
    setViewportWidth(390)
    const many = Array.from({ length: 14 }, (_, index) => `unit${index}`)
    await seedGameCatalog({
      "guild-war": guildWarFixture,
      characters: many.map(character),
      mows: [],
    })
    await seedPlayerData({ characters: many.map(rosterUnit), mows: [] })
    api.current.mockResolvedValue({ war: war() })
    renderOffense()

    const grid = await screen.findByTestId("guild-war-characters")
    await waitFor(() =>
      expect(within(grid).getAllByRole("checkbox")).toHaveLength(12)
    )
    await user.type(screen.getByRole("searchbox"), "unit1")
    await waitFor(() =>
      expect(
        within(screen.getByTestId("guild-war-characters")).getAllByRole(
          "checkbox"
        )
      ).toHaveLength(5)
    )
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull()

    await user.clear(screen.getByRole("searchbox"))
    await user.click(
      await screen.findByRole("button", { name: "Show all (14)" })
    )
    expect(
      within(screen.getByTestId("guild-war-characters")).getAllByRole(
        "checkbox"
      )
    ).toHaveLength(14)

    await user.click(screen.getByRole("button", { name: "Show less" }))
    expect(
      within(screen.getByTestId("guild-war-characters")).getAllByRole(
        "checkbox"
      )
    ).toHaveLength(12)
    expect(screen.queryByRole("button", { name: "Show less" })).toBeNull()
  })

  it("shows every character when a team is selected, so its picks show", async () => {
    const user = userEvent.setup()
    setViewportWidth(390)
    const many = Array.from({ length: 14 }, (_, index) => `unit${index}`)
    await seedGameCatalog({
      "guild-war": guildWarFixture,
      characters: many.map(character),
      mows: [],
    })
    await seedPlayerData({ characters: many.map(rosterUnit), mows: [] })
    api.current.mockResolvedValue({ war: war() })
    api.teams.mockResolvedValue({
      teams: [
        team("late", {
          characterIds: ["unit0", "unit13", "unit5"],
          flexStartIndex: 1,
        }),
      ],
    })
    renderOffense()

    await screen.findByRole("button", { name: "Show all (14)" })
    // Flex units show after the core, and Select picks them too.
    expect(
      within(screen.getByTestId("guild-war-team-flex")).getAllByRole("listitem")
    ).toHaveLength(2)
    await user.click(
      await screen.findByRole("button", { name: "Select Team late" })
    )
    const grid = screen.getByTestId("guild-war-characters")
    expect(within(grid).getAllByRole("checkbox")).toHaveLength(14)
    expect(
      within(grid)
        .getAllByRole("checkbox")
        .filter((box) => box.getAttribute("aria-checked") === "true")
    ).toHaveLength(3)
    expect(screen.getByRole("button", { name: "Show less" })).toBeEnabled()
  })

  it("reminds about a free Machine of War and goes to the list", async () => {
    const user = userEvent.setup()
    await seedPlayerData({
      characters: CHARACTERS.map(rosterUnit),
      mows: [
        {
          unitId: "ultraDreadnought",
          progressionIndex: "Epic:RedOneStar",
          xp: 0,
          xpLevel: 1,
          shards: 0,
          mythicShards: 0,
          abilities: [
            { abilityId: "raw1", level: 30 },
            { abilityId: "raw2", level: 28 },
          ],
          appliedUpgradeSlots: [],
        },
      ],
    })
    api.current.mockResolvedValue({ war: war() })
    pickTarget()
    renderOffense()

    await user.click(await tile("ultraCalgar"))
    const reminder = screen.getByRole("button", {
      name: "No Machine of War · 1 available",
    })
    // A reminder only: the attack can still be logged.
    expect(screen.getByRole("button", { name: "Won" })).toBeEnabled()
    await user.click(reminder)
    expect(
      screen.getByRole("region", { name: "Machines of War" })
    ).toHaveFocus()

    await user.click(await tile("ultraDreadnought"))
    expect(
      screen.queryByRole("button", { name: /No Machine of War/ })
    ).toBeNull()
  })

  it("goes to the attack log from the summary", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 1,
        deployedUnitIds: ["ultraTitus"],
        attacks: [attack()],
      }),
    })
    renderOffense()

    await user.click(
      await screen.findByRole("button", { name: "Attack log (1)" })
    )
    expect(screen.getByTestId("guild-war-attack-log")).toHaveFocus()
  })

  it("opens a new team with War Offense picked", async () => {
    const user = userEvent.setup()
    api.current.mockResolvedValue({ war: war() })
    api.teams.mockResolvedValue({ teams: [] })
    renderOffense()

    expect(await screen.findByText("No War Offense teams yet.")).toBeVisible()
    expect(screen.getByRole("link", { name: "All teams" })).toHaveAttribute(
      "href",
      "/my-game/teams"
    )
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

  it("changes an attack's lineup: removes a character, adds a Machine of War", async () => {
    const user = userEvent.setup()
    await seedPlayerData({
      characters: CHARACTERS.map(rosterUnit),
      mows: [
        {
          unitId: "ultraDreadnought",
          progressionIndex: "Epic:RedOneStar",
          xp: 0,
          xpLevel: 1,
          shards: 0,
          mythicShards: 0,
          abilities: [
            { abilityId: "raw1", level: 30 },
            { abilityId: "raw2", level: 28 },
          ],
          appliedUpgradeSlots: [],
        },
      ],
    })
    const titus = attack().characters[0]
    const logged = attack({
      characters: [
        titus as GuildWarAttack["characters"][number],
        {
          ...(titus as GuildWarAttack["characters"][number]),
          unitId: "ultraCalgar",
        },
      ],
      lostUnitIds: ["ultraCalgar"],
    })
    const other = attack({
      id: "attack-2",
      attackedAt: "2026-11-20T12:00:00Z",
      characters: [
        {
          ...(titus as GuildWarAttack["characters"][number]),
          unitId: "ultraTigurius",
        },
      ],
      lostUnitIds: [],
    })
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 2,
        deployedUnitIds: ["ultraTitus", "ultraCalgar", "ultraTigurius"],
        attacks: [other, logged],
      }),
    })
    api.updateAttack.mockResolvedValue(war({ attacks: [other, logged] }))
    renderOffense()

    const log = await screen.findByTestId("guild-war-attack-log")
    const [edit] = within(log).getAllByRole("button", { name: "Edit attack" })
    await user.click(edit as HTMLElement)
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Change lineup" })
    )
    const editor = within(dialog).getByTestId("guild-war-lineup-editor")
    await user.click(
      within(editor).getByRole("button", { name: /Remove .*Calgar/ })
    )
    // A character another attack used is not offered.
    await user.click(
      within(editor).getByRole("combobox", { name: "Add a character" })
    )
    // A removed character can come back.
    expect(
      await screen.findByRole("option", { name: /Calgar/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("option", { name: /Tigurius/ })
    ).not.toBeInTheDocument()
    await user.keyboard("{Escape}")
    await user.click(
      within(editor).getByRole("combobox", { name: "Add a Machine of War" })
    )
    await user.click(await screen.findByRole("option", { name: /Galatian/ }))
    await user.click(within(editor).getByRole("button", { name: "Done" }))
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(api.updateAttack).toHaveBeenCalledWith(
        "attack-1",
        expect.objectContaining({
          characters: [titus],
          mow: expect.objectContaining({
            unitId: "ultraDreadnought",
            progression: "Epic:RedOneStar",
          }),
          // Calgar left the lineup, so he is no longer lost.
          lostUnitIds: [],
        })
      )
    )
  })

  it("keeps the edit open while its save runs", async () => {
    const user = userEvent.setup()
    const logged = attack()
    api.current.mockResolvedValue({
      war: war({
        tokensUsed: 1,
        deployedUnitIds: ["ultraTitus"],
        attacks: [logged],
      }),
    })
    api.updateAttack.mockReturnValue(new Promise(() => {}))
    renderOffense()

    const log = await screen.findByTestId("guild-war-attack-log")
    await user.click(within(log).getByRole("button", { name: "Edit attack" }))
    const dialog = await screen.findByTestId("guild-war-log-dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    )
    await user.keyboard("{Escape}")
    expect(screen.getByTestId("guild-war-log-dialog")).toBeInTheDocument()
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
