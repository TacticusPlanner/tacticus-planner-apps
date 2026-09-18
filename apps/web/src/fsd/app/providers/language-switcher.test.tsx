import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const changeLanguage = vi.fn()
let resolvedLanguage = "en"

vi.mock("react-i18next", () => ({
  // `@/shared/config` re-exports the initialized i18n instance, so importing the component
  // pulls in i18n.ts, which needs this export at module load.
  initReactI18next: { init: () => {}, type: "3rdParty" },
  useTranslation: () => ({
    i18n: {
      changeLanguage,
      language: resolvedLanguage,
      resolvedLanguage,
    },
    t: (key: string) => key,
  }),
}))

import { LanguageSwitcher } from "./language-switcher"

function visibleValue() {
  return screen.getByTestId("language-switcher-value").textContent
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    changeLanguage.mockClear()
    resolvedLanguage = "en"
  })

  it("identifies the active language by its uppercased code, not a flag", () => {
    render(<LanguageSwitcher />)

    expect(visibleValue()).toBe("EN")
  })

  it("shows the same code for the same language whatever the platform renders", () => {
    // The reported bug: a flag emoji falls back to the letters "GB" on Windows. A code is
    // font-independent, so this assertion holds on every platform the suite runs on.
    resolvedLanguage = "de"
    render(<LanguageSwitcher />)

    expect(visibleValue()).toBe("DE")
    expect(visibleValue()).not.toMatch(/\p{Regional_Indicator}/u)
  })

  it("announces the active language by native name to assistive technology", () => {
    resolvedLanguage = "es"
    render(<LanguageSwitcher />)

    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveAccessibleName("language.label")
    expect(trigger).toHaveAccessibleDescription("Español")
  })

  it("lists every option by code and untranslated native name", () => {
    // German UI: the other three names must still read in their own language.
    resolvedLanguage = "de"
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole("combobox"))

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["ENEnglish", "FRFrançais", "DEDeutsch", "ESEspañol"])
  })

  it("switches the app language when an option is picked", () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByText("Français"))

    expect(changeLanguage).toHaveBeenCalledWith("fr")
  })

  it("adds the native name beside the code on a roomy surface", () => {
    render(<LanguageSwitcher className="w-full" showNativeName />)

    expect(visibleValue()).toBe("ENEnglish")
  })

  it("falls back to the default language when the active one is unsupported", () => {
    resolvedLanguage = "ja"
    render(<LanguageSwitcher />)

    expect(visibleValue()).toBe("EN")
  })
})
