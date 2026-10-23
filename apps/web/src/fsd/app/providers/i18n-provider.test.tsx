import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/shared/config", () => ({
  i18n: { language: "en", isInitialized: false, on: vi.fn(), off: vi.fn() },
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

describe("I18nProvider", () => {
  it("shows the loading indicator, not an empty root, while translations load", () => {
    render(
      <I18nProvider>
        <WaitsForTranslations />
      </I18nProvider>
    )

    expect(screen.getByTestId("app-loading")).toBeInTheDocument()
  })
})
