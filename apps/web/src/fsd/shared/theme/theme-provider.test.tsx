import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider, useTheme } from "./theme-provider"

function ThemeName() {
  return <span data-testid="theme">{useTheme().theme}</span>
}

describe("ThemeProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove("light", "dark")
  })

  it("applies the system theme without an error when storage is blocked", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError")
    }
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked })
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )

    render(
      <ThemeProvider>
        <ThemeName />
      </ThemeProvider>
    )

    expect(screen.getByTestId("theme")).toHaveTextContent("system")
    expect(document.documentElement).toHaveClass("dark")
  })
})
