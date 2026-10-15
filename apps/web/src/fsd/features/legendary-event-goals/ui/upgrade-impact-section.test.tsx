import type { ReactNode } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { CreateGoalLauncherContext } from "@/entities/goal"
import type { UpgradeImpactRow } from "@/entities/legendary-event"
import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import type { UpgradeImpactState } from "../model/upgrade-impact-state"
import {
  UPGRADE_IMPACT_OPEN_KEY,
  UpgradeImpactSection,
} from "./upgrade-impact-section"
import { I18nextProvider } from "react-i18next"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))

let i18n: I18n
const launch = vi.fn()

const unit = (unitId: string) =>
  ({
    unitId,
    rank: "Gold1",
    progressionIndex: "Epic:RedThreeStars",
  }) as UpgradeImpactRow["step"]["unit"]
const row = (unitId: string): UpgradeImpactRow => ({
  unitId,
  step: {
    kind: "ascension",
    progression: "Epic:RedThreeStars",
    unit: unit(unitId),
  },
  gainPoints: 148,
  teams: [{ teamId: "four", depthBefore: 5, depthAfter: 6 }],
})
const WORKED: UpgradeImpactState = {
  kind: "ready",
  impact: {
    baselinePoints: 505,
    rows: ["ultraCalgar", "ultraApothecary", "ultraTigurius", "ultraTitus"].map(
      row
    ),
  },
}
const NAMES: Record<string, string> = {
  ultraCalgar: "Calgar",
  ultraApothecary: "Incisus",
  ultraTigurius: "Tigurius",
  ultraTitus: "Titus",
}

function renderSection(
  state: UpgradeImpactState,
  {
    layout = "table",
    goalTargets,
  }: {
    layout?: "table" | "list"
    goalTargets?: Parameters<typeof UpgradeImpactSection>[0]["goalTargets"]
  } = {}
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <CreateGoalLauncherContext.Provider value={launch}>
        {children}
      </CreateGoalLauncherContext.Provider>
    </I18nextProvider>
  )
  return render(
    <UpgradeImpactSection
      eventId="votanUthar"
      goalTargets={goalTargets}
      laneId="alpha"
      layout={layout}
      nameOf={(unitId) => NAMES[unitId] ?? unitId}
      state={state}
      teamName={() => "Four"}
    />,
    { wrapper }
  )
}

const summary = () => screen.getByTestId("upgrade-impact-summary")
const expand = () =>
  fireEvent.click(screen.getByTestId("upgrade-impact-toggle"))

describe("UpgradeImpactSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    window.localStorage.clear()
    launch.mockReset()
    capture.mockReset()
  })

  it("starts collapsed with the derived summary, then shows the rows", () => {
    renderSection(WORKED)
    expect(summary()).toHaveTextContent("4 upgrades add points · best +148")
    expect(screen.queryAllByTestId("upgrade-impact-row")).toHaveLength(0)
    expect(screen.getByTestId("upgrade-impact-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    )

    expand()
    const rows = screen.getAllByTestId("upgrade-impact-row")
    expect(rows.map((element) => element.dataset.unit)).toEqual([
      "ultraCalgar",
      "ultraApothecary",
      "ultraTigurius",
      "ultraTitus",
    ])
    expect(
      within(rows[2]!).getByTestId("upgrade-impact-step")
    ).toHaveTextContent("Ascension to Epic Red Three Stars")
    expect(
      within(rows[2]!).getByTestId("upgrade-impact-teams")
    ).toHaveTextContent("Four: battle 5 → 6")
    expect(
      within(rows[2]!).getByTestId("upgrade-impact-gain")
    ).toHaveTextContent("+148 points")
    expect(window.localStorage.getItem(UPGRADE_IMPACT_OPEN_KEY)).toBe("open")
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_upgrade_impact_expanded",
      eventId: "votanUthar",
      laneId: "alpha",
      rowCount: 4,
    })
  })

  it("remembers the open state", () => {
    window.localStorage.setItem(UPGRADE_IMPACT_OPEN_KEY, "open")
    renderSection(WORKED)
    expect(screen.getAllByTestId("upgrade-impact-row")).toHaveLength(4)
  })

  it("opens the goal sheet prefilled for a row's step", () => {
    renderSection(WORKED)
    expand()
    fireEvent.click(
      screen.getByRole("button", { name: "Create goal for Tigurius" })
    )
    expect(launch).toHaveBeenCalledWith({
      entityType: "Character",
      entityId: "ultraTigurius",
      goalType: "Ascension",
      requiredProgression: "Epic:RedThreeStars",
    })
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_create_goal_opened",
      eventId: "votanUthar",
      laneId: "alpha",
      source: "upgradeImpact",
      goalType: "Ascension",
    })
  })

  it("shows In goals when an Active goal reaches the step", () => {
    renderSection(WORKED, {
      goalTargets: new Map([
        [
          "ultraTigurius",
          {
            unitId: "ultraTigurius",
            goals: [
              {
                goalId: "g",
                kind: "Ascension",
                progressionEnd: "Legendary:RedThreeStars",
              },
            ],
          },
        ],
      ]),
    })
    expand()
    const tigurius = screen
      .getAllByTestId("upgrade-impact-row")
      .find((element) => element.dataset.unit === "ultraTigurius")!
    expect(
      within(tigurius).getByTestId("upgrade-impact-in-goals")
    ).toBeVisible()
    expect(
      within(tigurius).queryByTestId("upgrade-impact-create-goal")
    ).not.toBeInTheDocument()
    expect(within(tigurius).getByTestId("unit-goal-badge")).toBeInTheDocument()
  })

  it("names every empty state in the header", () => {
    const { rerender } = renderSection({ kind: "noTeams" })
    expect(summary()).toHaveTextContent(
      "Add a team to see which upgrades add points"
    )
    rerender(
      <UpgradeImpactSection
        eventId="votanUthar"
        goalTargets={undefined}
        laneId="alpha"
        layout="table"
        nameOf={(unitId) => unitId}
        state={{ kind: "needsEstimates" }}
        teamName={() => "Four"}
      />
    )
    expect(summary()).toHaveTextContent("Needs clear estimates")
    rerender(
      <UpgradeImpactSection
        eventId="votanUthar"
        goalTargets={undefined}
        laneId="alpha"
        layout="table"
        nameOf={(unitId) => unitId}
        state={{ kind: "ready", impact: { baselinePoints: 0, rows: [] } }}
        teamName={() => "Four"}
      />
    )
    expect(summary()).toHaveTextContent(
      "No single next step adds points on this lane"
    )
  })

  it("renders two-line cards with icon buttons on mobile", () => {
    renderSection(WORKED, { layout: "list" })
    expand()
    expect(screen.getByTestId("upgrade-impact-list")).toBeInTheDocument()
    const button = screen.getByRole("button", {
      name: "Create goal for Calgar",
    })
    expect(button).toHaveClass("size-11")
    expect(button).not.toHaveTextContent("Create goal")
  })
})
