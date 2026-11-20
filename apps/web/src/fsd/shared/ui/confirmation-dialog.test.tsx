import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ConfirmationDialog } from ".//confirmation-dialog"

describe("ConfirmationDialog", () => {
  it("uses caller content and invokes both callbacks", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmationDialog
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        confirmVariant="destructive"
        description="Your changes will be lost."
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Discard changes?"
      />
    )

    expect(screen.getByText("Your changes will be lost.")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Keep editing" }))
    expect(onCancel).toHaveBeenCalledOnce()
    await user.click(screen.getByRole("button", { name: "Discard" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("renders extra content and keeps confirm off while confirmDisabled", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmDisabled
        confirmLabel="Delete guild"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
        title="Delete this guild?"
      >
        <p>Type Confirm to continue.</p>
      </ConfirmationDialog>
    )

    expect(screen.getByText("Type Confirm to continue.")).toBeVisible()
    const confirm = screen.getByRole("button", { name: "Delete guild" })
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("turns both buttons off and ignores Escape while pending", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Delete project"
        onCancel={onCancel}
        onConfirm={vi.fn()}
        open
        pending
        title="Delete this project?"
      />
    )

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: /Delete project/ })
    ).toBeDisabled()
    await user.keyboard("{Escape}")
    expect(onCancel).not.toHaveBeenCalled()
  })
})
