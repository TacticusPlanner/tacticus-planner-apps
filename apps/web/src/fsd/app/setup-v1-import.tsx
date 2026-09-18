import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { V1ImportPanel, type V1ImportSelection } from "@/features/v1-import"
import type { ImportV1ProfileResult } from "@/entities/account"

const ALL_SELECTED: V1ImportSelection = {
  personalTacticusApiKey: true,
  tacticusUserId: true,
  guildApiToken: true,
  goals: true,
  onslaughtProgress: true,
  campaignEventProgress: true,
}

/**
 * Composes `V1ImportPanel` (features/v1-import) into the account-setup "import" step
 * (features/account-onboarding, via its `renderImportStep` prop) — the `app` layer is where the two
 * features are allowed to meet (see account-setup-screen.tsx's `renderImportStep` doc comment).
 *
 * Deliberately does NOT call `onCompleted` as soon as the panel succeeds, unlike `ApiKeyForm`. That
 * convention works there because there is exactly one outcome to report. This import has six parts
 * and a goal-by-goal report, so once the key part is confirmed imported, a "Continue" button appears
 * alongside the report already rendered by the panel, and only that click hands control back to the
 * guard (`onCompleted`, which itself triggers the current-user refetch — see
 * `account-setup-screen.tsx`'s `handleCompleted`).
 *
 * Passes `refreshCurrentUserOnSuccess={false}` to the panel for the same reason: the panel's own
 * default behavior refetches the current-user query immediately on success, and
 * `AccountSetupRoute`'s reverse guard reads that same shared query — an immediate refetch would
 * trigger its redirect the instant the personal key succeeds, unmounting this screen (report and
 * Continue button included) before the user ever saw either.
 */
export function SetupV1Import({
  onCompleted,
  onUseApiKey,
}: {
  onCompleted: () => void
  onUseApiKey: () => void
}) {
  const { t } = useTranslation()
  const [keyImported, setKeyImported] = useState(false)

  const handleSuccess = (result: ImportV1ProfileResult) => {
    setKeyImported(result.personalTacticusApiKey.status === "Imported")
  }

  return (
    <div className="flex flex-col gap-4">
      <V1ImportPanel
        defaultSelection={ALL_SELECTED}
        onSuccess={handleSuccess}
        refreshCurrentUserOnSuccess={false}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          data-testid="account-setup-v1-use-api-key"
          onClick={onUseApiKey}
          size="sm"
          type="button"
          variant="outline"
        >
          {t("onboarding.import.useApiKey")}
        </Button>
        {keyImported ? (
          <Button
            data-testid="account-setup-v1-continue"
            onClick={onCompleted}
            size="sm"
            type="button"
          >
            {t("onboarding.import.continue")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
