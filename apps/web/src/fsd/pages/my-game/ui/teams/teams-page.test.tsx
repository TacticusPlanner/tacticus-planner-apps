import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Team } from "@/entities/team"
import { ApiError } from "@/shared/api"
import { compareCodeUnits } from "@/shared/lib"
import { act, fireEvent, render, screen, waitFor, within } from "@/test/render"
import { seedPlayerData } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

const api = vi.hoisted(() => ({
  list: vi.fn(),
  reorder: vi.fn(),
  remove: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

// Every drag list's latest onReorder, by its ids: a drop in jsdom has no layout to drag across,
// so tests drop through the list's own callback (the drag itself is the shared SortableList's).
const drops = vi.hoisted(
  () => new Map<string, (orderedIds: string[], movedId: string) => void>()
)
vi.mock("@/shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui")>()
  return {
    ...actual,
    SortableList: (props: Parameters<typeof actual.SortableList>[0]) => {
      drops.set(
        props.items.map(props.getId).toSorted(compareCodeUnits).join(","),
        props.onReorder
      )
      return <actual.SortableList {...props} />
    },
  }
})

vi.mock("sonner", () => ({
  toast: {
    error: (message: string) => api.toastError(message),
    success: (message: string) => api.toastSuccess(message),
  },
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
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
      if (call.path === "/api/v1/teams" && call.method === "GET")
        return api.list()
      if (call.path === "/api/v1/teams/order") return api.reorder(call.body)
      if (call.method === "DELETE") return api.remove(call.params?.path?.teamId)
      return undefined
    }),
  }
})

import { useTourPageSteps } from "@/shared/tour"

import {
  TEAMS_GROUP_BY_STORAGE_KEY,
  TEAMS_LAYOUT_STORAGE_KEY,
  TEAMS_MODE_STORAGE_KEY,
  TeamsPage,
} from "./teams-page"

const team = (id: string, overrides: Partial<Team> = {}): Team => ({
  id,
  revision: 1,
  position: 1,
  name: `Team ${id}`,
  modes: ["horde"],
  characterIds: ["ultraCalgar"],
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

const list = (...teams: Team[]) => ({
  teams: teams.map((entry, index) => ({ ...entry, position: index + 1 })),
})

const cards = () => screen.getAllByTestId("team-card")
const cardNames = () => cards().map((card) => card.getAttribute("aria-label"))

async function renderPage() {
  return render(<TeamsPage />, { route: "/my-game/teams" })
}

/** Drops the shown teams in a new order, as a finished drag would. */
function drop(orderedIds: string[]) {
  const onReorder = drops.get(orderedIds.toSorted(compareCodeUnits).join(","))
  if (!onReorder) throw new Error(`no drag list holds ${orderedIds.join(",")}`)
  act(() => onReorder(orderedIds, orderedIds[0] ?? ""))
}

describe("TeamsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setViewportWidth(1440)
    // Play order unless a test is about grouping.
    window.localStorage.setItem(TEAMS_GROUP_BY_STORAGE_KEY, "none")
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  describe("toolbar", () => {
    it("puts search and Mode in Find, Group by and the layout in View, and Create team in Actions", async () => {
      api.list.mockResolvedValue(list(team("A")))
      await renderPage()
      await screen.findAllByTestId("team-card")
      const toolbar = screen.getByTestId("teams-toolbar")
      const slot = (name: string) =>
        // eslint-disable-next-line testing-library/no-node-access -- the toolbar slots have no role or name to query by
        toolbar.querySelector<HTMLElement>(`[data-slot="page-toolbar-${name}"]`)
      const find = slot("find")
      expect(
        within(find!).getByRole("searchbox", { name: "Search teams or units" })
      ).toBeInTheDocument()
      expect(
        within(find!).getByRole("combobox", { name: "Mode" })
      ).toBeInTheDocument()
      const view = slot("view")
      expect(within(view!).getByText("Group by")).toBeInTheDocument()
      expect(within(view!).getByText("Layout")).toBeInTheDocument()
      const actions = slot("actions")
      expect(
        within(actions!).getByRole("button", { name: "Create team" })
      ).toBeInTheDocument()
      expect(within(actions!).getByTestId("teams-limit")).toHaveTextContent(
        "1 of 50"
      )
    })

    it("finds a team by the name of a unit in its lineup", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", { characterIds: ["ultraTitus"] }),
          team("B", { characterIds: ["ultraCalgar"] })
        )
      )
      const user = userEvent.setup()
      await renderPage()
      await screen.findAllByTestId("team-card")
      await user.type(
        screen.getByRole("searchbox", { name: "Search teams or units" }),
        "calgar"
      )
      await waitFor(() => expect(cardNames()).toEqual(["Team B"]))
    })

    it("hides a quick-filter chip at 0, and filters by Needs fixes", async () => {
      api.list.mockResolvedValue(
        list(
          team("A"),
          team("B", {
            modes: ["warOffense"],
            mowIds: ["ultraDreadnought", "tauBroadside"],
            issues: ["tooManyCoreMows"],
          })
        )
      )
      const user = userEvent.setup()
      await renderPage()
      await screen.findAllByTestId("team-card")
      expect(screen.queryByTestId("teams-chip-shared")).toBeNull()
      const chip = screen.getByTestId("teams-chip-needs-fixes")
      expect(chip).toHaveTextContent("Needs fixes1")
      await user.click(chip)
      expect(cardNames()).toEqual(["Team B"])
    })

    it("keeps an active quick-filter chip once its count reaches 0, and offers Clear filters", async () => {
      api.list
        .mockResolvedValueOnce(
          list(team("A"), team("B", { issues: ["tooFewCharacters"] }))
        )
        .mockResolvedValue(list(team("A")))
      api.remove.mockResolvedValue(undefined)
      const user = userEvent.setup()
      await renderPage()
      await user.click(await screen.findByTestId("teams-chip-needs-fixes"))
      await user.click(screen.getByRole("button", { name: "Delete Team B" }))
      await user.click(
        within(await screen.findByRole("dialog")).getByRole("button", {
          name: "Delete team",
        })
      )
      expect(await screen.findByText("No teams match.")).toBeInTheDocument()
      const chip = screen.getByTestId("teams-chip-needs-fixes")
      expect(chip).toHaveTextContent("Needs fixes0")
      expect(chip).toHaveAttribute("data-state", "on")
      await user.click(screen.getByRole("button", { name: "Clear filters" }))
      expect(cardNames()).toEqual(["Team A"])
      expect(screen.queryByTestId("teams-chip-needs-fixes")).toBeNull()
    })

    it("offers Clear search when only the search hides every team", async () => {
      api.list.mockResolvedValue(list(team("A")))
      const user = userEvent.setup()
      await renderPage()
      await screen.findAllByTestId("team-card")
      await user.type(
        screen.getByRole("searchbox", { name: "Search teams or units" }),
        "zzz"
      )
      await user.click(
        within(await screen.findByTestId("teams-no-match")).getByRole(
          "button",
          { name: "Clear search" }
        )
      )
      expect(cardNames()).toEqual(["Team A"])
    })
  })

  describe("states", () => {
    it("shows a loading state with Create team unavailable", async () => {
      api.list.mockReturnValue(new Promise(() => {}))
      await renderPage()
      expect(
        screen.getByRole("status", { name: "Loading your teams…" })
      ).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Create team" })).toBeDisabled()
    })

    it("shows an error with Retry, not the empty state, when the teams fail to load", async () => {
      api.list.mockRejectedValueOnce(new ApiError(500, "down"))
      await renderPage()
      expect(
        await screen.findByText("Your teams couldn't be loaded.")
      ).toBeInTheDocument()
      expect(screen.queryByText("No teams yet.")).not.toBeInTheDocument()

      api.list.mockResolvedValue(list(team("A")))
      await userEvent.click(screen.getByRole("button", { name: "Retry" }))
      expect(
        await screen.findByRole("listitem", { name: "Team A" })
      ).toBeInTheDocument()
    })

    it("offers Create team and the V1 import when there are no teams", async () => {
      api.list.mockResolvedValue(list())
      await renderPage()
      const empty = await screen.findByTestId("teams-empty")
      expect(within(empty).getByText("No teams yet.")).toBeInTheDocument()
      expect(
        within(empty).getByRole("button", { name: "Create team" })
      ).toBeInTheDocument()
      expect(
        within(empty).getByRole("link", { name: "Import your V1 teams" })
      ).toHaveAttribute("href", "/account/v1-import")
    })

    it("lists teams without lock marks and prompts to sync when the roster never synced", async () => {
      api.list.mockResolvedValue(
        list(team("A", { characterIds: ["ultraCalgar", "ultraTitus"] }))
      )
      await renderPage()
      expect(await screen.findByTestId("teams-sync-prompt")).toBeInTheDocument()
      const card = screen.getByRole("listitem", { name: "Team A" })
      // eslint-disable-next-line testing-library/no-node-access -- the portraits are decorative (aria-hidden), so only their data attributes say locked
      expect(card.querySelector('[data-locked="true"]')).toBeNull()
    })

    it("marks units the synced roster has not unlocked", async () => {
      await seedPlayerData({
        characters: [
          {
            unitId: "ultraCalgar",
            progressionIndex: "Legendary:RedFiveStars",
            rank: "Diamond1",
            xp: 0,
            xpLevel: 45,
            shards: 0,
            mythicShards: 0,
            abilities: [],
            appliedUpgradeSlots: [],
            equippedItems: [],
          },
        ],
        mows: [],
      })
      api.list.mockResolvedValue(
        list(team("A", { characterIds: ["ultraCalgar", "ultraTitus"] }))
      )
      await renderPage()
      const card = await screen.findByRole("listitem", { name: "Team A" })
      await waitFor(() =>
        expect(
          // eslint-disable-next-line testing-library/no-node-access -- a unit's list item is found by its unit id, which is not its accessible name
          card.querySelector('li[data-unit="ultraTitus"]')
        ).toHaveAttribute("data-locked", "true")
      )
      expect(
        // eslint-disable-next-line testing-library/no-node-access -- a unit's list item is found by its unit id, which is not its accessible name
        card.querySelector('li[data-unit="ultraCalgar"]')
      ).not.toHaveAttribute("data-locked")
      expect(screen.queryByTestId("teams-sync-prompt")).not.toBeInTheDocument()
    })

    it("shows the core, then the flex units and the core MoW, at 40px", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", {
            characterIds: ["c1", "c2", "c3", "c4", "c5", "f1", "f2"],
            flexStartIndex: 5,
            mowIds: ["ultraDreadnought", "tauBroadside"],
            mowFlexStartIndex: 1,
          })
        )
      )
      await renderPage()
      const card = await screen.findByRole("listitem", { name: "Team A" })
      const flex = within(card).getByRole("list", { name: "Flex" })
      expect(
        within(flex)
          .getAllByRole("listitem")
          .map((item) => item.getAttribute("data-unit"))
      ).toEqual(["f1", "f2", "tauBroadside"])
      expect(
        within(within(card).getByRole("list", { name: "Machines of War" }))
          .getAllByRole("listitem")
          .map((item) => item.getAttribute("data-unit"))
      ).toEqual(["ultraDreadnought"])
      expect(
        within(within(card).getByRole("list", { name: "Core" })).getAllByRole(
          "listitem"
        )
      ).toHaveLength(5)
      const portraits = within(flex).getAllByTestId("unit-portrait")
      expect(portraits.map((portrait) => portrait.dataset.size)).toEqual([
        "sm",
        "sm",
        "sm",
      ])
    })

    it("shows a broken rule as an error chip, with the reason and its fix on hover", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", {
            modes: ["warOffense"],
            mowIds: ["ultraDreadnought", "tauBroadside"],
            issues: ["tooManyCoreMows"],
            rarityCap: "Epic",
          })
        )
      )
      await renderPage()
      const card = await screen.findByRole("listitem", { name: "Team A" })
      const chips = within(card).getAllByTestId("team-status-chip")
      expect(chips.map((chip) => chip.textContent)).toEqual([
        "Epic cap",
        "2 core Machines of War (max 1)",
      ])
      expect(chips[1]).toHaveAttribute("data-kind", "error")
      expect(chips[1]).toHaveAttribute(
        "title",
        "A war or Tournament Arena team can have at most one core Machine of War. Make 1 Machine of War flex."
      )
    })

    it("chips a unit shared only with a team of a common mode", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", { modes: ["warOffense"], characterIds: ["ultraCalgar"] }),
          team("B", { modes: ["warOffense"], characterIds: ["ultraCalgar"] }),
          team("C", { modes: ["horde"], characterIds: ["ultraCalgar"] })
        )
      )
      await renderPage()
      const chipsOf = async (name: string) =>
        within(await screen.findByRole("listitem", { name }))
          .queryAllByTestId("team-status-chip")
          .map((chip) => chip.textContent)
      expect(await chipsOf("Team A")).toEqual(["Calgar shared"])
      expect(await chipsOf("Team C")).toEqual([])
    })

    it("lets a unit be in an offense and a defense team, and in two teams of another mode", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", { modes: ["warOffense"], characterIds: ["ultraCalgar"] }),
          team("B", { modes: ["warDefense"], characterIds: ["ultraCalgar"] }),
          team("C", { modes: ["horde"], characterIds: ["ultraTitus"] }),
          team("D", { modes: ["horde"], characterIds: ["ultraTitus"] })
        )
      )
      await renderPage()
      await screen.findByRole("listitem", { name: "Team A" })
      expect(screen.queryAllByTestId("team-status-chip")).toEqual([])
      expect(screen.queryByTestId("teams-chip-shared")).toBeNull()
    })

    it("shows a team's notes and what Incursions it is for", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", {
            modes: ["incursion"],
            incursionMowIds: ["orksRukkatrukk"],
            notes: "Use Titus first",
          })
        )
      )
      await renderPage()
      const card = await screen.findByRole("listitem", { name: "Team A" })
      expect(within(card).getByTestId("team-card-notes")).toHaveTextContent(
        "Use Titus first"
      )
      expect(within(card).getByTestId("team-card-context")).toHaveTextContent(
        /^Incursions: /
      )
    })
  })

  describe("layouts", () => {
    it("shows a table with empty core slots and an empty status cell, and remembers it", async () => {
      api.list.mockResolvedValue(
        list(
          team("A", {
            characterIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
          }),
          team("B", {
            modes: ["warOffense"],
            mowIds: ["ultraDreadnought", "tauBroadside"],
            issues: ["tooManyCoreMows"],
          })
        )
      )
      const user = userEvent.setup()
      await renderPage()
      await screen.findAllByTestId("team-card")
      await user.click(screen.getByTestId("teams-layout-table"))
      const rows = screen.getAllByTestId("team-row")
      expect(
        within(rows[0]!).getAllByTestId("team-row-empty-slot")
      ).toHaveLength(2)
      expect(within(rows[0]!).queryByTestId("team-status")).toBeNull()
      expect(rows[1]).toHaveAttribute("data-issues", "true")
      expect(window.localStorage.getItem(TEAMS_LAYOUT_STORAGE_KEY)).toBe(
        "table"
      )
    })

    it("shows a saved table as a list on a phone", async () => {
      setViewportWidth(390)
      window.localStorage.setItem(TEAMS_LAYOUT_STORAGE_KEY, "table")
      api.list.mockResolvedValue(
        list(
          team("A", {
            characterIds: ["ultraCalgar", "ultraTitus"],
            flexStartIndex: 1,
          })
        )
      )
      await renderPage()
      await screen.findAllByTestId("team-card")
      expect(screen.queryByTestId("teams-table")).toBeNull()
      expect(screen.getByTestId("team-list-more")).toHaveTextContent("+1")
    })
  })

  describe("Mode filter and grouping", () => {
    const three = () =>
      list(
        team("A", { modes: ["horde"] }),
        team("B", { modes: ["guildRaid"] }),
        team("C", { modes: ["horde", "guildRaid"] })
      )

    it("lists only the teams with the chosen mode", async () => {
      api.list.mockResolvedValue(three())
      const user = userEvent.setup()
      await renderPage()
      await screen.findAllByTestId("team-card")
      await user.click(screen.getByRole("combobox", { name: "Mode" }))
      await user.click(screen.getByRole("option", { name: "Horde" }))
      expect(cardNames()).toEqual(["Team A", "Team C"])
      expect(window.localStorage.getItem(TEAMS_MODE_STORAGE_KEY)).toBe("horde")
    })

    it("restores the mode chosen on this device", async () => {
      window.localStorage.setItem(TEAMS_MODE_STORAGE_KEY, "warOffense")
      api.list.mockResolvedValue(
        list(
          team("A", { modes: ["warOffense"] }),
          team("B", { modes: ["horde"] })
        )
      )
      await renderPage()
      await screen.findAllByTestId("team-card")
      expect(screen.getByRole("combobox", { name: "Mode" })).toHaveTextContent(
        "War Offense"
      )
      expect(cardNames()).toEqual(["Team A"])
    })

    it("renders with All when storage is unavailable", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked")
      })
      api.list.mockResolvedValue(three())
      await renderPage()
      await screen.findAllByTestId("team-card")
      expect(cardNames()).toHaveLength(3)
      vi.restoreAllMocks()
    })

    it("says when no team matches and clears the filters", async () => {
      window.localStorage.setItem(TEAMS_MODE_STORAGE_KEY, "incursion")
      api.list.mockResolvedValue(three())
      await renderPage()
      expect(await screen.findByText("No teams match.")).toBeInTheDocument()
      await userEvent.click(
        screen.getByRole("button", { name: "Clear filters" })
      )
      expect(cardNames()).toHaveLength(3)
    })

    it("groups by mode by default, a team once under its first mode", async () => {
      window.localStorage.removeItem(TEAMS_GROUP_BY_STORAGE_KEY)
      api.list.mockResolvedValue(three())
      await renderPage()
      await screen.findAllByTestId("team-card")
      const sections = screen.getAllByTestId("teams-section")
      expect(
        sections.map((section) => section.getAttribute("data-mode"))
      ).toEqual(["guildRaid", "horde"])
      expect(
        within(sections[0]!)
          .getAllByTestId("team-card")
          .map((card) => card.getAttribute("aria-label"))
      ).toEqual(["Team B", "Team C"])
      expect(within(sections[0]!).getByText("2 teams")).toBeInTheDocument()
      expect(
        within(sections[1]!)
          .getAllByTestId("team-card")
          .map((card) => card.getAttribute("aria-label"))
      ).toEqual(["Team A"])
    })

    it("does not repeat a section's mode on its cards, and counts every shared unit", async () => {
      window.localStorage.removeItem(TEAMS_GROUP_BY_STORAGE_KEY)
      api.list.mockResolvedValue(
        list(
          team("A", {
            modes: ["warOffense", "horde"],
            characterIds: ["ultraCalgar", "ultraTitus"],
          }),
          team("B", {
            modes: ["warOffense"],
            characterIds: ["ultraCalgar", "ultraTitus"],
          })
        )
      )
      await renderPage()
      const card = await screen.findByRole("listitem", { name: "Team A" })
      expect(
        within(within(card).getByRole("list", { name: "Modes" }))
          .getAllByRole("listitem")
          .map((item) => item.textContent)
      ).toEqual(["Horde"])
      expect(
        within(screen.getByRole("listitem", { name: "Team B" })).queryByRole(
          "list",
          { name: "Modes" }
        )
      ).toBeNull()
      expect(screen.getByTestId("teams-section-shared")).toHaveTextContent(
        "2 units shared"
      )
    })

    it("notes a unit a section's team shares through another Guild War mode, as its chip does", async () => {
      window.localStorage.removeItem(TEAMS_GROUP_BY_STORAGE_KEY)
      api.list.mockResolvedValue(
        list(
          team("A", {
            modes: ["warOffense", "warDefense"],
            characterIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
          }),
          team("B", {
            modes: ["warDefense"],
            characterIds: ["ultraCalgar", "bloodDante", "bloodMephiston"],
          })
        )
      )
      await renderPage()
      const offense = (await screen.findAllByTestId("teams-section")).find(
        (section) => section.dataset.mode === "warOffense"
      )
      expect(offense).toBeDefined()
      expect(
        within(offense!).getByTestId("teams-section-shared")
      ).toHaveTextContent("Calgar in 2 teams")
    })
  })

  describe("reorder", () => {
    const abc = () =>
      list(
        team("A", { modes: ["horde"] }),
        team("B", { modes: ["guildRaid"] }),
        team("C", { modes: ["horde"] })
      )

    it("shows each team's position and drag grip at its top left, and Edit and Delete on it, with no menu", async () => {
      api.list.mockResolvedValue(abc())
      const user = userEvent.setup()
      await renderPage()
      const card = await screen.findByRole("listitem", { name: "Team B" })
      expect(within(card).getByTestId("team-position")).toHaveTextContent("2")
      expect(
        within(card).getByRole("button", { name: "Drag Team B to reorder" })
      ).toBeInTheDocument()
      expect(
        within(card).getByRole("button", { name: "Delete Team B" })
      ).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Reorder" })).toBeNull()
      expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull()
      // Like Goals cards, a tap on the card itself opens nothing; Edit does.
      await user.click(within(card).getByTestId("team-card-name"))
      expect(screen.queryByTestId("team-editor")).toBeNull()
      await user.click(
        within(card).getByRole("button", { name: "Edit Team B" })
      )
      expect(await screen.findByTestId("team-editor")).toBeInTheDocument()
    })

    it("moves teams only among the listed teams' positions", async () => {
      window.localStorage.setItem(TEAMS_MODE_STORAGE_KEY, "horde")
      let saved = abc()
      api.list.mockImplementation(() => Promise.resolve(saved))
      api.reorder.mockImplementation((body: { teamIds: string[] }) => {
        saved = list(
          ...body.teamIds.flatMap((id) =>
            abc().teams.filter((entry) => entry.id === id)
          )
        )
        return Promise.resolve(saved)
      })
      await renderPage()
      await screen.findAllByTestId("team-card")
      drop(["C", "A"])
      await waitFor(() =>
        expect(api.reorder).toHaveBeenCalledWith({ teamIds: ["C", "B", "A"] })
      )
      await waitFor(() => expect(cardNames()).toEqual(["Team C", "Team A"]))
    })

    it("puts the order back with a message when the save fails", async () => {
      api.list.mockResolvedValue(abc())
      api.reorder.mockRejectedValue(new ApiError(500, "down"))
      await renderPage()
      await screen.findAllByTestId("team-card")
      drop(["B", "A", "C"])
      await waitFor(() =>
        expect(api.toastError).toHaveBeenCalledWith(
          "Your new order wasn't saved. Try again."
        )
      )
      await waitFor(() =>
        expect(cardNames()).toEqual(["Team A", "Team B", "Team C"])
      )
    })

    it("reloads the list and says the move was not applied when it is stale", async () => {
      const current = list(...abc().teams, team("D"))
      api.list.mockResolvedValueOnce(abc()).mockResolvedValue(current)
      api.reorder.mockRejectedValue(
        new ApiError(409, "stale", { issueCode: "teamOrderStale", current })
      )
      await renderPage()
      await screen.findAllByTestId("team-card")
      drop(["B", "A", "C"])
      await waitFor(() =>
        expect(api.toastError).toHaveBeenCalledWith(
          "Your teams changed on another device, so your move wasn't applied."
        )
      )
      await waitFor(() =>
        expect(cardNames()).toEqual(["Team A", "Team B", "Team C", "Team D"])
      )
    })

    // Keyboard move and drop are the shared SortableList's, covered by the Goals drag tests.
    it("cancels a keyboard pick-up with Escape without saving", async () => {
      api.list.mockResolvedValue(abc())
      api.reorder.mockResolvedValue(abc())
      await renderPage()
      const grip = await screen.findByRole("button", {
        name: "Drag Team A to reorder",
      })
      grip.focus()
      await act(async () => {
        fireEvent.keyDown(grip, { code: "Space", key: " " })
      })
      // The pick-up really started, so Escape below is what cancels it.
      // Grouped by mode, each section has its own drag list and live region.
      expect(await screen.findByText(/^Picked up Team A\./)).toBeInTheDocument()
      await act(async () => {
        fireEvent.keyDown(document, { code: "Escape", key: "Escape" })
      })
      expect(
        await screen.findByText(
          "Reordering cancelled. Team A returned to position 1 of 3."
        )
      ).toBeInTheDocument()
      expect(api.reorder).not.toHaveBeenCalled()
      expect(cardNames()).toEqual(["Team A", "Team B", "Team C"])
    })

    it("moves a team within its mode section only", async () => {
      window.localStorage.removeItem(TEAMS_GROUP_BY_STORAGE_KEY)
      api.list.mockResolvedValue(abc())
      api.reorder.mockResolvedValue(abc())
      await renderPage()
      await screen.findAllByTestId("team-card")
      // Horde holds positions 1 and 3; Guild Raid's B keeps position 2.
      drop(["C", "A"])
      await waitFor(() =>
        expect(api.reorder).toHaveBeenCalledWith({ teamIds: ["C", "B", "A"] })
      )
    })
  })

  describe("tour", () => {
    const registeredTargets = () => {
      const steps = vi.mocked(useTourPageSteps).mock.lastCall?.[0] as
        { desktop: { target: string }[] } | undefined
      return steps?.desktop.map((step) => step.target) ?? []
    }

    it.each([
      ["a populated list", () => list(team("A"), team("B"))],
      ["an empty list", () => list()],
    ])("points every step at something on %s", async (_case, teams) => {
      api.list.mockResolvedValue(teams())
      await renderPage()
      await waitFor(() =>
        expect(
          screen.queryByRole("status", { name: "Loading your teams…" })
        ).toBeNull()
      )
      const targets = registeredTargets()
      expect(targets.length).toBeGreaterThan(0)
      for (const target of targets) {
        expect(document.querySelector(target), target).not.toBeNull()
      }
    })
  })

  describe("delete and the limit", () => {
    it("deletes nothing when the confirmation is cancelled", async () => {
      api.list.mockResolvedValue(list(team("A")))
      const user = userEvent.setup()
      await renderPage()
      await user.click(
        await screen.findByRole("button", { name: "Delete Team A" })
      )
      const dialog = await screen.findByRole("dialog")
      expect(dialog).toHaveTextContent("Delete Team A?")
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
      expect(api.remove).not.toHaveBeenCalled()
      expect(cardNames()).toEqual(["Team A"])
    })

    it("deletes the team once confirmed", async () => {
      api.list
        .mockResolvedValueOnce(list(team("A"), team("B")))
        .mockResolvedValue(list(team("B")))
      api.remove.mockResolvedValue(undefined)
      const user = userEvent.setup()
      await renderPage()
      await user.click(
        await screen.findByRole("button", { name: "Delete Team A" })
      )
      await user.click(
        within(await screen.findByRole("dialog")).getByRole("button", {
          name: "Delete team",
        })
      )
      expect(api.remove).toHaveBeenCalledWith("A")
      await waitFor(() => expect(cardNames()).toEqual(["Team B"]))
    })

    it("makes Create team unavailable at 50 teams and says the limit is reached", async () => {
      api.list.mockResolvedValue(
        list(...Array.from({ length: 50 }, (_, index) => team(`T${index}`)))
      )
      await renderPage()
      await screen.findAllByTestId("team-card")
      expect(screen.getByRole("button", { name: "Create team" })).toBeDisabled()
      expect(screen.getByTestId("teams-limit")).toHaveTextContent(
        "Limit reached · 50 of 50"
      )
    })
  })
})
