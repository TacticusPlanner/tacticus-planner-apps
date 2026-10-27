import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"
import enQuest from "../../../../../public/locales/en/quest.json"

import type { QuestBattleEstimate } from "../model/quest-estimates"
import type { QuestTeam } from "../model/quest-team"
import { QuestEstimateBlock } from "./quest-estimate-block"

let i18n: I18n
const objectives = [{ type: "NotTrait", target: "Psyker", score: 100 }]
const names: Record<string, string> = { thousAhriman: "Ahriman", b: "Bob" }
const nameOf = (id: string) => names[id] ?? id
const team = {} as QuestTeam
const first = {
  power: 40_000,
  clears: false,
  margin: -0.2,
  marginal: false,
  points: 500,
  objectives: [true],
}

function renderBlock(estimate: QuestBattleEstimate | null) {
  return render(
    <QuestEstimateBlock
      estimate={estimate}
      nameOf={nameOf}
      objectives={objectives}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

describe("QuestEstimateBlock", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", { en: { quest: enQuest } })
  })

  it("names the trade-off of the team without objectives", () => {
    renderBlock({
      kind: "ready",
      required: 50_000,
      first,
      second: {
        power: 55_000,
        clears: true,
        margin: 0.1,
        marginal: true,
        points: 400,
        objectives: [false],
        team,
        givenUp: [{ index: 0, breakers: ["thousAhriman"] }],
      },
      shortfall: null,
      capGains: [],
    })

    expect(screen.getByTestId("quest-estimate")).toHaveTextContent(
      "estimate · uncalibrated"
    )
    expect(screen.getByTestId("quest-estimate-first")).toHaveTextContent(
      "With objectives: Doesn't clear · team 40,000 vs 50,000 needed"
    )
    expect(screen.getByTestId("quest-estimate-second")).toHaveTextContent(
      "Without objectives: clears for 400 instead of 500"
    )
    expect(screen.getByTestId("quest-estimate-given-up")).toHaveTextContent(
      /needs Ahriman, excluded by/
    )
  })

  it("shows the shortfall and the cap gains", () => {
    renderBlock({
      kind: "ready",
      required: 50_000,
      first,
      second: null,
      shortfall: 0.2,
      capGains: [{ unitId: "b", gain: 1200 }],
    })

    expect(screen.getByTestId("quest-estimate-short")).toHaveTextContent(
      "20% short"
    )
    expect(screen.getByTestId("quest-estimate-cap-gain")).toHaveTextContent(
      "Bob: +1,200 power at the cap"
    )
  })

  it("explains a battle without enemy data, and renders nothing without an estimate", () => {
    const { unmount } = renderBlock({ kind: "unknown" })
    expect(screen.getByTestId("quest-estimate-unknown")).toHaveTextContent(
      "No estimate: enemy data incomplete"
    )
    unmount()
    renderBlock(null)
    expect(screen.queryByTestId("quest-estimate")).toBeNull()
  })
})
