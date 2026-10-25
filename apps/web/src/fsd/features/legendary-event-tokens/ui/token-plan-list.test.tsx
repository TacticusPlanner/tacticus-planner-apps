import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import { buildTokenPlanView, type TokenPlanView } from "../lib/token-plan-view"
import { workedPlan, workedViewInput } from "../lib/token-plan-view.fixtures"
import { splitPlanByRun } from "../lib/token-runs"
import type { RunSupply } from "../lib/token-supply"
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

  describe("run sections", () => {
    const supplyOf = (now: number, planned: number): RunSupply[] => [
      {
        run: 1,
        state: "done",
        unknownRun: false,
        free: 0,
        ad: 0,
        bonusDelivery: 0,
        total: 0,
      },
      {
        run: 2,
        state: "now",
        unknownRun: false,
        free: now,
        ad: 0,
        bonusDelivery: 0,
        total: now,
      },
      {
        run: 3,
        state: "planned",
        unknownRun: false,
        free: planned,
        ad: 0,
        bonusDelivery: 0,
        total: planned,
      },
    ]
    const withSupply = (supply: RunSupply[]): TokenPlanView => {
      const view = buildTokenPlanView(workedViewInput())
      if (view.kind !== "ready") throw new Error("worked view is not ready")
      return { ...view, byRun: splitPlanByRun(view.plan.tokens.length, supply) }
    }
    const headers = () =>
      [
        ...screen.queryAllByTestId("token-plan-run-section"),
        ...screen.queryAllByTestId("token-plan-overflow"),
      ].map((section) => section.querySelector("h3")?.textContent)

    it("puts the worked plan in run 2 and shows run 3 with nothing planned", () => {
      renderList(withSupply(supplyOf(32, 68)))
      expand()

      expect(headers()).toEqual([
        "Run 2 · Now6 of 32 tokens · +1,136 points · ends at 6,136",
        "Run 3 · Planned",
      ])
      expect(screen.getByTestId("token-plan-run-empty")).toHaveTextContent(
        "No tokens planned · 68 tokens available"
      )
    })

    it("carries the tokens a run cannot fit into the next and restarts team groups", () => {
      renderList(withSupply(supplyOf(2, 68)))
      expand()

      const [run2, run3] = screen.getAllByTestId("token-plan-run-section")
      expect(run2!.querySelectorAll("li[data-index]")).toHaveLength(2)
      // Melee holds tokens 1–3: token 3 opens a new Melee group in run 3, numbered plan-wide.
      expect(
        run3!.querySelector("[data-testid='token-plan-group']")
      ).toHaveAttribute("data-team", "melee")
      expect(run3!.querySelector("li[data-index]")).toHaveAttribute(
        "data-index",
        "2"
      )
    })

    it("lists the tokens beyond every run's supply", () => {
      renderList(withSupply(supplyOf(2, 2)))
      expand()

      expect(headers().at(-1)).toBe("2 tokens beyond run 3's supply")
      expect(
        screen
          .getByTestId("token-plan-overflow")
          .querySelectorAll("li[data-index]")
      ).toHaveLength(2)
    })
  })
})

describe("TokenPlanList on another page", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    capture.mockReset()
    localStorage.clear()
  })

  it("opens by default, keeps its own open state and reports no expand events", () => {
    render(
      <TokenPlanList
        defaultOpen
        event={utharEvent}
        eventId="votanUthar"
        isMobile={false}
        openKey="wizard.open"
        trackExpand={false}
        view={buildTokenPlanView(workedViewInput())}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.getAllByTestId("token-plan-row").length).toBeGreaterThan(0)
    fireEvent.click(screen.getByTestId("token-plan-toggle"))
    fireEvent.click(screen.getByTestId("token-plan-toggle"))
    expect(capture).not.toHaveBeenCalled()
    expect(localStorage.getItem("wizard.open")).toBe("true")
    expect(
      Object.keys(localStorage).filter((key) => key !== "wizard.open")
    ).toEqual([])
  })
})
