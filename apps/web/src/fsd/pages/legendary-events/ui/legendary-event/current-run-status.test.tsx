import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"

import { CurrentRunStatus } from "./current-run-status"
import { currentRunView, syncedRunStatus } from "./current-run-status.fixtures"

let i18n: I18n

beforeAll(async () => {
  i18n = await createTestI18n("en")
})

const renderStatus = (view = currentRunView()) =>
  render(
    <CurrentRunStatus nowMs={0} runStatus={syncedRunStatus} view={view} />,
    { wrapper: i18nWrapper(i18n) }
  )

describe("CurrentRunStatus", () => {
  it("shows each fact once: tokens, a Now / End of run table, the milestone and the step", () => {
    renderStatus()

    expect(screen.getByTestId("run-status-run")).toHaveTextContent(
      "Event 1 of 3"
    )
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      "0/12 tokens, next token ready"
    )
    expect(screen.getByTestId("run-status-run-tokens")).toHaveTextContent(
      "1 left this run"
    )
    const table = screen.getByTestId("run-status-table")
    expect(within(table).getByText("End of run 1")).toBeInTheDocument()
    expect(screen.getByTestId("run-status-row-points")).toHaveTextContent(
      "Points12,41312,508+95"
    )
    expect(screen.getByTestId("run-status-row-currency")).toHaveTextContent(
      "Currency160110+300 earned"
    )
    expect(screen.getByTestId("run-status-milestone")).toHaveTextContent(
      "Next milestone: 87 points to milestone 27 (+300 currency)"
    )
    expect(screen.getByTestId("run-status-goal")).toHaveTextContent(
      "Unlock at token 1 this run · then 4 stars, 120 shards short"
    )
    expect(screen.queryByTestId("reward-outlook-next")).toBeNull()
  })

  it("lists the run's ad tokens and flags today's unwatched ad", () => {
    renderStatus(
      currentRunView({
        run: {
          supply: {
            run: 1,
            state: "now",
            unknownRun: false,
            free: 28,
            ad: 4,
            adTodayPending: true,
            bonusDelivery: 0,
            total: 32,
          },
          tokensUsed: 6,
          tokensLeftOver: 26,
        },
      })
    )

    expect(screen.getByTestId("run-status-run-tokens")).toHaveTextContent(
      "32 left this run · 4 from ads · 26 with nothing to play"
    )
    expect(screen.getByTestId("run-status-ad-today")).toHaveTextContent(
      "Includes today's ad token, not watched yet"
    )
  })

  it("names the shortfall and the later token when the run falls short", () => {
    renderStatus(
      currentRunView({
        run: {
          endingShards: 375,
          stepsReached: [],
          next: { step: "unlock", threshold: 400 },
          shardsMissing: 25,
        },
        stepAt: 3,
        stepRun: 2,
      })
    )

    expect(screen.getByTestId("run-status-goal")).toHaveTextContent(
      "Next: Unlock · 25 shards short at the end of the run · reached at token 4 (run 2)"
    )
  })

  it("shows only the Now column while the plan loads", () => {
    renderStatus({ kind: "loading" })

    expect(screen.getByTestId("run-status-row-points")).toHaveTextContent(
      "Points12,413"
    )
    expect(screen.queryByText(/End of run/)).toBeNull()
    expect(screen.queryByTestId("run-status-goal")).toBeNull()
  })
})
