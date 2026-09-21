import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("./userjot-provider", () => ({
  USERJOT_BOARD_URL: "https://tacticusplanner.userjot.com",
}))

import { UserJotBoardLink } from "./userjot-board-link"

describe("UserJotBoardLink", () => {
  it("opens the public board safely in a new tab", () => {
    render(<UserJotBoardLink />)

    expect(screen.getByTestId("userjot-board-link")).toHaveAttribute(
      "href",
      "https://tacticusplanner.userjot.com"
    )
    expect(screen.getByTestId("userjot-board-link")).toHaveAttribute(
      "target",
      "_blank"
    )
    expect(screen.getByTestId("userjot-board-link")).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    )
  })
})
