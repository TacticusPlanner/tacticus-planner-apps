import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import type { MilestoneGap, MilestonePush } from "../lib/milestone-push"
import { MilestoneGapSection } from "./milestone-gap"

let i18n: I18n

const token = (battleIndex: number, points: number, teamName = "Melee") => ({
  laneId: "beta" as const,
  battleIndex,
  teamId: teamName.toLowerCase(),
  teamName,
  points,
})

const push = (overrides: Partial<MilestonePush> = {}): MilestonePush => ({
  kind: "stopHere",
  token: token(8, 420, "Ultras"),
  gain: 330,
  closesGap: true,
  displaced: token(3, 90),
  retry: { displaces: token(4, 120) },
  ...overrides,
})

const gap = (overrides: Partial<MilestoneGap> = {}): MilestoneGap => ({
  run: 1,
  step: "unlock",
  shardsMissing: 25,
  pointsNeeded: 295,
  pushes: [push()],
  combined: null,
  ...overrides,
})

const renderGap = (value: MilestoneGap) =>
  render(<MilestoneGapSection gap={value} />, { wrapper: i18nWrapper(i18n) })

describe("MilestoneGapSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists a push: battle and gain, then team, why and what it replaces, with a shared retry footer", () => {
    renderGap(gap())

    expect(screen.getByTestId("milestone-gap")).toHaveTextContent(
      "Close the gap: +295 points for Unlock"
    )
    const row = screen.getByTestId("milestone-gap-push")
    expect(row).toHaveTextContent("Beta battle 9+330")
    expect(screen.getByTestId("milestone-gap-details")).toHaveTextContent(
      "Try another team: Ultras · replaces Beta battle 4 (+90)"
    )
    expect(screen.getByRole("img", { name: "Closes the gap" })).toBeVisible()
    expect(screen.getByTestId("milestone-gap-retry")).toHaveTextContent(
      "A failed try costs 1 more token and drops Beta battle 5 (−120)"
    )
    expect(screen.getByTestId("milestone-gap-scope")).toHaveTextContent(
      "Checks battles marked Maybe clear or Stop here and teams with a lowered depth."
    )
  })

  it("names a lowered depth and a spare token retry", () => {
    renderGap(
      gap({
        pushes: [
          push({
            kind: "belowEstimate",
            token: token(5, 200),
            displaced: null,
            retry: { displaces: null },
          }),
        ],
      })
    )

    expect(screen.getByTestId("milestone-gap-push")).toHaveTextContent(
      "Beta battle 6+330"
    )
    expect(screen.getByTestId("milestone-gap-details")).toHaveTextContent(
      /^Melee · one more battle$/
    )
    expect(screen.getByTestId("milestone-gap-retry")).toHaveTextContent(
      "A failed try uses a spare token"
    )
  })

  it("names a Maybe clear retry", () => {
    renderGap(gap({ pushes: [push({ kind: "maybeClear" })] }))

    expect(screen.getByTestId("milestone-gap-details")).toHaveTextContent(
      "Ultras · Maybe clear retry"
    )
  })

  it("names each row's retry when they differ", () => {
    renderGap(
      gap({
        pushes: [push(), push({ retry: { displaces: token(6, 80) } })],
      })
    )

    expect(screen.queryByTestId("milestone-gap-retry")).toBeNull()
    const details = screen.getAllByTestId("milestone-gap-details")
    expect(details[0]).toHaveTextContent("retry drops Beta battle 5")
    expect(details[1]).toHaveTextContent("retry drops Beta battle 7")
  })

  it("shows the combination when no push closes the gap alone", () => {
    renderGap(
      gap({
        pushes: [push({ closesGap: false }), push({ closesGap: false })],
        combined: { indexes: [0, 1], gain: 500 },
      })
    )

    expect(screen.getByTestId("milestone-gap-combined")).toHaveTextContent(
      "Together the top 2 close it (+500)"
    )
  })

  it("says when even all pushes fall short", () => {
    renderGap(gap({ pushes: [push({ closesGap: false })] }))

    expect(screen.getByTestId("milestone-gap-short")).toBeVisible()
  })

  it("renders nothing without pushes", () => {
    renderGap(gap({ pushes: [] }))

    expect(screen.queryByTestId("milestone-gap")).toBeNull()
  })
})
