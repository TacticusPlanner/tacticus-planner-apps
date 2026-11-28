import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageLoading } from "./page-loading"

describe("PageLoading", () => {
  it("is a status named Loading when it has no label", () => {
    render(<PageLoading testId="loading" />)
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument()
    expect(screen.getByTestId("loading")).toHaveTextContent("")
  })

  it("shows and announces its label", () => {
    render(<PageLoading label="Loading the team" />)
    expect(
      screen.getByRole("status", { name: "Loading the team" })
    ).toHaveTextContent("Loading the team")
  })
})
