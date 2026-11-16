import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"

import { ProjectFitCount } from "./project-fit-count"

const ready = (summary: {
  fit: number
  total: number
  notEstimated: number
  allDone: boolean
}) => ({ status: "ready" as const, summary })

describe("ProjectFitCount", () => {
  it("reads the fit count", async () => {
    render(
      <ProjectFitCount
        count={ready({ fit: 2, total: 5, notEstimated: 1, allDone: false })}
      />
    )
    expect(await screen.findByTestId("project-fit-count")).toHaveTextContent(
      "2 of 5 fit"
    )
  })

  it("reads All N done only when no goal is left unestimated", async () => {
    const { rerender } = render(
      <ProjectFitCount
        count={ready({ fit: 3, total: 3, notEstimated: 0, allDone: true })}
      />
    )
    expect(await screen.findByTestId("project-fit-count")).toHaveTextContent(
      "All 3 done"
    )
    rerender(
      <ProjectFitCount
        count={ready({ fit: 1, total: 1, notEstimated: 1, allDone: true })}
      />
    )
    expect(screen.getByTestId("project-fit-count")).toHaveTextContent(
      "1 of 1 fit"
    )
  })

  it("shows a skeleton while loading", async () => {
    render(<ProjectFitCount count={{ status: "loading" }} />)
    expect(
      await screen.findByTestId("project-fit-count-loading")
    ).toBeInTheDocument()
  })
})
