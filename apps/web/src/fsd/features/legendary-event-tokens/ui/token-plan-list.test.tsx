import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import { buildTokenPlanView, type TokenPlanView } from "../lib/token-plan-view"
import { workedPlan, workedViewInput } from "../lib/token-plan-view.fixtures"
import { TokenPlanList } from "./token-plan-list"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))

let i18n: I18n

function renderList(view: TokenPlanView, isMobile = false) {
  return render(
    <TokenPlanList
      event={utharEvent}
      eventId="votanUthar"
      isMobile={isMobile}
      view={view}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

const expand = () => fireEvent.click(screen.getByTestId("token-plan-toggle"))

describe("TokenPlanList", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    capture.mockReset()
    localStorage.clear()
  })

  it("is collapsed by default with the plan's summary", () => {
    renderList(buildTokenPlanView(workedViewInput()))

    expect(screen.getByTestId("token-plan-summary")).toHaveTextContent(
      "6 tokens · +1,136 points"
    )
    expect(screen.getByTestId("token-plan-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.queryByTestId("token-plan-row")).toBeNull()
  })

  it("groups consecutive tokens by team and marks milestones 13 and 14 on tokens 3 and 5", () => {
    renderList(buildTokenPlanView(workedViewInput()))
    expand()

    expect(
      screen
        .getAllByTestId("token-plan-group")
        .map((group) => [
          group.dataset.team,
          group.querySelectorAll("li[data-index]").length,
        ])
    ).toEqual([
      ["melee", 3],
      ["five", 1],
      ["melee", 2],
    ])
    const markers = screen.getAllByTestId("token-plan-marker")
    expect(markers).toHaveLength(2)
    expect(markers[0]!.closest("[data-index]")).toHaveAttribute(
      "data-index",
      "2"
    )
    expect(markers[0]).toHaveTextContent("Milestone 13 · +85 currency")
    expect(markers[1]!.closest("[data-index]")).toHaveAttribute(
      "data-index",
      "4"
    )
    expect(markers[1]).toHaveTextContent("Milestone 14 · +90 currency")
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_token_plan_expanded",
      eventId: "votanUthar",
      planLength: 6,
    })
  })

  it("lists the objectives no team covers per lane", () => {
    renderList(buildTokenPlanView(workedViewInput()))
    expand()

    const line = screen.getByTestId("token-plan-full-clear")
    expect(line).toHaveAttribute("data-lane", "alpha")
    expect(line).toHaveTextContent(/^Alpha: no team covers .+, .+, .+$/)
  })

  it("remembers that it was expanded", () => {
    const { unmount } = renderList(buildTokenPlanView(workedViewInput()))
    expand()
    unmount()

    renderList(buildTokenPlanView(workedViewInput()))
    expect(screen.getAllByTestId("token-plan-row")).toHaveLength(6)
  })

  it("renders two-line rows on mobile", () => {
    renderList(buildTokenPlanView(workedViewInput()), true)
    expand()

    const row = screen.getAllByTestId("token-plan-row")[0]!
    expect(row.children).toHaveLength(2)
    expect(row).toHaveTextContent("+240")
  })

  it("is hidden with an empty plan", () => {
    renderList(
      buildTokenPlanView(
        workedViewInput({
          plan: { enabled: true, status: "success", data: workedPlan([]) },
        })
      )
    )

    expect(screen.queryByTestId("legendary-event-token-plan")).toBeNull()
  })
})
