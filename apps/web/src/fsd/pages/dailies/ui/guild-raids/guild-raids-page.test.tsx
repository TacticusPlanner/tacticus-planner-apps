import { render, screen } from "@/test/render"
import { beforeEach, describe, expect, it, vi } from "vitest"

const register = vi.fn()
const useIsMobile = vi.fn(() => false)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobile(),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))
vi.mock("@/features/guild-access", () => ({
  GuildAccessBoundary: ({
    children,
  }: {
    children: (guild: { name: string }) => React.ReactNode
  }) => children({ name: "My Guild" }),
}))

import { GuildRaidsPage } from "./guild-raids-page"

describe("GuildRaidsPage", () => {
  beforeEach(() => {
    register.mockClear()
    useIsMobile.mockReturnValue(false)
  })

  it.each([
    ["desktop", false, "guild-raids-desktop-shell"],
    ["mobile", true, "guild-raids-mobile-shell"],
  ] as const)(
    "renders a valid %s tutorial target set",
    (_name, mobile, shell) => {
      useIsMobile.mockReturnValue(mobile)
      render(<GuildRaidsPage />)

      const steps = register.mock.lastCall?.[0] as {
        desktop: { target: string }[]
        mobile: { target: string }[]
      }
      const selected = mobile ? steps.mobile : steps.desktop

      expect(screen.getByTestId(shell)).toBeInTheDocument()
      expect(screen.getByTestId("guild-raids-ready")).toBeInTheDocument()
      for (const step of selected) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    }
  )

  it("uses page-owned neutral ready content without Guild management controls", () => {
    render(<GuildRaidsPage />)

    expect(screen.getByTestId("guild-raids-ready")).toHaveTextContent(
      "guildRaids.readyTitle"
    )
    expect(screen.queryByTestId("guild-summary")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-sync-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-purge-open")).not.toBeInTheDocument()
  })
})
