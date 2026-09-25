import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import type {
  ImportPartResult,
  ImportV1ProfileResult,
} from "@/entities/account"
import type { V1ImportSelection } from "@/features/v1-import"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

// `V1ImportPanel`'s own mutation/report/query-invalidation behavior is covered by
// `features/v1-import/ui/v1-import-panel.test.tsx`. This file only tests what `SetupV1Import` adds
// on top: locking the key part, gating the "Continue" affordance and the Back-hiding signal on the
// personal-key outcome, and the "use an API key instead" escape hatch — so the panel is stubbed at
// its public API, per the FSD skill's guidance on testing across a slice boundary. The stub renders
// `actions` (unlike the real panel's submit row, position doesn't matter for these tests) so the
// action buttons SetupV1Import passes through it are reachable.
const {
  onSuccessRef,
  lastDefaultSelection,
  lastLockedParts,
  lastRefreshCurrentUserOnSuccess,
} = vi.hoisted(() => ({
  onSuccessRef: {
    current: undefined as ((result: ImportV1ProfileResult) => void) | undefined,
  },
  lastDefaultSelection: { current: undefined as V1ImportSelection | undefined },
  lastLockedParts: {
    current: undefined as ReadonlyArray<keyof V1ImportSelection> | undefined,
  },
  lastRefreshCurrentUserOnSuccess: {
    current: undefined as boolean | undefined,
  },
}))

vi.mock("@/features/v1-import", () => ({
  V1ImportPanel: ({
    defaultSelection,
    lockedParts,
    onSuccess,
    refreshCurrentUserOnSuccess,
    actions,
  }: {
    defaultSelection: V1ImportSelection
    lockedParts?: ReadonlyArray<keyof V1ImportSelection>
    onSuccess?: (result: ImportV1ProfileResult) => void
    refreshCurrentUserOnSuccess?: boolean
    actions?: ReactNode
  }) => {
    lastDefaultSelection.current = defaultSelection
    lastLockedParts.current = lockedParts
    lastRefreshCurrentUserOnSuccess.current = refreshCurrentUserOnSuccess
    onSuccessRef.current = onSuccess
    return <div data-testid="stub-v1-import-panel">{actions}</div>
  },
}))

import { SetupV1Import } from "./setup-v1-import"

const okPart: ImportPartResult = {
  status: "Imported",
  code: null,
  message: null,
}
const failedPart: ImportPartResult = {
  status: "Failed",
  code: "invalid_credentials",
  message: "Wrong username or password.",
}

function fullResult(
  personalTacticusApiKey: ImportPartResult
): ImportV1ProfileResult {
  return {
    tacticusUserId: okPart,
    personalTacticusApiKey,
    guildApiToken: okPart,
    onslaughtProgress: okPart,
    campaignEventProgress: okPart,
    goals: okPart,
    outcomes: [],
  }
}

function renderSetup() {
  const onCompleted = vi.fn()
  const onUseApiKey = vi.fn()
  const onKeyImported = vi.fn()
  const result = render(
    <SetupV1Import
      onCompleted={onCompleted}
      onKeyImported={onKeyImported}
      onSuggestedDisplayName={vi.fn()}
      onUseApiKey={onUseApiKey}
    />
  )
  return { ...result, onCompleted, onKeyImported, onUseApiKey }
}

describe("SetupV1Import", () => {
  it("preselects every import part", () => {
    renderSetup()

    expect(lastDefaultSelection.current).toEqual({
      personalTacticusApiKey: true,
      tacticusUserId: true,
      guildApiToken: true,
      goals: true,
      onslaughtProgress: true,
      campaignEventProgress: true,
    })
  })

  it("locks the personal API key part so it cannot be unchecked", () => {
    renderSetup()

    expect(lastLockedParts.current).toEqual(["personalTacticusApiKey"])
  })

  it("does not let the panel refetch current-user itself, so the reverse guard cannot preempt the report", () => {
    renderSetup()

    expect(lastRefreshCurrentUserOnSuccess.current).toBe(false)
  })

  it("does not offer Continue before a submission succeeds", () => {
    renderSetup()

    expect(
      screen.queryByTestId("account-setup-v1-continue")
    ).not.toBeInTheDocument()
  })

  it("does not offer Continue, and does not call onKeyImported, when the key part did not import", () => {
    const { onKeyImported } = renderSetup()

    onSuccessRef.current?.(fullResult(failedPart))

    expect(
      screen.queryByTestId("account-setup-v1-continue")
    ).not.toBeInTheDocument()
    expect(onKeyImported).not.toHaveBeenCalled()
  })

  it("offers Continue and calls onKeyImported once the key part is confirmed imported", async () => {
    const { onKeyImported } = renderSetup()

    onSuccessRef.current?.(fullResult(okPart))

    expect(await screen.findByTestId("account-setup-v1-continue")).toBeVisible()
    expect(onKeyImported).toHaveBeenCalledTimes(1)
  })

  it("hides the Use API key fallback once the key part is confirmed imported", async () => {
    renderSetup()

    onSuccessRef.current?.(fullResult(okPart))
    await screen.findByTestId("account-setup-v1-continue")

    // The reverse guard is only suppressed while Continue is pending (account-setup-route.tsx); once
    // an account is configured, this fallback would race that guard's redirect instead of taking the
    // user anywhere useful.
    expect(
      screen.queryByTestId("account-setup-v1-use-api-key")
    ).not.toBeInTheDocument()
  })

  it("clicking Continue calls onCompleted", async () => {
    const user = userEvent.setup()
    const { onCompleted } = renderSetup()

    onSuccessRef.current?.(fullResult(okPart))
    await user.click(await screen.findByTestId("account-setup-v1-continue"))

    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  it("stays offering Continue even if a later rerun's key import fails", async () => {
    renderSetup()

    onSuccessRef.current?.(fullResult(okPart))
    await screen.findByTestId("account-setup-v1-continue")
    onSuccessRef.current?.(fullResult(failedPart))

    expect(screen.getByTestId("account-setup-v1-continue")).toBeVisible()
  })

  it("calls onUseApiKey from its own button", async () => {
    const user = userEvent.setup()
    const { onUseApiKey } = renderSetup()

    await user.click(screen.getByTestId("account-setup-v1-use-api-key"))

    expect(onUseApiKey).toHaveBeenCalledTimes(1)
  })
})
