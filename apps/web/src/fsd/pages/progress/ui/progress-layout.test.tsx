import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ProgressLayout } from "./progress-layout"

describe("ProgressLayout", () => {
  it("renders routed tabs and navigates between progress sections", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/progress/onslaught"]}>
        <Routes>
          <Route path="/progress" element={<ProgressLayout />}>
            <Route path="onslaught" element={<div>Onslaught route</div>} />
            <Route path="campaigns" element={<div>Campaigns route</div>} />
            <Route
              path="campaign-events"
              element={<div>Campaign events route</div>}
            />
            <Route path="xp-income" element={<div>XP Income route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("Onslaught route")).toBeInTheDocument()
    await user.click(
      screen.getByRole("tab", { name: "progress.tabs.campaigns" })
    )
    expect(await screen.findByText("Campaigns route")).toBeInTheDocument()
    await user.click(
      screen.getByRole("tab", { name: "progress.tabs.campaign-events" })
    )
    expect(await screen.findByText("Campaign events route")).toBeInTheDocument()
    await user.click(
      screen.getByRole("tab", { name: "progress.tabs.xp-income" })
    )
    expect(await screen.findByText("XP Income route")).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "progress.tabs.xp-income" })
    ).toHaveAttribute("data-state", "active")
  })
})
