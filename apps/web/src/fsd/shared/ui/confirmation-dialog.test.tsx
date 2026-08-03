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
})
