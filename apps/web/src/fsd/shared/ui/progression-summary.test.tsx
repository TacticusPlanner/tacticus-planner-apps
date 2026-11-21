import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { ProgressionSummary } from "./progression-summary"

describe("ProgressionSummary", () => {
  it("names the progression and rank as images and keeps the levels as text", () => {
    render(
      <ProgressionSummary
        progression="Legendary:RedThreeStars"
        rank="Gold2"
        details={["ability level 40", "item level 9"]}
        data-testid="summary"
      />
    )
    expect(
      screen.getByRole("img", { name: "Legendary 3★" })
    ).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Gold II" })).toBeInTheDocument()
    expect(screen.getByTestId("summary")).toHaveTextContent(
      "ability level 40 · item level 9"
    )
  })

  it("leaves out the rank and levels when none are given", () => {
    render(
      <ProgressionSummary progression="Common:None" data-testid="summary" />
    )
    expect(screen.getAllByRole("img", { name: "Common" })).not.toHaveLength(0)
    expect(
      screen.queryByRole("img", {
        name: /^(Stone|Iron|Bronze|Silver|Gold|Diamond|Adamantine)/,
      })
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("summary")).toHaveTextContent(/^$/)
  })
})
