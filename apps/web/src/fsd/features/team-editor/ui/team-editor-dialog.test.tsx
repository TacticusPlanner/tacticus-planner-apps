import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Team } from "@/entities/team"
import { ApiError } from "@/shared/api"
import { compareCodeUnits } from "@/shared/lib"
import { act, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

const api = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  toastSuccess: vi.fn(),
  toast: vi.fn(),
}))

vi.mock("@workspace/ui/lib/toast", () => ({
  toast: Object.assign(
    (message: string, options?: unknown) => api.toast(message, options),
    {
      success: (message: string) => api.toastSuccess(message),
      error: vi.fn(),
    }
  ),
}))
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient((call) => {
      if (call.method === "POST") return api.create(call.body)
      if (call.method === "PUT") {
        return api.update(call.params?.path?.teamId, call.body)
      }
      return api.list()
    }),
  }
})

import { TeamEditorDialog } from "./team-editor-dialog"

const character = (
  id: string,
  faction: string,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  name: id,
  faction,
  alliance: faction === "BlackLegion" ? "Chaos" : "Imperial",
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
  ...overrides,
})

const imperial = [
  "Ultramarines",
  "BlackTemplars",
  "SpaceWolves",
  "DarkAngels",
  "BloodAngels",
  "Custodes",
]

async function seedCatalog() {
  await seedGameCatalog({
    characters: [
      character("ultraTigurius", "Ultramarines"),
      character("ultraEliminatorSgt", "Ultramarines"),
      character("ultraInceptorSgt", "Ultramarines"),
      character("ultraCalgar", "Ultramarines", { initialRarity: "Legendary" }),
      character("ultraTitus", "Ultramarines"),
      character("ultraApothecary", "Ultramarines"),
      character("templHelbrecht", "BlackTemplars"),
      character("adeptCanoness", "Sisterhood"),
      character("orksNob", "Orks", { alliance: "Xenos" }),
      character("blackAbaddon", "BlackLegion"),
    ],
    mows: [
      {
        id: "ultraDreadnought",
        name: "Dreadnought",
        faction: "Ultramarines",
        alliance: "Imperial",
      },
      {
        id: "tauBroadside",
        name: "Broadside",
        faction: "Tau",
        alliance: "Xenos",
      },
      {
        id: "orksRukkatrukk",
        name: "Rukkatrukk",
        faction: "Orks",
        alliance: "Xenos",
      },
      {
        id: "blackForgefiend",
        name: "Forgefiend",
        faction: "BlackLegion",
        alliance: "Chaos",
      },
    ],
    "campaign-definitions": [
      {
        groupId: "campaign1",
        types: ["Standard"],
        coreCharacters: [
          "ultraTigurius",
          "ultraEliminatorSgt",
          "ultraInceptorSgt",
        ],
        battleIds: [],
      },
      {
        groupId: "mirror1",
        types: ["Mirror"],
        coreCharacters: ["orksNob"],
        battleIds: [],
      },
      {
        groupId: "elite1",
        types: ["Elite"],
        coreCharacters: ["ultraTigurius"],
        battleIds: [],
      },
      {
        groupId: "campaign3",
        types: ["Standard"],
        coreCharacters: ["orksNob"],
        battleIds: [],
      },
    ],
    "campaign-battles": [
      {
        id: "b1",
        campaignGroupId: "campaign1",
        alliesFactions: ["Ultramarines"],
      },
      { id: "b2", campaignGroupId: "mirror1", alliesFactions: ["Orks"] },
      { id: "b3", campaignGroupId: "elite1", alliesFactions: ["Ultramarines"] },
      { id: "b4", campaignGroupId: "campaign3", alliesFactions: ["Orks"] },
    ],
    incursions: [
      { mowId: "orksRukkatrukk", allowedFactions: imperial },
      {
        mowId: "tauBroadside",
        allowedFactions: ["Sisterhood", "Ultramarines"],
      },
      {
        mowId: "blackForgefiend",
        allowedFactions: ["BlackLegion", "WorldEaters"],
      },
    ],
  })
}

const savedTeam = (overrides: Partial<Team> = {}): Team => ({
  id: "t1",
  revision: 3,
  position: 1,
  name: "Saved team",
  modes: ["horde"],
  characterIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
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

const onClose = vi.fn()

async function openEditor(
  team: Team | null = null,
  teams: readonly Team[] = team ? [team] : []
) {
  const user = userEvent.setup()
  render(<TeamEditorDialog onClose={onClose} team={team} teams={teams} />)
  await screen.findByTestId("team-unit-picker")
  return user
}

const editor = () => screen.getByTestId("team-editor")
function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("missing element")
  return value
}
const tile = (unitId: string) =>
  editor().querySelector<HTMLElement>(
    `[data-testid="team-picker-tile"][data-unit="${unitId}"]`
  )
/** The lineup's units by role: core characters, flex units (characters, then MoWs), core MoWs. */
const lineupIds = (section: "core" | "flex" | "mows") =>
  [
    ...editor().querySelectorAll<HTMLElement>(
      '[data-testid="team-lineup-unit"]'
    ),
  ]
    .filter((element) => {
      const { kind, section: placed } = element.dataset
      if (section === "flex") return placed === "flex"
      return (
        placed === "core" && kind === (section === "mows" ? "mow" : "character")
      )
    })
    .map((element) => element.getAttribute("data-unit"))
const pickButton = (unitId: string) =>
  within(required(tile(unitId))).getByRole("checkbox")
const save = () => screen.getByRole("button", { name: "Save team" })
/** One option of a lineup unit's Core/Flex switch. */
const roleOption = (name: string, option: "Core" | "Flex") => {
  const group =
    screen.queryByRole("radiogroup", { name: `Role of ${name}` }) ??
    screen.getByRole("group", { name: `Role of ${name}` })
  return within(group).getByRole("radio", { name: option })
}

async function chooseMode(
  user: ReturnType<typeof userEvent.setup>,
  label: string
) {
  await user.click(within(editor()).getByRole("button", { name: label }))
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  option: string
) {
  await user.click(trigger)
  await user.click(await screen.findByRole("option", { name: option }))
}

describe("TeamEditorDialog", () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    setViewportWidth(1440)
    await seedCatalog()
  })
  afterEach(() => vi.unstubAllGlobals())

  describe("forms", () => {
    it("is a centered dialog on desktop with the lineup band above the picker, and Filters in a popover", async () => {
      const user = await openEditor()
      expect(
        screen.getByRole("dialog", { name: "Create team" })
      ).not.toHaveAttribute("data-side")
      const band = screen.getByTestId("team-editor-lineup")
      expect(
        band.compareDocumentPosition(screen.getByTestId("team-unit-picker")) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
      expect(screen.getByTestId("team-unit-picker")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Filters" }))
      expect(
        await screen.findByTestId("team-picker-filters-panel")
      ).toBeInTheDocument()
    })

    it("is a bottom sheet on a phone with Details, Lineup, Characters and Machines of War tabs, and Filters inline", async () => {
      setViewportWidth(390)
      const user = userEvent.setup()
      render(<TeamEditorDialog onClose={onClose} team={null} teams={[]} />)
      const tabs = await screen.findAllByRole("tab")
      expect(tabs.map((tab) => tab.textContent)).toEqual([
        "Details",
        "Lineup",
        "Characters",
        "Machines of War",
      ])
      // A new team starts on its details, which sit in the sheet itself (no popovers).
      expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
        "aria-selected",
        "true"
      )
      expect(screen.getByLabelText("Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Notes")).toBeInTheDocument()
      expect(
        screen.getByRole("combobox", { name: "Rarity cap" })
      ).toBeInTheDocument()
      await user.click(screen.getByRole("tab", { name: /Lineup/ }))
      expect(screen.getByTestId("team-editor-lineup")).toBeInTheDocument()
      await user.click(screen.getByRole("tab", { name: /Characters/ }))
      expect(screen.getByTestId("team-picker-characters")).toBeInTheDocument()
      expect(screen.queryByTestId("team-picker-mows")).toBeNull()
      await user.click(screen.getByRole("button", { name: "Filters" }))
      // No second sheet on top of the editor: the filters open in the tab.
      expect(
        screen.getByTestId("team-picker-filters-panel")
      ).toBeInTheDocument()
      expect(screen.getAllByRole("dialog")).toHaveLength(1)
    })

    it("keeps Save available and lists what to fix only once a save is tried", async () => {
      const user = await openEditor()
      expect(screen.queryByTestId("team-editor-issues")).toBeNull()
      expect(save()).toBeEnabled()
      await user.click(save())
      const issues = screen.getByTestId("team-editor-issues")
      expect(issues).toHaveTextContent("Fix these to save:")
      expect(issues).toHaveTextContent("A team needs at least 3 characters.")
      expect(api.create).not.toHaveBeenCalled()
      // The list then follows the draft.
      await user.type(screen.getByLabelText("Name"), "Boss team")
      expect(screen.getByTestId("team-editor-issues")).not.toHaveTextContent(
        "The name must be"
      )
    })

    it("shows the name limits, the notes count and the lineup count", async () => {
      const user = await openEditor()
      expect(screen.getByText("3–40 characters")).toBeInTheDocument()
      await user.click(screen.getByTestId("team-notes-button"))
      await user.type(await screen.findByLabelText("Notes"), "Use on boss")
      expect(screen.getByText("11 / 300")).toBeInTheDocument()
      expect(screen.getByTestId("team-editor-count")).toHaveTextContent(
        "0 characters · 0 Machines of War"
      )
    })

    it("explains why a war mode is unavailable with six core characters", async () => {
      await openEditor(
        savedTeam({
          characterIds: [
            "ultraTigurius",
            "ultraEliminatorSgt",
            "ultraInceptorSgt",
            "ultraCalgar",
            "ultraTitus",
            "ultraApothecary",
          ],
        })
      )
      for (const mode of ["War Offense", "War Defense", "Tournament Arena"]) {
        expect(screen.getByRole("button", { name: mode })).toBeDisabled()
      }
      // Said once for the three modes, not under each of them.
      expect(
        screen.getAllByText(
          "War and Tournament Arena teams allow 5 core characters. Make the others flex."
        )
      ).toHaveLength(1)
      expect(screen.getByTestId("team-modes-size-reason")).toBeInTheDocument()
    })

    it("keeps other modes out while Campaign is selected, and says why once one is tried", async () => {
      const user = await openEditor()
      await chooseMode(user, "Campaign")
      const horde = screen.getByRole("button", { name: "Horde" })
      expect(horde).toHaveAttribute("aria-disabled", "true")
      // Described for screen readers, but not shown until a blocked mode is tried.
      expect(screen.getByTestId("team-modes-exclusive-reason")).toHaveClass(
        "sr-only"
      )
      await user.click(horde)
      expect(horde).toHaveAttribute("aria-pressed", "false")
      expect(
        screen.getByTestId("team-modes-exclusive-reason")
      ).toHaveTextContent("Campaign teams can't have other modes.")
      expect(screen.getByTestId("team-modes-exclusive-reason")).not.toHaveClass(
        "sr-only"
      )
    })

    it("explains once, when tried, that Campaign and Incursion can't join other modes", async () => {
      const user = await openEditor()
      await chooseMode(user, "Horde")
      const campaign = screen.getByRole("button", { name: "Campaign" })
      expect(campaign).toHaveAttribute("aria-disabled", "true")
      expect(screen.getByRole("button", { name: "Incursion" })).toHaveAttribute(
        "aria-disabled",
        "true"
      )
      expect(campaign).toHaveAccessibleDescription(
        "Campaign and Incursion can't be combined with other modes."
      )
      expect(screen.getByTestId("team-modes-exclusive-reason")).toHaveClass(
        "sr-only"
      )
      await user.click(campaign)
      expect(campaign).toHaveAttribute("aria-pressed", "false")
      expect(screen.getByTestId("team-modes-exclusive-reason")).not.toHaveClass(
        "sr-only"
      )
      // Changing the modes hides it again.
      await chooseMode(user, "Guild Raid")
      expect(screen.getByTestId("team-modes-exclusive-reason")).toHaveClass(
        "sr-only"
      )
    })
  })

  describe("Campaign", () => {
    it("offers no Elite campaign, and choosing Indomitus locks its core characters in", async () => {
      const user = await openEditor()
      await chooseMode(user, "Campaign")
      await user.click(screen.getByTestId("team-campaign-select"))
      const options = (await screen.findAllByRole("option")).map(
        (option) => option.textContent
      )
      expect(options).toEqual(["Indomitus", "Indomitus Mirror", "Octarius"])
      await user.click(screen.getByRole("option", { name: "Indomitus" }))
      expect(lineupIds("core")).toEqual([
        "ultraTigurius",
        "ultraEliminatorSgt",
        "ultraInceptorSgt",
      ])
      expect(
        screen.queryByRole("button", { name: /Remove Tigurius/ })
      ).toBeNull()
      // A campaign's core character can't be made flex.
      expect(roleOption("Tigurius", "Flex")).toBeDisabled()
      expect(screen.getByTestId("team-allowed-factions")).toHaveTextContent(
        /Allowed factions\s*Ultramarines/
      )
      expect(tile("orksNob")).toBeNull()
      expect(screen.queryByTestId("team-picker-mows")).toBeNull()
    })

    it("replaces the lineup when the campaign changes", async () => {
      const user = await openEditor()
      await chooseMode(user, "Campaign")
      await chooseOption(
        user,
        screen.getByTestId("team-campaign-select"),
        "Indomitus"
      )
      await user.click(pickButton("ultraCalgar"))
      expect(lineupIds("core")).toHaveLength(4)
      await chooseOption(
        user,
        screen.getByTestId("team-campaign-select"),
        "Octarius"
      )
      expect(lineupIds("core")).toEqual(["orksNob"])
    })
  })

  describe("Incursion", () => {
    it("lists only factions Rukkatrukk allows, and only compatible MoWs", async () => {
      const user = await openEditor()
      await chooseMode(user, "Incursion")
      await chooseOption(
        user,
        screen.getByTestId("team-incursion-add"),
        "Rukkatrukk"
      )
      expect(tile("ultraCalgar")).not.toBeNull()
      expect(tile("templHelbrecht")).not.toBeNull()
      expect(tile("adeptCanoness")).toBeNull()
      expect(screen.getByTestId("team-allowed-factions")).toHaveTextContent(
        "Black Templars"
      )
      expect(screen.getByTestId("team-allowed-factions")).not.toHaveTextContent(
        "Adepta Sororitas"
      )
      await user.click(screen.getByTestId("team-incursion-add"))
      const offered = (await screen.findAllByRole("option")).map(
        (option) => option.textContent
      )
      expect(offered).toContain("Tson'ji")
      expect(offered).not.toContain("Forgefiend")
    })

    it("clears the lineup when the Incursions change", async () => {
      const user = await openEditor()
      await chooseMode(user, "Incursion")
      await chooseOption(
        user,
        screen.getByTestId("team-incursion-add"),
        "Rukkatrukk"
      )
      await user.click(pickButton("ultraCalgar"))
      expect(lineupIds("core")).toEqual(["ultraCalgar"])
      await chooseOption(
        user,
        screen.getByTestId("team-incursion-add"),
        "Tson'ji"
      )
      expect(lineupIds("core")).toEqual([])
    })
  })

  describe("picker", () => {
    it("shows the MoWs beside the characters on desktop, with no switch", async () => {
      await openEditor()
      expect(screen.getByTestId("team-picker-characters")).toBeInTheDocument()
      expect(screen.getByTestId("team-picker-mows")).toBeInTheDocument()
      expect(screen.queryByTestId("team-picker-kind")).toBeNull()
    })

    it("says where an added unit went on a phone, and Undo restores the lineup exactly", async () => {
      setViewportWidth(390)
      const user = userEvent.setup()
      render(
        <TeamEditorDialog
          onClose={onClose}
          team={savedTeam({
            modes: ["warOffense"],
            characterIds: [
              "ultraTigurius",
              "ultraEliminatorSgt",
              "ultraInceptorSgt",
              "ultraCalgar",
              "ultraTitus",
            ],
          })}
          teams={[]}
        />
      )
      await user.click(await screen.findByRole("tab", { name: /Characters/ }))
      await user.click(pickButton("ultraApothecary"))
      expect(api.toast).toHaveBeenLastCalledWith(
        "Incisus added as flex.",
        expect.objectContaining({
          action: expect.objectContaining({ label: "Undo" }),
        })
      )
      const options = api.toast.mock.lastCall?.[1] as {
        action: { onClick: () => void }
      }
      act(() => options.action.onClick())
      await user.click(screen.getByRole("tab", { name: /Lineup/ }))
      expect(lineupIds("core")).toHaveLength(5)
      expect(lineupIds("flex")).toEqual([])
    })

    it("drops the Machines of War tab for a Campaign team on a phone", async () => {
      setViewportWidth(390)
      const user = userEvent.setup()
      render(<TeamEditorDialog onClose={onClose} team={null} teams={[]} />)
      expect(
        await screen.findByRole("tab", { name: /Machines of War/ })
      ).toBeInTheDocument()
      await user.click(screen.getByRole("tab", { name: "Details" }))
      await user.click(await screen.findByRole("button", { name: "Campaign" }))
      expect(screen.queryByRole("tab", { name: /Machines of War/ })).toBeNull()
    })

    it("adds a character as core, makes it flex and back, and removes it", async () => {
      const user = await openEditor()
      await user.click(pickButton("ultraCalgar"))
      await user.click(pickButton("ultraTitus"))
      expect(lineupIds("core")).toEqual(["ultraCalgar", "ultraTitus"])
      // Both options always show; the current one is checked.
      expect(roleOption("Calgar", "Core")).toHaveAttribute(
        "aria-checked",
        "true"
      )
      await user.click(roleOption("Calgar", "Flex"))
      expect(lineupIds("core")).toEqual(["ultraTitus"])
      expect(lineupIds("flex")).toEqual(["ultraCalgar"])
      expect(roleOption("Calgar", "Flex")).toHaveAttribute(
        "aria-checked",
        "true"
      )
      await user.click(roleOption("Calgar", "Core"))
      expect(lineupIds("flex")).toEqual([])
      await user.click(screen.getByRole("button", { name: "Remove Titus" }))
      expect(lineupIds("core")).toEqual(["ultraCalgar"])
    })

    it("marks a picked unit with a check mark", async () => {
      const user = await openEditor()
      expect(
        within(required(tile("ultraCalgar"))).queryByTestId(
          "team-picker-selected"
        )
      ).toBeNull()
      await user.click(pickButton("ultraCalgar"))
      expect(pickButton("ultraCalgar")).toHaveAttribute("aria-checked", "true")
      expect(
        within(required(tile("ultraCalgar"))).getByTestId(
          "team-picker-selected"
        )
      ).toBeInTheDocument()
    })

    it("is one Tab stop per grid, moved through with the arrow keys", async () => {
      const user = await openEditor()
      const grid = screen.getByTestId("team-picker-characters")
      const buttons = within(grid).getAllByRole("checkbox")
      expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1)
      const [first, second] = buttons
      first?.focus()
      await user.keyboard("{ArrowRight}")
      expect(second).toHaveFocus()
      expect(second).toHaveAttribute("tabindex", "0")
      expect(first).toHaveAttribute("tabindex", "-1")
      await user.keyboard("{Enter}")
      expect(second).toHaveAttribute("aria-checked", "true")
      await user.keyboard("{End}")
      expect(buttons.at(-1)).toHaveFocus()
      await user.keyboard("{Home}")
      expect(first).toHaveFocus()
    })

    it("searches, badges the Filters button and hides locked units with the chip", async () => {
      await seedPlayerData({
        characters: [
          {
            unitId: "ultraCalgar",
            progressionIndex: "Legendary:RedFiveStars",
            rank: "Diamond3",
            xp: 0,
            xpLevel: 50,
            shards: 0,
            mythicShards: 0,
            abilities: [],
            appliedUpgradeSlots: [],
            equippedItems: [],
          },
        ],
        mows: [],
      })
      const user = await openEditor()
      await user.type(
        screen.getByRole("searchbox", { name: "Search units" }),
        "titus"
      )
      expect(tile("ultraTitus")).not.toBeNull()
      expect(tile("ultraCalgar")).toBeNull()
      await user.clear(screen.getByRole("searchbox", { name: "Search units" }))

      await user.click(screen.getByRole("button", { name: "Owned only" }))
      await waitFor(() => expect(tile("ultraTitus")).toBeNull())
      expect(tile("ultraCalgar")).not.toBeNull()

      await user.click(screen.getByRole("button", { name: "Filters" }))
      await chooseOption(
        user,
        await screen.findByTestId("team-filter-faction"),
        "Ultramarines"
      )
      expect(screen.getByTestId("team-picker-filters-badge")).toHaveTextContent(
        "1"
      )
    })

    it("keeps MoWs to the filters that apply to them", async () => {
      const user = await openEditor()
      expect(tile("ultraDreadnought")).not.toBeNull()
      await user.click(screen.getByRole("button", { name: "Filters" }))
      await chooseOption(
        user,
        await screen.findByTestId("team-filter-alliance"),
        "Xenos"
      )
      expect(tile("ultraDreadnought")).toBeNull()
      expect(tile("orksRukkatrukk")).not.toBeNull()
      await user.click(screen.getByTestId("team-filter-attack-melee"))
      expect(tile("orksRukkatrukk")).toBeNull()
    })

    it("lists every unit and says so without a synced roster", async () => {
      await openEditor()
      expect(screen.getByTestId("team-picker-no-roster")).toHaveTextContent(
        "Without a synced roster, every unit is listed."
      )
      expect(editor().querySelectorAll('[data-locked="true"]')).toHaveLength(0)
    })

    it("shows picker portraits at the md size and the lineup strip's at sm", async () => {
      const user = await openEditor()
      await user.click(pickButton("ultraCalgar"))
      expect(
        required(tile("ultraCalgar")).querySelector(".size-portrait-md")
      ).not.toBeNull()
      expect(
        editor().querySelector(
          '[data-testid="team-lineup-unit"] .size-portrait-sm'
        )
      ).not.toBeNull()
    })
  })

  describe("same-mode flag", () => {
    const offense = savedTeam({
      id: "wo",
      name: "Offense",
      modes: ["warOffense"],
      characterIds: ["ultraCalgar"],
    })
    const horde = savedTeam({
      id: "h",
      name: "Horde team",
      modes: ["horde"],
      characterIds: ["ultraTitus"],
    })

    it("flags a unit in another team of a selected mode, and it stays selectable", async () => {
      const user = await openEditor(null, [offense, horde])
      await chooseMode(user, "War Offense")
      expect(tile("ultraCalgar")).toHaveAttribute("data-used", "true")
      expect(tile("ultraCalgar")).toHaveTextContent("Also in Offense")
      expect(pickButton("ultraCalgar")).toHaveAccessibleDescription(
        "Also in Offense"
      )
      await user.click(pickButton("ultraCalgar"))
      expect(lineupIds("core")).toEqual(["ultraCalgar"])
    })

    it("does not flag a unit only in a team of another mode", async () => {
      const user = await openEditor(null, [offense, horde])
      await chooseMode(user, "War Offense")
      expect(tile("ultraTitus")).not.toHaveAttribute("data-used")
    })
  })

  describe("rarity cap", () => {
    it("previews a Legendary unit at Epic, marks what is under the cap, and saves the cap", async () => {
      await seedPlayerData({
        characters: [
          {
            unitId: "ultraCalgar",
            progressionIndex: "Legendary:RedFiveStars",
            rank: "Diamond3",
            xp: 0,
            xpLevel: 50,
            shards: 0,
            mythicShards: 0,
            abilities: [
              { abilityId: "a", level: 50 },
              { abilityId: "b", level: 20 },
            ],
            appliedUpgradeSlots: [],
            equippedItems: [],
          },
        ],
        mows: [],
      })
      api.create.mockImplementation((body: object) =>
        Promise.resolve({ ...savedTeam(), ...body, id: "new" })
      )
      const user = await openEditor()
      const abilities = () =>
        within(required(tile("ultraCalgar"))).getByRole("img", {
          name: /^Abilities/,
        })
      await waitFor(() =>
        expect(abilities()).toHaveAccessibleName("Abilities 50 and 20")
      )
      expect(tile("ultraCalgar")).not.toHaveTextContent("Diamond III")
      expect(screen.queryByTestId("team-rarity-cap-hint")).toBeNull()
      await chooseOption(
        user,
        screen.getByRole("combobox", { name: "Rarity cap" }),
        "Epic"
      )
      expect(screen.getByTestId("team-rarity-cap-hint")).toHaveTextContent(
        "Units shown capped at Epic."
      )
      // The picker shows the capped levels, Epic's 35, without under-cap marks.
      expect(abilities()).toHaveAccessibleName("Abilities 35 and 20")
      expect(within(abilities()).getByText("20")).not.toHaveAttribute(
        "data-under"
      )
      expect(
        required(tile("ultraCalgar")).querySelector('[data-rarity="Epic"]')
      ).not.toBeNull()

      await user.type(screen.getByLabelText("Name"), "Capped")
      await chooseMode(user, "Horde")
      await user.click(pickButton("ultraCalgar"))
      await user.click(pickButton("ultraTitus"))
      await user.click(pickButton("ultraApothecary"))
      // In the lineup, what is under the Epic targets is marked: the passive at 20.
      const row = within(
        required(
          editor().querySelector<HTMLElement>(
            '[data-testid="team-lineup-unit"][data-unit="ultraCalgar"]'
          )
        )
      )
      expect(row.getByTestId("team-lineup-under-cap")).toHaveTextContent(
        "Under Epic: abilities"
      )
      expect(row.getByText("20")).toHaveAttribute("data-under", "true")
      expect(row.getByText("35")).not.toHaveAttribute("data-under")
      await user.click(save())
      await waitFor(() => expect(api.create).toHaveBeenCalled())
      const body = api.create.mock.lastCall?.[0] as Record<string, unknown>
      expect(Object.keys(body).toSorted(compareCodeUnits)).toEqual([
        "campaignGroupId",
        "characterIds",
        "flexStartIndex",
        "incursionMowIds",
        "modes",
        "mowFlexStartIndex",
        "mowIds",
        "name",
        "notes",
        "rarityCap",
        "survivalEventKey",
      ])
      expect(body.rarityCap).toBe("Epic")
    })

    it("opens a team at its saved cap, and None clears it", async () => {
      const user = await openEditor(savedTeam({ rarityCap: "Epic" }))
      expect(
        screen.getByRole("combobox", { name: "Rarity cap" })
      ).toHaveTextContent("Epic")
      expect(screen.getByTestId("team-rarity-cap-hint")).toHaveTextContent(
        "Units shown capped at Epic."
      )
      await chooseOption(
        user,
        screen.getByRole("combobox", { name: "Rarity cap" }),
        "None"
      )
      expect(screen.queryByTestId("team-rarity-cap-hint")).toBeNull()
    })
  })

  describe("closing", () => {
    it("closes at once when nothing changed", async () => {
      const user = await openEditor(savedTeam())
      await user.click(screen.getByRole("button", { name: "Cancel" }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it("asks before discarding changes, and keeps them on Keep editing", async () => {
      const user = await openEditor(savedTeam())
      await user.type(screen.getByLabelText("Name"), "x")
      await user.keyboard("{Escape}")
      expect(onClose).not.toHaveBeenCalled()
      await user.click(
        await screen.findByRole("button", { name: "Keep editing" })
      )
      expect(screen.getByLabelText("Name")).toHaveValue("Saved teamx")
      expect(onClose).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Cancel" }))
      await user.click(
        await screen.findByRole("button", { name: "Discard changes" })
      )
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe("saving", () => {
    async function readyDraft() {
      const user = await openEditor(savedTeam())
      await user.clear(screen.getByLabelText("Name"))
      await user.type(screen.getByLabelText("Name"), "Renamed")
      return user
    }

    it("closes once the save succeeds", async () => {
      api.update.mockResolvedValue({
        ...savedTeam(),
        name: "Renamed",
        revision: 4,
      })
      const user = await readyDraft()
      await user.click(save())
      await waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(api.update).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({ name: "Renamed", revision: 3 })
      )
      expect(api.toastSuccess).toHaveBeenCalledWith("Saved Renamed.")
    })

    it("keeps the draft when the save fails", async () => {
      api.update.mockRejectedValue(new ApiError(500, "down"))
      const user = await readyDraft()
      await user.click(save())
      expect(
        await screen.findByTestId("team-editor-message")
      ).toHaveTextContent(
        "The team wasn't saved. Your changes are still here; try again."
      )
      expect(screen.getByLabelText("Name")).toHaveValue("Renamed")
      expect(onClose).not.toHaveBeenCalled()
    })

    it("keeps the draft on a stale save, and the next save carries the current revision", async () => {
      api.update
        .mockRejectedValueOnce(
          new ApiError(409, "stale", {
            issueCode: "teamRevisionStale",
            current: { ...savedTeam(), revision: 7, name: "From elsewhere" },
          })
        )
        .mockResolvedValue({ ...savedTeam(), name: "Renamed", revision: 8 })
      const user = await readyDraft()
      await user.click(save())
      expect(
        await screen.findByTestId("team-editor-message")
      ).toHaveTextContent(
        "This team changed on another device, so your save wasn't applied."
      )
      expect(screen.getByLabelText("Name")).toHaveValue("Renamed")
      await user.click(save())
      await waitFor(() =>
        expect(api.update).toHaveBeenLastCalledWith(
          "t1",
          expect.objectContaining({ revision: 7 })
        )
      )
    })

    it("takes the revision from a stale save whose team is incomplete", async () => {
      api.update
        .mockRejectedValueOnce(
          new ApiError(409, "stale", {
            issueCode: "teamRevisionStale",
            // No notes: not a whole team, but its revision still applies.
            current: { ...savedTeam(), revision: 7, notes: undefined },
          })
        )
        .mockResolvedValue({ ...savedTeam(), name: "Renamed", revision: 8 })
      const user = await readyDraft()
      await user.click(save())
      expect(
        await screen.findByTestId("team-editor-message")
      ).toHaveTextContent(
        "This team changed on another device, so your save wasn't applied."
      )
      await user.click(save())
      await waitFor(() =>
        expect(api.update).toHaveBeenLastCalledWith(
          "t1",
          expect.objectContaining({ revision: 7 })
        )
      )
    })

    it("shows a taken name under the name field", async () => {
      api.update.mockRejectedValue(
        new ApiError(400, "taken", { issueCode: "teamNameTaken" })
      )
      const user = await readyDraft()
      await user.click(save())
      expect(
        await screen.findByText("Another team already has this name.")
      ).toBeInTheDocument()
      expect(screen.getByLabelText("Name")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
      expect(screen.getByLabelText("Name")).toHaveValue("Renamed")
    })

    it("on a phone, says a taken name in the footer and opens the Details tab on the field", async () => {
      setViewportWidth(390)
      api.update.mockRejectedValue(
        new ApiError(400, "taken", { issueCode: "teamNameTaken" })
      )
      const user = userEvent.setup()
      render(
        <TeamEditorDialog
          onClose={onClose}
          team={savedTeam()}
          teams={[savedTeam()]}
        />
      )
      // An existing team opens on its lineup.
      expect(
        await screen.findByRole("tab", { name: /Lineup/ })
      ).toHaveAttribute("aria-selected", "true")
      await user.click(screen.getByRole("tab", { name: "Details" }))
      await user.clear(screen.getByLabelText("Name"))
      await user.type(screen.getByLabelText("Name"), "Renamed")
      await user.click(screen.getByRole("tab", { name: /Lineup/ }))
      await user.click(save())
      expect(
        await screen.findByTestId("team-editor-message")
      ).toHaveTextContent("Another team already has this name.")
      expect(screen.getByRole("tab", { name: /Details/ })).toHaveAttribute(
        "aria-selected",
        "true"
      )
      expect(screen.getByLabelText("Name")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
    })

    it("keeps an edit of a team deleted elsewhere as an edit, with Save off", async () => {
      render(
        <TeamEditorDialog
          deleted
          onClose={onClose}
          team={savedTeam()}
          teams={[]}
        />
      )
      await screen.findByTestId("team-unit-picker")
      expect(
        screen.getByRole("dialog", { name: "Edit Saved team" })
      ).toBeInTheDocument()
      expect(screen.getByTestId("team-editor-deleted")).toHaveTextContent(
        "This team was deleted on another device"
      )
      expect(save()).toBeDisabled()
    })

    it("shows the server's rule codes as translated reasons", async () => {
      api.update.mockRejectedValue(
        new ApiError(400, "rules", {
          issueCode: "teamRulesBroken",
          extensions: { rules: ["unknownCampaign"] },
        })
      )
      const user = await readyDraft()
      await user.click(save())
      const message = await screen.findByTestId("team-editor-message")
      expect(message).toHaveTextContent("This campaign isn't in the game data.")
      expect(message).not.toHaveTextContent("unknownCampaign")
    })
  })

  describe("issues", () => {
    it("opens an imported war team with two core MoWs as imported, and saving lists the fix", async () => {
      const user = await openEditor(
        savedTeam({
          modes: ["warOffense"],
          mowIds: ["ultraDreadnought", "tauBroadside"],
          issues: ["tooManyCoreMows"],
        })
      )
      expect(lineupIds("mows")).toEqual(["ultraDreadnought", "tauBroadside"])
      await user.click(save())
      expect(api.update).not.toHaveBeenCalled()
      expect(screen.getByTestId("team-editor-issues")).toHaveTextContent(
        "Make 1 Machine of War flex."
      )
      await user.click(roleOption("Tson'ji", "Flex"))
      expect(lineupIds("mows")).toEqual(["ultraDreadnought"])
      expect(lineupIds("flex")).toEqual(["tauBroadside"])
      expect(screen.queryByTestId("team-editor-issues")).toBeNull()
    })

    it("shows an imported Campaign team's MoWs on desktop, so they can be removed", async () => {
      const user = await openEditor(
        savedTeam({
          modes: ["campaign"],
          mowIds: ["ultraDreadnought"],
          issues: ["mowsNotAllowed"],
        })
      )
      expect(lineupIds("mows")).toEqual(["ultraDreadnought"])
      await user.click(screen.getByRole("button", { name: "Remove Galatian" }))
      expect(lineupIds("mows")).toEqual([])
    })

    it("marks the Sisters of Battle character on a Rukkatrukk team, and removing it allows Save", async () => {
      const user = await openEditor(
        savedTeam({
          modes: ["incursion"],
          incursionMowIds: ["orksRukkatrukk"],
          characterIds: [
            "ultraCalgar",
            "ultraTitus",
            "ultraApothecary",
            "adeptCanoness",
          ],
          issues: ["factionNotAllowed"],
        })
      )
      const marked = required(
        editor().querySelector<HTMLElement>(
          '[data-testid="team-lineup-unit"][data-unit="adeptCanoness"]'
        )
      )
      expect(marked).toHaveAttribute("data-marked", "true")
      expect(within(marked).getByText("Not allowed")).toBeInTheDocument()
      await user.click(save())
      expect(screen.getByTestId("team-editor-issues")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Remove Roswitha" }))
      expect(screen.queryByTestId("team-editor-issues")).toBeNull()
    })
  })
})
