import userEvent from "@testing-library/user-event"
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
// on top: gating the "Continue" affordance on the personal-key outcome, and the "use an API key
// instead" escape hatch — so the panel is stubbed at its public API, per the FSD skill's guidance on
// testing across a slice boundary.
const { onSuccessRef, lastDefaultSelection, lastRefreshCurrentUserOnSuccess } =
  vi.hoisted(() => ({
    onSuccessRef: {
      current: undefined as
        ((result: ImportV1ProfileResult) => void) | undefined,
    },
    lastDefaultSelection: {
      current: undefined as V1ImportSelection | undefined,
    },
    lastRefreshCurrentUserOnSuccess: {
      current: undefined as boolean | undefined,
    },
  }))

vi.mock("@/features/v1-import", () => ({
  V1ImportPanel: ({
    defaultSelection,
    onSuccess,
    refreshCurrentUserOnSuccess,
  }: {
    defaultSelection: V1ImportSelection
    onSuccess?: (result: ImportV1ProfileResult) => void
    refreshCurrentUserOnSuccess?: boolean
  }) => {
    lastDefaultSelection.current = defaultSelection
    lastRefreshCurrentUserOnSuccess.current = refreshCurrentUserOnSuccess
    onSuccessRef.current = onSuccess
    return <div data-testid="stub-v1-import-panel" />
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

describe("SetupV1Import", () => {
  it("preselects every import part", () => {
    render(<SetupV1Import onCompleted={vi.fn()} onUseApiKey={vi.fn()} />)

    expect(lastDefaultSelection.current).toEqual({
      personalTacticusApiKey: true,
      tacticusUserId: true,
      guildApiToken: true,
      goals: true,
      onslaughtProgress: true,
      campaignEventProgress: true,
    })
  })

  it("does not let the panel refetch current-user itself, so the reverse guard cannot preempt the report", () => {
    render(<SetupV1Import onCompleted={vi.fn()} onUseApiKey={vi.fn()} />)

    expect(lastRefreshCurrentUserOnSuccess.current).toBe(false)
  })

  it("does not offer Continue before a submission succeeds", () => {
    render(<SetupV1Import onCompleted={vi.fn()} onUseApiKey={vi.fn()} />)

    expect(
      screen.queryByTestId("account-setup-v1-continue")
    ).not.toBeInTheDocument()
  })

  it("does not offer Continue when the key part did not import", () => {
    render(<SetupV1Import onCompleted={vi.fn()} onUseApiKey={vi.fn()} />)

    onSuccessRef.current?.(fullResult(failedPart))

    expect(
      screen.queryByTestId("account-setup-v1-continue")
    ).not.toBeInTheDocument()
  })

  it("offers Continue once the key part is confirmed imported, and calls onCompleted", async () => {
    const user = userEvent.setup()
    const onCompleted = vi.fn()
    render(<SetupV1Import onCompleted={onCompleted} onUseApiKey={vi.fn()} />)

    onSuccessRef.current?.(fullResult(okPart))

    const continueButton = await screen.findByTestId(
      "account-setup-v1-continue"
    )
    await user.click(continueButton)

    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  it("calls onUseApiKey from its own button", async () => {
    const user = userEvent.setup()
    const onUseApiKey = vi.fn()
    render(<SetupV1Import onCompleted={vi.fn()} onUseApiKey={onUseApiKey} />)

    await user.click(screen.getByTestId("account-setup-v1-use-api-key"))

    expect(onUseApiKey).toHaveBeenCalledTimes(1)
  })
})
