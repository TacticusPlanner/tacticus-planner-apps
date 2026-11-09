import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { eventMissions } from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { mark } from "../lib/token-plan.fixtures"
import {
  buildTokenPlanView,
  type TokenPlanView,
  type TokenPlanViewInput,
} from "../lib/token-plan-view"
import {
  UTHAR_RUN_STARTS,
  betweenRunsInput,
  inRun,
  utharShortTeam,
  workedPlan,
  workedTeams,
  workedViewInput,
} from "../lib/token-plan-view.fixtures"
import { useTokenPlan } from "../model/use-token-plan"
import { NextTokenCard } from "./next-token-card"
import { TokenPlanList } from "./token-plan-list"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string | null, id: string | null) => id ?? "",
  useUnitSearchNames: () => () => [],
}))

let i18n: I18n
const onMarkToken = vi.fn()
const onOpenTeams = vi.fn()

function renderCard(
  view: TokenPlanView,
  {
    isMobile = false,
    canMark = true,
    onViewPlan,
    missionsInput,
  }: {
    isMobile?: boolean
    canMark?: boolean
    onViewPlan?: () => void
    missionsInput?: React.ReactNode
  } = {}
) {
  return render(
    <NextTokenCard
      event={utharEvent}
      eventId="votanUthar"
      isMobile={isMobile}
      onMarkToken={canMark ? onMarkToken : undefined}
      onOpenTeams={onOpenTeams}
      missionsInput={missionsInput}
      onViewPlan={onViewPlan}
      view={view}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

/** The card and the Token plan over the page's hook, so team names resolve as on the page. */
function PlannedSections({ input }: { input: TokenPlanViewInput }) {
  const view = useTokenPlan(input)
  return (
    <>
      <NextTokenCard
        event={utharEvent}
        eventId="votanUthar"
        isMobile={false}
        onMarkToken={onMarkToken}
        onOpenTeams={onOpenTeams}
        view={view}
      />
      <TokenPlanList
        event={utharEvent}
        eventId="votanUthar"
        isMobile={false}
        view={view}
      />
    </>
  )
}

/** Uthar Alpha's team as the V1 import stored it: named "alpha", covering Max 2 Hits and Melee. */
const importedAlpha = {
  ...workedTeams[1]!,
  id: "imported",
  name: "alpha",
  sortOrder: 0,
  objectiveIndexes: [2, 3],
}

const withMarks = (annotations: ReturnType<typeof mark>[]) =>
  buildTokenPlanView(
    workedViewInput({
      plan: {
        enabled: true,
        status: "success",
        data: workedPlan(workedTeams, { annotations }),
      },
    })
  )

describe("NextTokenCard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    localStorage.clear()
    capture.mockReset()
    onMarkToken.mockReset()
    onOpenTeams.mockReset()
  })

  it("shows the worked example's next token", () => {
    renderCard(buildTokenPlanView(workedViewInput()))

    expect(screen.getByTestId("next-token-team")).toHaveTextContent("Melee")
    expect(
      screen
        .getAllByTestId("next-token-team-details-portrait")
        .map((portrait) => portrait.dataset.unit)
    ).toEqual(["ultraCalgar", "ultraTitus", "ultraApothecary"])
    fireEvent.click(screen.getByTestId("next-token-team-details"))
    expect(
      screen.getAllByTestId("next-token-member").map((m) => m.dataset.unit)
    ).toEqual(["ultraCalgar", "ultraTitus", "ultraApothecary"])
    expect(
      screen.getByTestId("next-token-team-details-depth")
    ).toHaveTextContent("Clears battles 1–5 of 18 · set by you")
    expect(screen.getByTestId("next-token-battle")).toHaveTextContent(
      "Alpha · Battle 3"
    )
    expect(screen.getByTestId("next-token-points")).toHaveTextContent(
      "+240 points"
    )
    // The first objectives list is the next token's; the rest belong to the tokens up next.
    const objectives = within(screen.getAllByTestId("token-objectives")[0]!)
      .getAllByRole("listitem")
      .map((item) => item.dataset.objective)
    expect(objectives).toEqual(["0", "1", "4"])
    expect(screen.getByTestId("next-token-reason")).toHaveTextContent(
      "Most points available now"
    )
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_next_token_shown",
      eventId: "votanUthar",
      state: "token",
      planLength: 6,
      tokensLeftOver: 94,
    })
  })

  it("lists the next four tokens after it, with View all opening the plan", () => {
    const onViewPlan = vi.fn()
    renderCard(buildTokenPlanView(workedViewInput()), { onViewPlan })
    const upNext = within(screen.getByTestId("next-token-up-next"))

    expect(upNext.getAllByTestId("token-plan-row")).toHaveLength(4)
    fireEvent.click(
      upNext.getByRole("button", { name: "View all 6 planned tokens" })
    )
    expect(onViewPlan).toHaveBeenCalledOnce()
  })

  it("skips a flagged token and battles not playable yet", () => {
    renderCard(withMarks([mark(2, 4, "maybeClear")]))

    expect(screen.getByTestId("next-token-battle")).toHaveTextContent(
      "Alpha · Battle 2"
    )
    expect(screen.getByTestId("next-token-points")).toHaveTextContent("+140")
    expect(screen.getByTestId("next-token-reason")).toHaveTextContent(
      "Most points among battles you can play now"
    )
  })

  it("marks every cleared cell Stop here with Couldn't clear", () => {
    renderCard(buildTokenPlanView(workedViewInput()))

    fireEvent.click(
      screen.getByRole("button", {
        name: "Couldn't clear: mark Melee on Alpha battle 3 as Stop here",
      })
    )

    expect(onMarkToken).toHaveBeenCalledWith("alpha", 2, [0, 1, 4], "stopHere")
  })

  it("marks the objective cells Maybe clear with Partly cleared", () => {
    renderCard(buildTokenPlanView(workedViewInput()))

    fireEvent.click(
      screen.getByRole("button", {
        name: "Partly cleared: mark Melee on Alpha battle 3 as Maybe clear",
      })
    )

    expect(onMarkToken).toHaveBeenCalledWith("alpha", 2, [1, 4], "maybeClear")
  })

  it("stacks touch-sized actions on mobile", () => {
    renderCard(buildTokenPlanView(workedViewInput()), { isMobile: true })

    expect(screen.getByTestId("next-token-partly")).toHaveClass(
      "h-11",
      "w-full"
    )
  })

  it("hides the actions while marks cannot be written", () => {
    renderCard(buildTokenPlanView(workedViewInput()), { canMark: false })

    expect(screen.queryByTestId("next-token-partly")).toBeNull()
  })

  it("adds the next run and hides the actions for Uthar between runs", () => {
    renderCard(buildTokenPlanView(betweenRunsInput(UTHAR_RUN_STARTS)))

    expect(screen.getByTestId("next-token-reason")).toHaveTextContent(
      /for when run 3 starts$/
    )
    expect(screen.queryByTestId("next-token-could-not")).toBeNull()
  })

  it("names no run when the run is unknown (progress, no dates)", () => {
    renderCard(buildTokenPlanView(betweenRunsInput([])))

    const reason = screen.getByTestId("next-token-reason")
    expect(reason).toHaveTextContent(/for when the next run starts$/)
    expect(reason.textContent).not.toMatch(/run \d/)
  })

  it("links an empty state to the lane's Teams section", () => {
    renderCard(
      buildTokenPlanView(
        workedViewInput({
          plan: { enabled: true, status: "success", data: workedPlan([]) },
        })
      )
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Add a team on Alpha to get a plan" })
    )
    expect(onOpenTeams).toHaveBeenCalledWith("alpha", undefined)
  })

  it("asks for a team on Alpha when its only team is incomplete", () => {
    renderCard(
      buildTokenPlanView(
        workedViewInput({
          plan: {
            enabled: true,
            status: "success",
            data: workedPlan([utharShortTeam]),
          },
        })
      )
    )

    expect(
      screen.getByRole("button", { name: "Add a team on Alpha to get a plan" })
    ).toBeInTheDocument()
  })

  it("links a team without depth to its card", () => {
    renderCard(
      buildTokenPlanView(
        workedViewInput({ estimates: { kind: "hidden" }, resolution: inRun(1) })
      )
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Set how far Five clears" })
    )
    expect(onOpenTeams).toHaveBeenCalledWith("alpha", "five")
  })

  it("names a team stored under its lane id by its objectives in the depth prompt", () => {
    render(
      <PlannedSections
        input={workedViewInput({
          estimates: { kind: "hidden" },
          resolution: inRun(1),
          plan: {
            enabled: true,
            status: "success",
            data: workedPlan([importedAlpha]),
          },
        })}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(
      screen.getByRole("button", {
        name: "Set how far α · Max 2 hits · Melee clears",
      })
    ).toBeInTheDocument()
  })

  it("names that team by its objectives on the token and in the Token plan groups", () => {
    render(
      <PlannedSections
        input={workedViewInput({
          plan: {
            enabled: true,
            status: "success",
            data: workedPlan([importedAlpha]),
          },
        })}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("next-token-view")).toHaveTextContent(
      "α · Max 2 hits · Melee"
    )
    fireEvent.click(screen.getByTestId("token-plan-toggle"))
    expect(
      screen
        .getAllByTestId("token-plan-group")
        .map((group) => group.querySelector("h4")?.textContent)
    ).toEqual(["α · Max 2 hits · Melee"])
  })

  it("reads the nothing-left state with the lane's points left", () => {
    renderCard({
      ...(buildTokenPlanView(workedViewInput()) as Extract<
        TokenPlanView,
        { kind: "ready" }
      >),
      next: null,
      empty: { kind: "nothingLeft", laneId: "gamma", points: 9124 },
    })

    expect(screen.getByTestId("next-token-nothingLeft")).toHaveTextContent(
      "Your teams have nothing left to clear · 9,124 points left in Gamma"
    )
  })

  it.each([
    ["unavailable", "next-token-unavailable"],
    ["planError", "next-token-plan-error"],
    ["loading", "next-token-loading"],
  ] as const)("renders the %s state", (kind, testId) => {
    renderCard({ kind })

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })

  it("renders nothing when hidden", () => {
    renderCard({ kind: "hidden" })

    expect(screen.queryByTestId("legendary-event-next-token")).toBeNull()
  })

  describe("Points / Missions switch", () => {
    // Uthar regular 2: "Defeat 75 AdMechs".
    const admech = {
      track: "regular" as const,
      mission: eventMissions(utharEvent, "regular").find(
        (mission) => mission.index === 2
      )!,
    }
    const withMissionOrder = (): TokenPlanView => {
      const view = buildTokenPlanView(workedViewInput())
      if (view.kind !== "ready") throw new Error("worked view is not ready")
      // Missions order puts Alpha battle 2's token first.
      const second = view.plan.tokens.findIndex(
        (token) => token.laneId === "alpha" && token.battleIndex === 1
      )
      const tokens = [
        view.plan.tokens[second]!,
        ...view.plan.tokens.filter((_, index) => index !== second),
      ]
      return {
        ...view,
        missionOrder: {
          tokens,
          markers: [],
          nextProgress: [],
          steps: tokens.map(() => [
            {
              ref: admech,
              total: 75,
              gained: 75,
              needed: 75,
              completes: true,
              estimate: false,
            },
          ]),
          runs: [],
        },
      }
    }

    it("reads the plan in Missions order with the run's mission ticks", () => {
      renderCard(withMissionOrder(), {
        missionsInput: <p data-testid="ticks">ticks</p>,
      })
      expect(screen.getByTestId("next-token-battle")).toHaveTextContent(
        "Alpha · Battle 3"
      )
      expect(screen.queryByTestId("ticks")).toBeNull()

      fireEvent.click(screen.getByRole("radio", { name: "Missions" }))

      expect(screen.getByTestId("next-token-battle")).toHaveTextContent(
        "Alpha · Battle 2"
      )
      fireEvent.click(screen.getByTestId("next-token-progresses"))
      expect(
        screen.getByTestId("next-token-progresses-mission")
      ).toHaveTextContent(/Defeat 75 .*\+75 · done/)
      expect(screen.getByTestId("next-token-reason")).toHaveTextContent(
        "Finishes this run's open missions soonest"
      )
      expect(screen.getByTestId("ticks")).toBeInTheDocument()
      expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
      const upNext = within(screen.getByTestId("next-token-up-next"))
      expect(upNext.getAllByTestId("token-plan-row")).toHaveLength(4)
      expect(
        localStorage.getItem("legendaryEvents.tokenPlan.missionsOrder")
      ).toBe("true")
    })

    it("offers the For missions alternative in Missions order when it is another token", () => {
      const view = withMissionOrder()
      if (view.kind !== "ready") throw new Error("worked view is not ready")
      const ordered = view.missionOrder!.tokens[0]!
      const other = view.plan.tokens.find(
        (token) =>
          token.laneId !== ordered.laneId ||
          token.battleIndex !== ordered.battleIndex
      )!
      const alternative = (token: typeof ordered) => ({
        ...view,
        missions: {
          progressed: [],
          alternative: {
            token,
            // A plan position, which can match the Missions order's own position by chance.
            index: 0,
            missions: [{ ref: admech, amount: 3, estimate: false }],
            pointsDifference: -10,
          },
        },
      })
      const { unmount } = renderCard(alternative(other))
      fireEvent.click(screen.getByRole("radio", { name: "Missions" }))
      expect(
        screen.getByTestId("next-token-missions-alternative")
      ).toBeInTheDocument()
      unmount()

      renderCard(alternative(ordered))
      expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
    })

    it("has no switch without a Missions order", () => {
      renderCard(buildTokenPlanView(workedViewInput()))

      expect(screen.queryByRole("radio", { name: "Missions" })).toBeNull()
    })
  })
})
