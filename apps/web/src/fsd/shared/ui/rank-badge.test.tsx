import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { RankBadge } from "./rank-badge"

describe("RankBadge", () => {
  it("renders an icon-only badge with an accessible label and no tooltip by default", () => {
    render(<RankBadge rank="Bronze1" showLabel={false} />)
    expect(screen.getByRole("img", { name: "Bronze I" })).toBeInTheDocument()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("surfaces the rank name in a tooltip on hover when `tooltip` is set", async () => {
    render(<RankBadge rank="Bronze1" showLabel={false} tooltip />)
    await userEvent.hover(screen.getByRole("img", { name: "Bronze I" }))
    const tooltips = await screen.findAllByRole("tooltip")
    expect(tooltips.some((node) => node.textContent === "Bronze I")).toBe(true)
  })
})
