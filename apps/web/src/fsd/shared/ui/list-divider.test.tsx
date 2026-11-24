import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"
import { ListDivider } from "./list-divider"

describe("ListDivider", () => {
  it("is a separator named by its label, the label before the rule", () => {
    render(<ListDivider data-testid="divider" label="Cleared (3)" />)

    const divider = screen.getByRole("separator", { name: "Cleared (3)" })
    expect(divider).toBe(screen.getByTestId("divider"))
    expect(divider).toHaveTextContent("Cleared (3)")
  })

  it("renders the label as a heading instead of a separator when asked", () => {
    render(<ListDivider heading="h3" label="Shops" />)

    expect(
      screen.getByRole("heading", { level: 3, name: "Shops" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("separator")).toBeNull()
  })
})
