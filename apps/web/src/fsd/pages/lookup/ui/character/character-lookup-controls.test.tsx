import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import type { FactionGroup } from "@workspace/game-catalog"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

const shareCurrentLookupUrl = vi.fn()
vi.mock("./character-lookup-share", () => ({
  shareCurrentLookupUrl: (...args: unknown[]) => shareCurrentLookupUrl(...args),
}))

import { CharacterLookupControls } from "./character-lookup-controls"

function renderControls(props: Parameters<typeof CharacterLookupControls>[0]) {
  return render(
    <TooltipProvider>
      <CharacterLookupControls {...props} />
    </TooltipProvider>
  )
}

const characterGroups: FactionGroup[] = [
  {
    factionId: "Ultramarines",
    factionName: "Ultramarines",
    members: [{ id: "cato", name: "Cato Sicarius" }],
  },
]

function baseProps() {
  return {
    characterGroups,
    characterId: "cato",
    onCharacterChange: vi.fn(),
    rankStart: "Stone1" as const,
    rankEnd: "Iron1" as const,
    onRangeChange: vi.fn(),
    progressionStart: "Common:None" as const,
    progressionEnd: "Common:None" as const,
    onProgressionRangeChange: vi.fn(),
    pointFive: false,
    pointFiveDisabled: false,
    onPointFiveChange: vi.fn(),
    includeOwned: false,
    includeOwnedDisabled: false,
    onIncludeOwnedChange: vi.fn(),
    onApply: vi.fn(),
    applyDisabled: false,
    isMobile: false,
  }
}

describe("CharacterLookupControls", () => {
  beforeEach(() => {
    toastSuccess.mockClear()
    toastError.mockClear()
    shareCurrentLookupUrl.mockClear()
  })

  it("renders a rank slider on desktop and calls onApply when Apply is clicked", () => {
    const props = baseProps()
    renderControls(props)

    expect(screen.getAllByRole("slider")).toHaveLength(2)
    expect(screen.queryAllByRole("combobox")).toHaveLength(3) // character + 2 progression selects

    fireEvent.click(screen.getByTestId("lookup-apply-button"))
    expect(props.onApply).toHaveBeenCalledTimes(1)
  })

  it("renders rank selects instead of a slider on mobile", () => {
    renderControls({ ...baseProps(), isMobile: true })

    expect(screen.queryAllByRole("slider")).toHaveLength(0)
    // character combobox + 2 progression selects + 2 rank selects
    expect(screen.getAllByRole("combobox")).toHaveLength(5)
  })

  it("toggles the point-five and include-owned switches", () => {
    const props = baseProps()
    renderControls(props)

    fireEvent.click(screen.getAllByRole("switch")[0]!)
    expect(props.onPointFiveChange).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getAllByRole("switch")[1]!)
    expect(props.onIncludeOwnedChange).toHaveBeenCalledWith(true)
  })

  it("shows a success toast after sharing copies the URL", async () => {
    shareCurrentLookupUrl.mockResolvedValue("copied")
    renderControls(baseProps())

    fireEvent.click(screen.getByTestId("lookup-share-button"))

    await vi.waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith("unitLookup.share.copied")
    })
    expect(toastError).not.toHaveBeenCalled()
  })

  it("shows an error toast when sharing fails", async () => {
    shareCurrentLookupUrl.mockResolvedValue("error")
    renderControls(baseProps())

    fireEvent.click(screen.getByTestId("lookup-share-button"))

    await vi.waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("unitLookup.share.error")
    })
  })

  it("does not toast when the native share sheet already handled it", async () => {
    shareCurrentLookupUrl.mockResolvedValue("shared")
    renderControls(baseProps())

    fireEvent.click(screen.getByTestId("lookup-share-button"))

    await vi.waitFor(() => {
      expect(shareCurrentLookupUrl).toHaveBeenCalledWith(false)
    })
    expect(toastSuccess).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })
})
