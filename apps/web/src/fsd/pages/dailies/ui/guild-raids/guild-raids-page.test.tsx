import { render, screen } from "@/test/render"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { GuildRaidsViewModel } from "./guild-raid-status-view-model"

const register = vi.fn()
const useIsMobile = vi.fn(() => false)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
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

const loadingViewModel: GuildRaidsViewModel = {
  status: { kind: "loading" },
  resources: { kind: "unavailable" },
  refresh: vi.fn(),
  isRefreshing: false,
  hasRefreshError: false,
}
let viewModel: GuildRaidsViewModel = loadingViewModel
vi.mock("./use-guild-raids-view-model", () => ({
  useGuildRaidsViewModel: () => viewModel,
}))

import { GuildRaidsPage } from "./guild-raids-page"

const NOW = Date.now()

function activeViewModel(): GuildRaidsViewModel {
  return {
    status: {
      kind: "active",
      freshness: "fresh",
      observedAtMs: NOW,
      lastGuildSyncSucceededAtMs: NOW,
      catalogWarning: false,
      season: {
        seasonNumber: 1,
        tierNumber: 1,
        setNumber: 1,
        setCount: 1,
        difficulty: "Common",
        endsAt: { kind: "unavailable" },
        boss: {
          unitSetId: "boss",
          name: "Boss",
          portraitSrc: undefined,
          remainingHp: 1,
          maximumHp: 1,
          isUpcoming: false,
        },
        primes: [],
      },
    },
    resources: { kind: "unavailable" },
    refresh: vi.fn(),
    isRefreshing: false,
    hasRefreshError: false,
  }
}

describe("GuildRaidsPage", () => {
  beforeEach(() => {
    register.mockClear()
    useIsMobile.mockReturnValue(false)
    viewModel = loadingViewModel
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
      for (const step of selected) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    }
  )

  it("renders the status section and the resources card once guild access is ready", () => {
    render(<GuildRaidsPage />)

    expect(screen.getByTestId("guild-raid-status-section")).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-resources-card")).toBeInTheDocument()
    expect(screen.queryByTestId("guild-summary")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-sync-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-purge-open")).not.toBeInTheDocument()
  })

  it("places the freshness footer and resources card before the status section", () => {
    viewModel = activeViewModel()
    render(<GuildRaidsPage />)

    const observedAt = screen.getByTestId("guild-raid-observed-at")
    const resources = screen.getByTestId("guild-raid-resources-card")
    const statusSection = screen.getByTestId("guild-raid-status-section")

    expect(
      observedAt.compareDocumentPosition(resources) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      resources.compareDocumentPosition(statusSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("does not render the freshness footer while there is no observation yet", () => {
    viewModel = loadingViewModel
    render(<GuildRaidsPage />)

    expect(
      screen.queryByTestId("guild-raid-observed-at")
    ).not.toBeInTheDocument()
  })
})
