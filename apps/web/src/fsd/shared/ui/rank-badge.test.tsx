import type { ReactElement } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TooltipProvider } from "@workspace/ui/components/tooltip"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("@workspace/game-catalog", () => ({
  rankIcon: (rank: string) => `/ranks/${rank}.png`,
}))

import { RankBadge } from "./rank-badge"

const inProvider = (ui: ReactElement) =>
  render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>)

describe("RankBadge", () => {
  it("renders an icon-only badge with an accessible label and no tooltip by default", () => {
    inProvider(<RankBadge rank="Bronze1" showLabel={false} />)
    expect(
      screen.getByRole("img", { name: "ranks.Bronze1" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("surfaces the rank name in a tooltip on hover when `tooltip` is set", async () => {
    inProvider(<RankBadge rank="Bronze1" showLabel={false} tooltip />)
    await userEvent.hover(screen.getByRole("img", { name: "ranks.Bronze1" }))
    const tooltips = await screen.findAllByRole("tooltip")
    expect(tooltips.some((node) => node.textContent === "ranks.Bronze1")).toBe(
      true
    )
  })
})
