import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const themeState = vi.hoisted(() => ({
  current: "system",
  setTheme: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/shared/theme", () => ({
  useTheme: () => ({
    setTheme: themeState.setTheme,
    theme: themeState.current,
  }),
}))

import { ThemeSwitcher } from "./theme-switcher"

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    themeState.current = "system"
    themeState.setTheme.mockClear()
  })

  it("defaults to the system theme value from the theme provider", () => {
    render(<ThemeSwitcher />)

    expect(screen.getByTestId("theme-switcher")).toHaveTextContent(
      "theme.system"
    )
  })

  it("lets the user choose light, dark, and system themes", () => {
    const { rerender } = render(<ThemeSwitcher />)

    fireEvent.click(screen.getByTestId("theme-switcher"))
    fireEvent.click(screen.getByRole("option", { name: "theme.dark" }))
    themeState.current = "dark"
    rerender(<ThemeSwitcher />)

    fireEvent.click(screen.getByTestId("theme-switcher"))
    fireEvent.click(screen.getByRole("option", { name: "theme.light" }))
    themeState.current = "light"
    rerender(<ThemeSwitcher />)

    fireEvent.click(screen.getByTestId("theme-switcher"))
    fireEvent.click(screen.getByRole("option", { name: "theme.system" }))

    expect(themeState.setTheme).toHaveBeenNthCalledWith(1, "dark")
    expect(themeState.setTheme).toHaveBeenNthCalledWith(2, "light")
    expect(themeState.setTheme).toHaveBeenNthCalledWith(3, "system")
  })
})
