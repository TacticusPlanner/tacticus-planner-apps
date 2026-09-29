import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  factionIdSchema,
  unitIdSchema,
  type FactionGroup,
} from "@workspace/game-domain"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "./responsive-dialog"
import { UnitCombobox } from "./unit-combobox"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

const groups: FactionGroup[] = [
  {
    factionId: factionIdSchema.parse("Ultramarines"),
    factionName: "Ultramarines",
    members: [{ id: unitIdSchema.parse("cato"), name: "Cato Sicarius" }],
  },
]

function renderDialog(props: { onOpenChange?: (open: boolean) => void } = {}) {
  return render(
    <ResponsiveDialog
      open
      onOpenChange={props.onOpenChange ?? vi.fn()}
      preventOutsideClose
      data-testid="shell"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Title</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <UnitCombobox
          groups={groups}
          value={undefined}
          onChange={vi.fn()}
          placeholder="Pick unit"
          emptyText="None"
          icon={() => undefined}
        />
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>footer</ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}

describe("ResponsiveDialog", () => {
  beforeEach(() => {
    mobile.value = false
  })

  it("renders a centered dialog at or above 768px", () => {
    renderDialog()

    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-slot",
      "dialog-content"
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("footer")).toBeInTheDocument()
  })

  it("renders the bottom sheet below 768px", () => {
    mobile.value = true
    renderDialog()

    expect(screen.getByTestId("shell")).toHaveAttribute(
      "data-slot",
      "sheet-content"
    )
    expect(screen.getByTestId("shell")).toHaveAttribute("data-side", "bottom")
  })

  it.each([false, true])(
    "portals a combobox list inside the shell content (mobile=%s)",
    (isMobile) => {
      mobile.value = isMobile
      renderDialog()

      fireEvent.click(screen.getByRole("combobox"))

      expect(screen.getByTestId("shell")).toContainElement(
        screen.getByText("Cato Sicarius")
      )
    }
  )

  it("does not close on an outside pointer down but closes on Escape", () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange })

    fireEvent.pointerDown(document.body)
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.keyDown(screen.getByTestId("shell"), { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
