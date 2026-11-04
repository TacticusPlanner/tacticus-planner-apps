import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { i18n, listeners } = vi.hoisted(() => {
  const listeners = new Set<(language: string) => void>()
  return {
    listeners,
    i18n: {
      language: "en" as string | undefined,
      isInitialized: false,
      on: (_event: string, listener: (language: string) => void) => {
        listeners.add(listener)
      },
      off: (_event: string, listener: (language: string) => void) => {
        listeners.delete(listener)
      },
    },
  }
})

vi.mock("@/shared/config", () => ({
  i18n,
  getSupportedLanguage: (language: string) => language.split("-")[0],
}))
vi.mock("../auth-route-guards", () => ({
  AuthResolving: () => <div data-testid="app-loading" />,
}))

import { I18nProvider } from "./i18n-provider"

// Suspends like a component waiting on its translation namespaces.
function WaitsForTranslations(): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- Suspense protocol: throwing a pending promise suspends.
  throw new Promise(() => {})
}

function changeLanguage(language: string) {
  act(() => {
    listeners.forEach((listener) => {
      listener(language)
    })
  })
}

afterEach(() => {
  i18n.language = "en"
  document.documentElement.lang = "en"
})

describe("I18nProvider", () => {
  it("shows the loading indicator, not an empty root, while translations load", () => {
    render(
      <I18nProvider>
        <WaitsForTranslations />
      </I18nProvider>
    )

    expect(screen.getByTestId("app-loading")).toBeInTheDocument()
  })

  it("sets the page language from the detected language on first load", () => {
    i18n.language = "de-AT"

    render(<I18nProvider>page</I18nProvider>)

    expect(document.documentElement.lang).toBe("de")
  })

  it("sets the page language once the language is detected after mounting", () => {
    i18n.language = undefined
    render(<I18nProvider>page</I18nProvider>)

    changeLanguage("fr")

    expect(document.documentElement.lang).toBe("fr")
  })

  it("follows language changes until it unmounts", () => {
    const { unmount } = render(<I18nProvider>page</I18nProvider>)

    changeLanguage("es")
    expect(document.documentElement.lang).toBe("es")

    unmount()
    expect(listeners.size).toBe(0)
  })
})
