import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { eventMissions } from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { buildTokenPlanView, type TokenPlanView } from "../lib/token-plan-view"
import { workedPlan, workedViewInput } from "../lib/token-plan-view.fixtures"
import { splitPlanByRun } from "../lib/token-runs"
import type { RunSupply } from "../lib/token-supply"
import { BattleInfoContext } from "./battle-info-context"
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
const expandRuns = () => {
  for (const toggle of screen.queryAllByTestId("token-plan-run-toggle")) {
    fireEvent.click(toggle)
  }
}

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
      ["melee", 1],
      ["five", 1],
      ["melee", 2],
    ])
    expandRuns()
    const markers = screen.getAllByTestId("token-plan-marker")
    expect(markers).toHaveLength(2)
    expect(
      markers[0]!.closest("[data-testid='token-plan-row']")
    ).toHaveAttribute("data-index", "2")
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

  it("shows each team's members as portraits that open the team's details", () => {
    const view = buildTokenPlanView(workedViewInput())
    renderList(view)
    expand()

    const groups = screen.getAllByTestId("token-plan-group")
    for (const group of groups) {
      const members =
        view.kind === "ready"
          ? view.membersByTeam.get(group.dataset.team!)
          : undefined
      expect(
        within(group)
          .queryAllByTestId("token-plan-team-members-portrait")
          .map((portrait) => portrait.dataset.unit)
      ).toEqual(members ?? [])
    }

    const five = groups.find((group) => group.dataset.team === "five")!
    fireEvent.click(within(five).getByTestId("token-plan-team-members"))
    const popover = screen.getByTestId("token-plan-team-members-popover")
    expect(popover).toHaveTextContent("Five")
    expect(within(popover).getAllByTestId("next-token-member")).toHaveLength(
      view.kind === "ready" ? view.membersByTeam.get("five")!.length : 0
    )
  })

  it("folds a team's consecutive battles clearing the same cells into one expandable row", () => {
    renderList(buildTokenPlanView(workedViewInput()))
    expand()

    const run = screen.getByTestId("token-plan-run")
    expect(run).toHaveAttribute("data-count", "3")
    // The row leads with its token count (the token icon and 3), not the plan range.
    expect(within(run).getByTestId("token-plan-token-count")).toHaveAttribute(
      "data-count",
      "3"
    )
    expect(run).toHaveTextContent("3 tokens")
    expect(run).toHaveTextContent("Battles 3–5")
    // Collapsed, it carries the milestone its tokens reach.
    expect(run).toHaveTextContent("Milestone 13 · +85 currency")
    expect(run.querySelectorAll("[data-testid='token-plan-row']")).toHaveLength(
      0
    )

    const toggle = screen.getByTestId("token-plan-run-toggle")
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(toggle).toHaveAccessibleName("Show 3 battles")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(
      [...run.querySelectorAll("[data-testid='token-plan-row']")].map((row) =>
        row.getAttribute("data-index")
      )
    ).toEqual(["0", "1", "2"])
  })

  it("says what each battle of a folded row is worth", () => {
    const view = buildTokenPlanView(workedViewInput())
    if (view.kind !== "ready") throw new Error("not ready")
    renderList(view)
    expand()

    const perBattle = within(
      screen.getByRole("list", { name: "Points per battle" })
    ).getAllByRole("listitem")
    expect(perBattle.map((item) => item.textContent)).toEqual(
      view.plan.tokens
        .slice(0, 3)
        .map((token) => `B${token.battleIndex + 1} +${token.points}`)
    )
    // Expanded, the per-battle rows carry the points instead.
    fireEvent.click(screen.getByTestId("token-plan-run-toggle"))
    expect(
      screen.queryByRole("list", { name: "Points per battle" })
    ).not.toBeInTheDocument()
  })

  it("expands and collapses every folded row at once and remembers it", () => {
    const view = buildTokenPlanView(workedViewInput())
    const { unmount } = renderList(view)
    expand()

    const toggle = () => screen.getByTestId("token-plan-run-toggle")
    expect(toggle()).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }))
    expect(toggle()).toHaveAttribute("aria-expanded", "true")
    expect(
      localStorage.getItem("legendaryEvents.tokenPlan.expandBattles")
    ).toBe("true")

    // A row can still be closed on its own.
    fireEvent.click(toggle())
    expect(toggle()).toHaveAttribute("aria-expanded", "false")

    unmount()
    renderList(view)
    expect(toggle()).toHaveAttribute("aria-expanded", "true")
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }))
    expect(toggle()).toHaveAttribute("aria-expanded", "false")
  })

  it("sums the milestones a row reaches into one line", () => {
    const view = buildTokenPlanView(workedViewInput())
    if (view.kind !== "ready" || !view.forecast) throw new Error("not ready")
    const markers = view.plan.tokens.map(() => ({
      milestones: [] as { milestone: number; payout: number }[],
      steps: [],
    }))
    markers[0]!.milestones.push({ milestone: 1, payout: 25 })
    markers[2]!.milestones.push(
      { milestone: 2, payout: 30 },
      { milestone: 3, payout: 35 }
    )
    renderList({ ...view, forecast: { ...view.forecast, markers } })
    expand()

    const run = screen.getByTestId("token-plan-run")
    expect(within(run).getByTestId("token-plan-marker")).toHaveTextContent(
      /^Milestones 1–3 · \+90 currency$/
    )
    fireEvent.click(screen.getByTestId("token-plan-run-toggle"))
    const rows = within(run).getAllByTestId("token-plan-row")
    expect(rows[0]).toHaveTextContent("Milestone 1 · +25 currency")
    expect(rows[2]).toHaveTextContent("Milestones 2–3 · +65 currency")
  })

  it("opens the first battle's info from a folded row and the team from its name", () => {
    const openBattle = vi.fn()
    const openTeam = vi.fn()
    render(
      <BattleInfoContext.Provider value={openBattle}>
        <TokenPlanList
          event={utharEvent}
          eventId="votanUthar"
          isMobile={false}
          onOpenTeam={openTeam}
          view={buildTokenPlanView(workedViewInput())}
        />
      </BattleInfoContext.Provider>,
      { wrapper: i18nWrapper(i18n) }
    )
    expand()

    fireEvent.click(
      within(screen.getByTestId("token-plan-run")).getByRole("button", {
        name: "Battle info: Alpha battle 3",
      })
    )
    expect(openBattle).toHaveBeenCalledWith("alpha", 2)
    fireEvent.click(screen.getByRole("button", { name: "Open team Five" }))
    expect(openTeam).toHaveBeenCalledWith("alpha", "five")
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
    expect(screen.getByTestId("token-plan-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    )
  })

  it("renders two-line rows on mobile", () => {
    renderList(buildTokenPlanView(workedViewInput()), true)
    expand()
    expandRuns()

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
        adTodayPending: false,
        bonusDelivery: 0,
        total: 0,
      },
      {
        run: 2,
        state: "now",
        unknownRun: false,
        free: now,
        ad: 0,
        adTodayPending: false,
        bonusDelivery: 0,
        total: now,
      },
      {
        run: 3,
        state: "planned",
        unknownRun: false,
        free: planned,
        ad: 0,
        adTodayPending: false,
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
      expect(
        run2!.querySelector("[data-testid='token-plan-run']")
      ).toHaveAttribute("data-count", "2")
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

  describe("Missions order", () => {
    // Uthar regular 2: "Defeat 75 AdMechs".
    const admech = {
      track: "regular" as const,
      mission: eventMissions(utharEvent, "regular").find(
        (mission) => mission.index === 2
      )!,
    }
    // Uthar regular 1 "Defeat 30 Necrons" (ticked Done) and premium 1 "Defeat 30 enemies with
    // Chaos units".
    const necrons = {
      track: "regular" as const,
      mission: eventMissions(utharEvent, "regular").find(
        (mission) => mission.index === 1
      )!,
    }
    const chaos = {
      track: "premium" as const,
      mission: eventMissions(utharEvent, "premium").find(
        (mission) => mission.index === 1
      )!,
    }
    const withMissionOrder = (): TokenPlanView => {
      const view = buildTokenPlanView(workedViewInput())
      if (view.kind !== "ready") throw new Error("worked view is not ready")
      const count = view.plan.tokens.length
      const tokens = [...view.plan.tokens].reverse()
      return {
        ...view,
        byRun: splitPlanByRun(count, [
          {
            run: 1,
            state: "now",
            unknownRun: false,
            free: count,
            ad: 0,
            adTodayPending: false,
            bonusDelivery: 0,
            total: count,
          },
        ]),
        missionOrder: {
          tokens,
          markers: [],
          nextProgress: [],
          steps: tokens.map((_, index) =>
            index === 0
              ? [
                  {
                    ref: admech,
                    total: 75,
                    gained: 75,
                    needed: 75,
                    completes: true,
                    estimate: false,
                  },
                ]
              : []
          ),
          runs: [
            {
              run: 1,
              missions: [
                {
                  ref: admech,
                  needed: 75,
                  reached: 75,
                  doneAt: 0,
                  estimate: false,
                },
                {
                  ref: chaos,
                  needed: 30,
                  reached: 0,
                  doneAt: null,
                  estimate: true,
                },
              ],
              untracked: [],
              completed: [necrons],
            },
          ],
        },
      }
    }

    it("switches to the Missions order and remembers it", () => {
      const view = withMissionOrder()
      const { unmount } = renderList(view)
      expand()

      expect(screen.queryByText("Missions this run")).toBeNull()
      fireEvent.click(screen.getByRole("radio", { name: "Missions" }))

      expect(screen.getByText("Missions this run")).toBeInTheDocument()
      expect(screen.getByText("done at token 1")).toBeInTheDocument()
      const regular = screen.getByRole("region", { name: /Regular missions/ })
      expect(regular).toHaveTextContent("1/2 done")
      expect(regular).toHaveTextContent(/Defeat 30 Necrons\s*Done/)
      const premium = screen.getByRole("region", { name: /Premium missions/ })
      expect(premium).toHaveTextContent("about not reached by this plan")
      expect(premium).not.toHaveTextContent("(premium)")
      const first = screen.getAllByTestId("token-plan-row")[0]!
      expect(first).toHaveTextContent(/Mission done · Defeat 75 /)
      unmount()

      renderList(view)
      expect(screen.getByText("Missions this run")).toBeInTheDocument()
    })

    it("has no switch without a Missions order", () => {
      renderList(buildTokenPlanView(workedViewInput()))
      expand()

      expect(screen.queryByRole("radio", { name: "Missions" })).toBeNull()
    })
  })
})
