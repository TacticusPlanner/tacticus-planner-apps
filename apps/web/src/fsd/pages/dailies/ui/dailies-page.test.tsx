import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { DailiesPage } from "./dailies-page"

describe("DailiesPage", () => {
  it("renders the under-construction placeholder", () => {
    render(<DailiesPage />)

    expect(screen.getByTestId("dailies-page")).toBeVisible()
    expect(screen.getByText("dailies.title")).toBeVisible()
    expect(screen.getByText("dailies.description")).toBeVisible()
  })
})
