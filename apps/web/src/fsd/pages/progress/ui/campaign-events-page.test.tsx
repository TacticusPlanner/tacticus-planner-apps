import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/shared/api"
import { render, screen, waitFor, within } from "@/test/render"

const getOverrides = vi.fn()
const saveOverrides = vi.fn()
const mobile = vi.hoisted(() => ({ value: false }))

type Battle = {
  id: string
  campaignGroupId: string
  type: string
  challenge: boolean
  nodeNumber: number
}
const track = (
  groupId: string,
  code: string,
  type: string,
  regular: number,
  challengeNodes: number[] = []
): Battle[] => [
  ...Array.from({ length: regular }, (_, index) => ({
    id: `${code}${index + 1}`,
    campaignGroupId: groupId,
    type,
    challenge: false,
    nodeNumber: index + 1,
  })),
  ...challengeNodes.map((node) => ({
    id: `${code}${node}B`,
    campaignGroupId: groupId,
    type,
    challenge: true,
    nodeNumber: node,
  })),
]
const definition = (groupId: string, coreCharacters: string[] = []) => ({
  groupId,
  faction: "DeathGuard",
  releaseType: "event",
  coreCharacters,
  types: ["Standard", "Extremis"],
  battleIds: [],
})

type CatalogData = {
  definitions: ReturnType<typeof definition>[]
  battles: Battle[]
  synced:
    | {
        tacticusCampaignId: string
        type: string
        completedBattleCount: number
        completedChallengeBattlesIds: string[]
      }[]
    | undefined
  characters: { unitId: string }[]
  liveProgress: { activeCampaignEventId: string | null } | undefined
}

let catalogData: CatalogData
let catalogReadFails = false

// eventCampaign1 (AM): the active event — Standard 5 with challenges at nodes 7 then 3 (catalog
// order deliberately unsorted), Extremis 5. eventCampaign2 (DG): fully completed via synced data.
// eventCampaign3 (TY): untouched.
function defaultCatalog(): CatalogData {
  return {
    definitions: [
      definition("eventCampaign1", ["unitA", "unitB"]),
      definition("eventCampaign2"),
      definition("eventCampaign3"),
    ],
    battles: [
      ...track("eventCampaign1", "AMS", "Standard", 5, [7, 3]),
      ...track("eventCampaign1", "AME", "Extremis", 5),
      ...track("eventCampaign2", "DGS", "Standard", 2),
      ...track("eventCampaign2", "DGE", "Extremis", 2),
      ...track("eventCampaign3", "TYS", "Standard", 2),
      ...track("eventCampaign3", "TYE", "Extremis", 2),
    ],
    synced: [
      {
        tacticusCampaignId: "eventCampaign1",
        type: "Standard",
        completedBattleCount: 2,
        completedChallengeBattlesIds: ["AMS3B"],
      },
      {
        tacticusCampaignId: "eventCampaign2",
        type: "Standard",
        completedBattleCount: 2,
        completedChallengeBattlesIds: [],
      },
      {
        tacticusCampaignId: "eventCampaign2",
        type: "Extremis",
        completedBattleCount: 2,
        completedChallengeBattlesIds: [],
      },
    ],
    characters: [{ unitId: "unitA" }],
    liveProgress: { activeCampaignEventId: "eventCampaign1" },
  }
}

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "progress.events.summary.track")
        return `${String(options?.label)} ${String(options?.done)}/${String(options?.total)}`
      if (key === "progress.events.challengeN")
        return `Challenge ${String(options?.n)}`
      if (key === "progress.events.challengeNode")
        return `Node ${String(options?.id)}`
      if (key === "progress.events.notOwned")
        return `${String(options?.name)} (not owned)`
      if (options && "type" in options) return `${key} ${String(options.type)}`
      return key
    },
  }),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () =>
    catalogReadFails
      ? { status: "error" }
      : { status: "ready", data: catalogData },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCampaignBattles: vi.fn(),
  getCampaignDefinitions: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getCampaignEventProgress: vi.fn(),
  getLiveProgress: vi.fn(),
  getPlayerCharacters: vi.fn(),
}))
vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
  campaignEventProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "campaign-events", "current"],
      queryFn: () => getOverrides(),
    }),
  },
  updateCampaignEventProgressOverrides: (...args: unknown[]) =>
    saveOverrides(...args),
}))

import { useTourPageSteps } from "@/shared/tour"

import { CampaignEventsPage } from "./campaign-events-page"

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/progress/campaign-events", element: <CampaignEventsPage /> },
      {
        path: "/progress/campaigns",
        element: <div data-testid="campaigns-page" />,
      },
    ],
    { initialEntries: ["/progress/campaign-events"] }
  )
  const view = render(<RouterProvider router={router} />)
  return { ...view, router }
}

const current = () => within(screen.getByTestId("current-event"))
const listItem = (groupId: string) =>
  screen.getByTestId(`campaign-event-${groupId}`)
const count = (prefix: string, type: string) =>
  screen.getByTestId(`${prefix}-${type}-count`)

describe("CampaignEventsPage", () => {
  beforeEach(() => {
    catalogData = defaultCatalog()
    catalogReadFails = false
    mobile.value = false
    getOverrides.mockReset().mockResolvedValue({ progress: [], revision: 4 })
    saveOverrides
      .mockReset()
      .mockImplementation((request: { progress: unknown; revision: number }) =>
        Promise.resolve({ ...request, revision: request.revision + 1 })
      )
  })

  describe("layout", () => {
    it("pins the active event expanded and does not repeat it in the list", async () => {
      renderPage()
      expect(await screen.findByTestId("current-event")).toBeInTheDocument()
      expect(
        current().getByTestId("current-event-track-Standard")
      ).toBeInTheDocument()
      expect(screen.queryByTestId("campaign-event-eventCampaign1")).toBeNull()
    })

    it("omits the current-event section when no event is active", async () => {
      catalogData.liveProgress = { activeCampaignEventId: null }
      renderPage()
      await screen.findByTestId("campaign-events-list")
      expect(screen.queryByTestId("current-event")).toBeNull()
      expect(listItem("eventCampaign1")).toBeInTheDocument()
    })

    it("omits the current-event section when the active id is not in the catalog", async () => {
      catalogData.liveProgress = { activeCampaignEventId: "eventCampaign99" }
      renderPage()
      await screen.findByTestId("campaign-events-list")
      expect(screen.queryByTestId("current-event")).toBeNull()
    })

    it("lists unfinished events first with collapsed summaries", async () => {
      renderPage()
      await screen.findByTestId("campaign-events-list")
      const items = screen
        .getAllByTestId(/^campaign-event-eventCampaign\d$/)
        .map((item) => item.dataset.testid)
      expect(items).toEqual([
        "campaign-event-eventCampaign3",
        "campaign-event-eventCampaign2",
      ])
      // Collapsed: the summary is visible, the editors are not rendered.
      expect(
        within(listItem("eventCampaign3")).getByTestId("event-summary")
      ).toHaveTextContent(
        "campaigns:difficulties.eventStandard 0/2campaigns:difficulties.eventExtremis 0/2"
      )
      expect(
        screen.queryByTestId("campaign-event-eventCampaign3-track-Standard")
      ).toBeNull()
      expect(
        within(listItem("eventCampaign3")).getByTestId("event-has-no-data")
      ).toBeInTheDocument()
    })

    it("shows the challenge total and completion in the current event's summary", async () => {
      renderPage()
      expect(
        (await screen.findByTestId("current-event")).querySelector(
          "[data-testid='event-summary']"
        )
      ).toHaveTextContent(
        "campaigns:difficulties.eventStandard 2/5campaigns:difficulties.eventExtremis 0/5progress.events.summary.challenges 1/2"
      )
    })

    it("stacks tracks on mobile and shows them in columns on desktop", async () => {
      const { unmount } = renderPage()
      expect(await screen.findByTestId("current-event-tracks")).toHaveAttribute(
        "data-layout",
        "columns"
      )
      unmount()
      mobile.value = true
      renderPage()
      expect(await screen.findByTestId("current-event-tracks")).toHaveAttribute(
        "data-layout",
        "stacked"
      )
    })

    it("labels core characters and marks unowned ones", async () => {
      renderPage()
      const core = await screen.findByTestId("current-event-core")
      expect(core).toHaveTextContent("progress.events.coreCharacters")
      // Fixture unit ids have no icon asset, so assert on the labelled list items.
      const [owned, unowned] = within(core).getAllByRole("listitem")
      expect(owned).toHaveAttribute("title", "characters:unitA")
      expect(owned).toHaveAttribute("data-owned", "true")
      expect(unowned).toHaveAttribute("title", "characters:unitB (not owned)")
      expect(unowned).toHaveAttribute("data-owned", "false")
    })
  })

  describe("sources", () => {
    it("labels synced, manual and missing data honestly", async () => {
      getOverrides.mockResolvedValue({
        progress: [
          {
            campaignGroupId: "eventCampaign1",
            type: "Extremis",
            completedBattleCount: 3,
            completedChallengeBattlesIds: null,
          },
        ],
        revision: 4,
      })
      renderPage()
      await screen.findByTestId("current-event")
      expect(
        screen.getByTestId("current-event-Standard-battle-source")
      ).toHaveAttribute("data-source", "synced")
      expect(
        screen.getByTestId("current-event-Standard-challenge-source")
      ).toHaveAttribute("data-source", "synced")
      expect(
        screen.getByTestId("current-event-Extremis-battle-source")
      ).toHaveAttribute("data-source", "manual")
      expect(count("current-event", "Extremis")).toHaveTextContent("3/5")
    })

    it("treats a never-synced profile as no synced data, not a load error", async () => {
      catalogData.synced = undefined
      renderPage()
      await screen.findByTestId("current-event")
      expect(
        screen.getByTestId("current-event-Standard-battle-source")
      ).toHaveAttribute("data-source", "none")
      expect(count("current-event", "Standard")).toHaveTextContent("0/5")
    })
  })

  describe("editing", () => {
    it("steps, bounds and maxes the regular count", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("current-event")
      await user.click(
        current().getByRole("button", {
          name: "progress.events.increase campaigns:difficulties.eventStandard",
        })
      )
      expect(count("current-event", "Standard")).toHaveTextContent("3/5")
      expect(
        screen.getByTestId("current-event-Standard-battle-source")
      ).toHaveAttribute("data-source", "manual")
      await user.click(
        current().getByRole("button", {
          name: "progress.events.maxFor campaigns:difficulties.eventStandard",
        })
      )
      expect(count("current-event", "Standard")).toHaveTextContent("5/5")
      expect(
        current().getByRole("button", {
          name: "progress.events.increase campaigns:difficulties.eventStandard",
        })
      ).toBeDisabled()
      expect(
        current().getByRole("button", {
          name: "progress.events.decrease campaigns:difficulties.eventExtremis",
        })
      ).toBeDisabled()
    })

    it("offers Reset to synced only while a value is manual", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("current-event")
      const standard = within(
        screen.getByTestId("current-event-track-Standard")
      )
      expect(
        standard.queryByRole("button", {
          name: "progress.events.resetToSynced",
        })
      ).toBeNull()
      await user.click(
        standard.getByRole("button", {
          name: "progress.events.increase campaigns:difficulties.eventStandard",
        })
      )
      await user.click(
        standard.getByRole("button", { name: "progress.events.resetToSynced" })
      )
      expect(count("current-event", "Standard")).toHaveTextContent("2/5")
      expect(
        screen.getByTestId("current-event-Standard-battle-source")
      ).toHaveAttribute("data-source", "synced")
    })

    it("labels challenges in node order with the node id as a description", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("current-event")
      const first = current().getByRole("button", { name: "Challenge 1" })
      const second = current().getByRole("button", { name: "Challenge 2" })
      expect(first).toHaveAccessibleDescription("Node AMS3B")
      expect(first).toHaveAttribute("aria-pressed", "true")
      expect(second).toHaveAccessibleDescription("Node AMS7B")
      await user.click(second)
      expect(second).toHaveAttribute("aria-pressed", "true")
      expect(
        screen.getByTestId("current-event-Standard-challenge-source")
      ).toHaveAttribute("data-source", "manual")
    })

    it("keeps edits when a list card is collapsed", async () => {
      const user = userEvent.setup()
      renderPage()
      const trigger = await screen.findByTestId(
        "campaign-event-eventCampaign3-trigger"
      )
      await user.click(trigger)
      await user.click(
        within(
          screen.getByTestId("campaign-event-eventCampaign3-track-Standard")
        ).getByRole("button", {
          name: "progress.events.increase campaigns:difficulties.eventStandard",
        })
      )
      await user.click(trigger)
      expect(
        within(listItem("eventCampaign3")).getByTestId("event-summary")
      ).toHaveTextContent("campaigns:difficulties.eventStandard 1/2")
      expect(screen.getByTestId("unsaved-changes-bar")).toBeInTheDocument()
    })

    it("moves an event to the completed group as the draft completes it", async () => {
      const user = userEvent.setup()
      catalogData.liveProgress = { activeCampaignEventId: null }
      renderPage()
      await user.click(
        await screen.findByTestId("campaign-event-eventCampaign3-trigger")
      )
      for (const type of ["Standard", "Extremis"]) {
        await user.click(
          within(
            screen.getByTestId(`campaign-event-eventCampaign3-track-${type}`)
          ).getByRole("button", {
            name: `progress.events.maxFor campaigns:difficulties.event${type}`,
          })
        )
      }
      expect(
        screen
          .getAllByTestId(/^campaign-event-eventCampaign\d$/)
          .map((item) => item.dataset.testid)
      ).toEqual([
        "campaign-event-eventCampaign1",
        "campaign-event-eventCampaign2",
        "campaign-event-eventCampaign3",
      ])
    })
  })

  describe("completed filter", () => {
    it("hides completed events and remembers the choice across visits", async () => {
      const user = userEvent.setup()
      const { unmount } = renderPage()
      await screen.findByTestId("campaign-events-list")
      await user.click(screen.getByRole("switch"))
      expect(screen.queryByTestId("campaign-event-eventCampaign2")).toBeNull()
      unmount()
      renderPage()
      await screen.findByTestId("campaign-events-list")
      expect(screen.getByRole("switch")).toBeChecked()
      expect(screen.queryByTestId("campaign-event-eventCampaign2")).toBeNull()
      expect(listItem("eventCampaign3")).toBeInTheDocument()
    })

    it("explains when every listed event is completed and hidden", async () => {
      const user = userEvent.setup()
      catalogData.definitions = [
        definition("eventCampaign1"),
        definition("eventCampaign2"),
      ]
      renderPage()
      await screen.findByTestId("campaign-events-list")
      await user.click(screen.getByRole("switch"))
      expect(
        screen.getByTestId("campaign-events-all-completed")
      ).toBeInTheDocument()
      await user.click(
        screen.getByRole("button", { name: "progress.events.showCompleted" })
      )
      expect(listItem("eventCampaign2")).toBeInTheDocument()
    })
  })

  describe("saving", () => {
    const increaseStandard = async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(
        current().getByRole("button", {
          name: "progress.events.increase campaigns:difficulties.eventStandard",
        })
      )
    const decreaseStandard = async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(
        current().getByRole("button", {
          name: "progress.events.decrease campaigns:difficulties.eventStandard",
        })
      )

    it("shows the bar only while the draft differs from the saved state", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("current-event")
      expect(screen.queryByTestId("unsaved-changes-bar")).toBeNull()
      await increaseStandard(user)
      expect(screen.getByTestId("unsaved-changes-bar")).toBeInTheDocument()
      // Back to the synced value: still an override (manual 2), so still unsaved.
      await decreaseStandard(user)
      expect(screen.getByTestId("unsaved-changes-bar")).toBeInTheDocument()
      await user.click(
        within(screen.getByTestId("current-event-track-Standard")).getByRole(
          "button",
          { name: "progress.events.resetToSynced" }
        )
      )
      expect(screen.queryByTestId("unsaved-changes-bar")).toBeNull()
      expect(
        screen.queryByRole("button", { name: "progress.events.unsaved.save" })
      ).toBeNull()
    })

    it("saves the normalized draft with the base revision", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("current-event")
      await increaseStandard(user)
      await user.click(current().getByRole("button", { name: "Challenge 2" }))
      await user.click(screen.getByTestId("unsaved-changes-save"))

      await waitFor(() =>
        expect(saveOverrides).toHaveBeenCalledWith({
          progress: [
            {
              campaignGroupId: "eventCampaign1",
              type: "Standard",
              completedBattleCount: 3,
              completedChallengeBattlesIds: ["AMS3B", "AMS7B"],
            },
          ],
          revision: 4,
        })
      )
      expect(
        await screen.findByText("progress.events.saved")
      ).toBeInTheDocument()
      expect(screen.queryByTestId("unsaved-changes-bar")).toBeNull()

      await increaseStandard(user)
      await user.click(screen.getByTestId("unsaved-changes-save"))
      await waitFor(() =>
        expect(saveOverrides.mock.calls[1]?.[0].revision).toBe(5)
      )
    })

    it("discards every edit", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("current-event")
      await increaseStandard(user)
      await user.click(current().getByRole("button", { name: "Challenge 2" }))
      await user.click(screen.getByTestId("unsaved-changes-discard"))
      expect(count("current-event", "Standard")).toHaveTextContent("2/5")
      expect(
        current().getByRole("button", { name: "Challenge 2" })
      ).toHaveAttribute("aria-pressed", "false")
      expect(screen.queryByTestId("unsaved-changes-bar")).toBeNull()
    })

    it("reloads the saved progress after a revision conflict", async () => {
      const user = userEvent.setup()
      getOverrides
        .mockReset()
        .mockResolvedValueOnce({ progress: [], revision: 4 })
        .mockResolvedValueOnce({
          progress: [
            {
              campaignGroupId: "eventCampaign1",
              type: "Standard",
              completedBattleCount: 4,
              completedChallengeBattlesIds: null,
            },
          ],
          revision: 9,
        })
      saveOverrides.mockRejectedValueOnce(new ApiError(409, "stale"))
      renderPage()
      await screen.findByTestId("current-event")
      await increaseStandard(user)
      await user.click(screen.getByTestId("unsaved-changes-save"))

      expect(
        await screen.findByText("progress.events.conflict")
      ).toBeInTheDocument()
      expect(count("current-event", "Standard")).toHaveTextContent("4/5")
      expect(screen.queryByTestId("unsaved-changes-bar")).toBeNull()
      expect(getOverrides).toHaveBeenCalledTimes(2)
    })

    it("keeps the editors and edits when the reload after a conflict fails", async () => {
      const user = userEvent.setup()
      getOverrides
        .mockReset()
        .mockResolvedValueOnce({ progress: [], revision: 4 })
        .mockRejectedValueOnce(new Error("offline"))
      saveOverrides.mockRejectedValueOnce(new ApiError(409, "stale"))
      renderPage()
      await screen.findByTestId("current-event")
      await increaseStandard(user)
      await user.click(screen.getByTestId("unsaved-changes-save"))

      expect(
        await screen.findByText("progress.events.saveError")
      ).toBeInTheDocument()
      expect(screen.queryByTestId("campaign-events-load-error")).toBeNull()
      expect(count("current-event", "Standard")).toHaveTextContent("3/5")
      expect(screen.getByTestId("unsaved-changes-bar")).toBeInTheDocument()
    })

    it("shows the translated error, never the API text, and keeps the edits", async () => {
      const user = userEvent.setup()
      saveOverrides.mockRejectedValueOnce(
        new ApiError(400, "Raw server validation text")
      )
      renderPage()
      await screen.findByTestId("current-event")
      await increaseStandard(user)
      await user.click(screen.getByTestId("unsaved-changes-save"))

      expect(
        await screen.findByText("progress.events.saveError")
      ).toBeInTheDocument()
      expect(screen.queryByText("Raw server validation text")).toBeNull()
      expect(count("current-event", "Standard")).toHaveTextContent("3/5")
      expect(screen.getByTestId("unsaved-changes-bar")).toBeInTheDocument()
    })

    it("asks before leaving with unsaved edits", async () => {
      const user = userEvent.setup()
      const { router } = renderPage()
      await screen.findByTestId("current-event")
      await increaseStandard(user)
      void router.navigate("/progress/campaigns")
      expect(
        await screen.findByText("progress.events.leave.title")
      ).toBeInTheDocument()
      await user.click(
        screen.getByRole("button", { name: "progress.events.leave.stay" })
      )
      expect(screen.getByTestId("campaign-events-page")).toBeInTheDocument()
      void router.navigate("/progress/campaigns")
      await user.click(
        await screen.findByRole("button", {
          name: "progress.events.leave.leave",
        })
      )
      expect(await screen.findByTestId("campaigns-page")).toBeInTheDocument()
    })

    it("navigates without asking when there are no edits", async () => {
      const { router } = renderPage()
      await screen.findByTestId("current-event")
      void router.navigate("/progress/campaigns")
      expect(await screen.findByTestId("campaigns-page")).toBeInTheDocument()
    })
  })

  describe("tour", () => {
    it.each([
      ["desktop", false],
      ["mobile", true],
    ])(
      "every %s step targets an element on the page",
      async (_form, isMobile) => {
        mobile.value = isMobile
        renderPage()
        await screen.findByTestId("current-event")
        const steps = vi.mocked(useTourPageSteps).mock.lastCall?.[0]
        const formSteps =
          (isMobile ? steps?.mobile : undefined) ?? steps?.desktop
        expect(formSteps?.length).toBeGreaterThan(0)
        for (const step of formSteps ?? []) {
          expect(
            document.querySelector(step.target as string),
            String(step.target)
          ).not.toBeNull()
        }
      }
    )
  })

  describe("states", () => {
    it("shows a spinner until the saved overrides load", async () => {
      getOverrides.mockReturnValue(new Promise(() => {}))
      renderPage()
      await waitFor(() =>
        expect(screen.queryByTestId("campaign-events-page")).toBeNull()
      )
    })

    it("shows the translated load error when the overrides fail", async () => {
      getOverrides.mockRejectedValue(new Error("offline"))
      renderPage()
      expect(
        await screen.findByTestId("campaign-events-load-error")
      ).toHaveTextContent("progress.loadError")
    })

    it("shows the translated load error when the local data read fails", async () => {
      catalogReadFails = true
      renderPage()
      expect(
        await screen.findByTestId("campaign-events-load-error")
      ).toHaveTextContent("progress.loadError")
    })

    it("explains when the catalog has no campaign events", async () => {
      catalogData.definitions = []
      renderPage()
      expect(
        await screen.findByTestId("campaign-events-empty")
      ).toHaveTextContent("progress.events.noEvents")
    })
  })
})
