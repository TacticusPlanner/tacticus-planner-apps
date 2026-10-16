import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import { buildTokenPlanView, type TokenPlanView } from "../lib/token-plan-view"
import { workedViewInput } from "../lib/token-plan-view.fixtures"
import { RunForecastSection } from "./run-forecast"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))

let i18n: I18n
const onOpenTeams = vi.fn()

function renderForecast(view: TokenPlanView, isMobile = false) {
  return render(
    <RunForecastSection
      editInputs={<button type="button">Edit inputs</button>}
      eventId="votanUthar"
      isMobile={isMobile}
      onOpenTeams={onOpenTeams}
      view={view}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

const expand = () => fireEvent.click(screen.getByTestId("run-forecast-toggle"))

describe("RunForecastSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    capture.mockReset()
    onOpenTeams.mockReset()
    localStorage.clear()
  })

  it("heads the collapsed section with the last run's outcome", () => {
    renderForecast(buildTokenPlanView(workedViewInput()))

    expect(screen.getByTestId("run-forecast-header")).toHaveTextContent(
      "By the end of run 3: 6,136 points · Unlock 75 shards short"
    )
    expect(screen.queryByTestId("run-forecast-run")).toBeNull()
  })

  it("shows a block per run, Done finished, and the leftover line linking to Alpha", () => {
    renderForecast(buildTokenPlanView(workedViewInput()))
    expand()

    const runs = screen.getAllByTestId("run-forecast-run")
    expect(runs.map((run) => run.dataset.run)).toEqual(["1", "2", "3"])
    expect(runs[0]).toHaveTextContent("Done")
    expect(runs[0]).toHaveTextContent("Finished")
    expect(runs[1]).toHaveTextContent(
      "32 tokens: 28 free + 4 ad + 0 bonus delivery"
    )
    expect(runs[1]).toHaveTextContent("Uses 6 · 26 left over")
    expect(runs[2]).toHaveTextContent("Uses 0 · 68 left over")
    fireEvent.click(
      screen.getByRole("button", {
        name: "94 tokens with nothing to play: add a team or raise a depth to use them",
      })
    )
    expect(onOpenTeams).toHaveBeenCalledWith("alpha")
    expect(
      screen.getByRole("button", { name: "Edit inputs" })
    ).toBeInTheDocument()
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_run_forecast_expanded",
      eventId: "votanUthar",
    })
  })

  it("shows the Oh So Close hint when a run ends within 75 shards", () => {
    const base = workedViewInput()
    renderForecast(
      buildTokenPlanView({
        ...base,
        // Run 2 opens chest 11 (+25): it ends with 340 shards, 60 short of Unlock.
        progress: { ...(base.progress as object), currentShards: 315 } as never,
      })
    )
    expand()

    expect(
      screen.getAllByTestId("run-forecast-oh-so-close")[0]
    ).toHaveTextContent("Oh So Close: 60 shards for 6,500 blackstone")
  })

  it("stacks the runs on mobile with only the Now block open", () => {
    renderForecast(buildTokenPlanView(workedViewInput()), true)
    expand()

    const open = screen
      .getAllByTestId("run-forecast-run")
      .map((run) => run.querySelector("details")?.open)
    expect(open).toEqual([false, true, false])
  })

  it("is hidden without the event's reward ladder", () => {
    const base = workedViewInput()
    renderForecast(
      buildTokenPlanView({
        ...base,
        event: { ...base.event, rewards: undefined! },
      })
    )

    expect(screen.queryByTestId("legendary-event-run-forecast")).toBeNull()
  })

  it("shows a skeleton while loading", () => {
    renderForecast({ kind: "loading" })

    expect(
      screen.getByTestId("legendary-event-run-forecast-loading")
    ).toBeInTheDocument()
  })
})
