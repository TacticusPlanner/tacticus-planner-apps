import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMsal } from "@azure/msal-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useCurrentUser } from "@/entities/account"
import { signOut, useActiveAccountId } from "@/shared/auth"

import { ApiKeyForm } from "./api-key-form"
import { V1ImportForm } from "./v1-import-form"

export type AccountSetupStep = "choose" | "key" | "import"

type ScreenProps = {
  /**
   * Which step to show. Owned by the route (see `app/routes.tsx`), not by this component — passing
   * it in keeps the presentation testable without a router and keeps the browser Back control
   * working between steps.
   */
  step: AccountSetupStep
  onStepChange: (step: AccountSetupStep) => void
}

/**
 * First-run screen that connects a signed-in account to Tacticus. Rendered as ordinary page content
 * on its own minimal chrome (`app/layout/account-setup-layout.tsx`), deliberately neither a modal
 * nor part of the main app shell: the document's own scrolling makes every control reachable on a
 * phone, and none of the shell's affordances — which all lead somewhere this user cannot go yet —
 * are present to distract from the one thing this screen asks for.
 *
 * Completing a form does NOT navigate here. `useCurrentUser`'s refetch is fire-and-forget and
 * react-query keeps reporting the previous (stale) `hasCompletedOnboarding: false` while it runs, so
 * navigating on submit would land on a protected route whose gate bounces straight back here with an
 * emptied form. Instead the forms refresh the account state and the route's own guard performs the
 * navigation once that state actually confirms a configured key.
 */
export function AccountSetupScreen({ step, onStepChange }: ScreenProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { state, refetch } = useCurrentUser()
  // Set once a submission has succeeded, so the screen can tell "still waiting for confirmation"
  // apart from "idle" — the difference between showing progress and showing a retry.
  const [submitted, setSubmitted] = useState(false)

  const handleCompleted = () => {
    setSubmitted(true)
    refetch()
  }

  // The guard cannot navigate on an error state (that is what keeps it from ping-ponging with the
  // onboarding gate), so a refetch failure after a successful save would otherwise spin forever.
  const confirmationFailed = submitted && state.status === "error"

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1.5">
        {isMobile ? (
          <p
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            data-testid="account-setup-step-position"
          >
            {t("onboarding.stepPosition", {
              current: step === "choose" ? 1 : 2,
              total: 2,
            })}
          </p>
        ) : null}
        <h1 className="font-heading text-xl font-medium">
          {t("onboarding.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboarding.description")}
        </p>
      </header>

      {confirmationFailed ? (
        <ConfirmationRetry onRetry={refetch} />
      ) : submitted ? (
        <p
          className="flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="account-setup-confirming"
        >
          <Spinner className="size-4" />
          {t("onboarding.confirming")}
        </p>
      ) : null}

      {isMobile ? (
        <MobileSteps
          onCompleted={handleCompleted}
          onStepChange={onStepChange}
          step={step}
        />
      ) : (
        <DesktopPanels onCompleted={handleCompleted} />
      )}

      <SignOutFooter />
    </div>
  )
}

function ConfirmationRetry({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      className="flex flex-col items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"
      data-testid="account-setup-confirm-failed"
      role="alert"
    >
      <p>{t("onboarding.confirmFailed")}</p>
      <Button
        data-testid="account-setup-confirm-retry"
        onClick={onRetry}
        size="sm"
        variant="outline"
      >
        {t("onboarding.confirmRetry")}
      </Button>
    </div>
  )
}

// Desktop has no steps: both paths are on screen at once, so the user can see that completing
// either panel alone is enough.
function DesktopPanels({ onCompleted }: { onCompleted: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      data-testid="account-setup-panels"
    >
      <section className="flex flex-col gap-4 rounded-xl border p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {t("onboarding.paths.apiKeyName")}
          </h2>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-accent-foreground uppercase">
            {t("onboarding.paths.apiKeyBadge")}
          </span>
        </div>
        <ApiKeyForm onCompleted={onCompleted} />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">
          {t("onboarding.paths.v1Name")}
        </h2>
        <V1ImportForm onCompleted={onCompleted} />
      </section>
    </div>
  )
}

function MobileSteps({
  step,
  onStepChange,
  onCompleted,
}: ScreenProps & { onCompleted: () => void }) {
  const { t } = useTranslation()

  if (step === "choose") {
    return (
      <div className="flex flex-col gap-3" data-testid="account-setup-choice">
        <PathCard
          badge={t("onboarding.paths.apiKeyBadge")}
          description={t("onboarding.paths.apiKeyDescription")}
          name={t("onboarding.paths.apiKeyName")}
          onSelect={() => onStepChange("key")}
          testId="account-setup-choose-key"
        />
        <PathCard
          description={t("onboarding.paths.v1Description")}
          name={t("onboarding.paths.v1Name")}
          onSelect={() => onStepChange("import")}
          testId="account-setup-choose-import"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        className="self-start"
        data-testid="account-setup-back"
        onClick={() => onStepChange("choose")}
        size="sm"
        variant="ghost"
      >
        <ChevronLeft />
        {t("onboarding.back")}
      </Button>

      {step === "key" ? (
        <ApiKeyForm onCompleted={onCompleted} />
      ) : (
        <V1ImportForm
          onCompleted={onCompleted}
          onUseApiKey={() => onStepChange("key")}
        />
      )}
    </div>
  )
}

function PathCard({
  name,
  description,
  badge,
  onSelect,
  testId,
}: {
  name: string
  description: string
  badge?: string
  onSelect: () => void
  testId: string
}) {
  return (
    <button
      className="flex items-start gap-3 rounded-xl border p-4 text-left hover:bg-accent/50"
      data-testid={testId}
      onClick={onSelect}
      type="button"
    >
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">{name}</span>
          {badge ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-accent-foreground uppercase">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// Present on every step and on both layouts: a user who wants neither path must not be trapped on a
// screen that replaces the whole app. Mirrors the pattern in `app/game-catalog-init-gate.tsx`.
function SignOutFooter() {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const accountId = useActiveAccountId()

  return (
    <footer className="flex justify-center border-t pt-4">
      <Button
        data-testid="account-setup-sign-out"
        disabled={!accountId}
        onClick={() => {
          if (accountId) {
            void signOut(instance, accountId).catch((error: unknown) => {
              console.error("[MSAL] sign-out failed", error)
            })
          }
        }}
        size="sm"
        variant="ghost"
      >
        {t("auth.signOut")}
      </Button>
    </footer>
  )
}
