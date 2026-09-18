import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { V1ImportPanel } from "@/features/v1-import"

// Every part starts unchecked here (unlike the setup flow's `SetupV1Import`, which preselects
// everything): the account is already provisioned, so a rerun should only touch what the user
// deliberately asks for again.
const NOTHING_SELECTED = {
  personalTacticusApiKey: false,
  tacticusUserId: false,
  guildApiToken: false,
  goals: false,
  onslaughtProgress: false,
  campaignEventProgress: false,
}

/**
 * The standalone V1-import route, reached from the account menu once an account already exists.
 * Rendered inside the normal app shell (unlike `SetupV1Import`, which shares the same
 * `V1ImportPanel` but renders outside it as part of initial provisioning).
 */
export function V1ImportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4"
      data-testid="v1-import-page"
    >
      <div className="flex items-center gap-3">
        <Button
          aria-label={t("goals.v1Import.back")}
          onClick={() => void navigate("/home")}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-medium">
            {t("goals.v1Import.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("goals.v1Import.description")}
          </p>
        </div>
      </div>
      <V1ImportPanel defaultSelection={NOTHING_SELECTED} />
    </div>
  )
}
