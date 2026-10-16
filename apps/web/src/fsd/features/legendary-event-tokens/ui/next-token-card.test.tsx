import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

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
}))

let i18n: I18n
const onMarkToken = vi.fn()
const onOpenTeams = vi.fn()

function renderCard(
  view: TokenPlanView,
  { isMobile = false, canMark = true } = {}
) {
  return render(
    <NextTokenCard
      event={utharEvent}
      eventId="votanUthar"
      isMobile={isMobile}
      onMarkToken={canMark ? onMarkToken : undefined}
      onOpenTeams={onOpenTeams}
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
    capture.mockReset()
    onMarkToken.mockReset()
    onOpenTeams.mockReset()
  })

  it("shows the worked example's next token", () => {
    renderCard(buildTokenPlanView(workedViewInput()))

    expect(screen.getByTestId("next-token-team")).toHaveTextContent("Melee")
    expect(
      screen.getAllByTestId("next-token-member").map((m) => m.dataset.unit)
    ).toEqual(["ultraCalgar", "ultraTitus", "ultraApothecary"])
    expect(screen.getByTestId("next-token-battle")).toHaveTextContent(
      "Alpha · Battle 3"
    )
    expect(screen.getByTestId("next-token-points")).toHaveTextContent(
      "+240 points"
    )
    const objectives = within(screen.getByTestId("token-objectives"))
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
        name: "Set how far Max 2 hits · Melee clears",
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
      "Max 2 hits · Melee"
    )
    fireEvent.click(screen.getByTestId("token-plan-toggle"))
    expect(
      screen
        .getAllByTestId("token-plan-group")
        .map((group) => group.querySelector("h3")?.textContent)
    ).toEqual(["Max 2 hits · Melee"])
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
})
