import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import { useCurrentUser } from "@/entities/account"

import { ApiKeyForm } from "./api-key-form"
import { DisplayNameForm } from "./display-name-form"

export type AccountSetupStep = "choose" | "key" | "import" | "name"

type ScreenProps = {
  /**
   * Which step to show. Owned by the route (see `app/routes.tsx`), not by this component — passing
   * it in keeps the presentation testable without a router and keeps the browser Back control
   * working between steps.
   */
  step: AccountSetupStep
  onStepChange: (step: AccountSetupStep) => void
  /**
   * Prefill for the name step from the V1 import (which the API does not store). Falls back to the
   * account's own `/me` suggestion; a draft the user already typed always wins over both.
   */
  suggestedDisplayName?: string
  /**
   * Renders the "import" step's content. This feature does not import `features/v1-import` itself
   * (that would be a feature-to-feature cross-import — see
   * `.claude/skills/feature-sliced-design/references/cross-import-patterns.md`, Strategy C); the
   * `app` layer, which already composes both features, supplies this instead.
   *
   * The second argument lets that content report "the account is provisioned now" before the whole
   * screen finishes (`onCompleted`) — see `Steps`'s `keyImported` state for why Back needs to know
   * this earlier.
   */
  renderImportStep: (
    onCompleted: () => void,
    onKeyImported: () => void
  ) => ReactNode
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
export function AccountSetupScreen({
  step,
  onStepChange,
  renderImportStep,
  suggestedDisplayName,
}: ScreenProps) {
  const { t } = useTranslation()
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
        <p
          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          data-testid="account-setup-step-position"
        >
          {t("onboarding.stepPosition", {
            current: step === "choose" ? 1 : step === "name" ? 3 : 2,
            total: 3,
          })}
        </p>
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
      ) : (
        <Steps
          onCompleted={handleCompleted}
          onStepChange={onStepChange}
          renderImportStep={renderImportStep}
          step={step}
          suggestedDisplayName={
            suggestedDisplayName ??
            (state.status === "success"
              ? (state.user.suggestedDisplayName ?? undefined)
              : undefined)
          }
        />
      )}
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

// Both breakpoints go through the same choose-then-step flow: showing both paths on screen at once
// (as desktop once did) does not fit the V1-import path anymore now that it is the same full,
// multi-part panel used from the account menu, not a two-field shortcut.
function Steps({
  step,
  onStepChange,
  onCompleted,
  renderImportStep,
  suggestedDisplayName,
}: ScreenProps & { onCompleted: () => void }) {
  const { t } = useTranslation()
  // Sticky, and only ever set by the import step (the key step's own success unmounts this whole
  // component via `submitted` instead — see AccountSetupScreen). Once true, the account already has
  // a key, so a Back control offering to abandon setup no longer makes sense.
  const [keyImported, setKeyImported] = useState(false)

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
          badge={t("onboarding.paths.v1Badge")}
          description={t("onboarding.paths.v1Description")}
          name={t("onboarding.paths.v1Name")}
          onSelect={() => onStepChange("import")}
          testId="account-setup-choose-import"
        />
      </div>
    )
  }

  if (step === "name") {
    return (
      <Card>
        <CardContent>
          <DisplayNameForm
            onCompleted={onCompleted}
            suggestion={suggestedDisplayName}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          {step === "key" ? (
            <ApiKeyForm onCompleted={onCompleted} />
          ) : (
            renderImportStep(onCompleted, () => setKeyImported(true))
          )}
        </CardContent>
      </Card>

      {keyImported ? null : (
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
    <Card className="p-0">
      <button
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-accent/50"
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
    </Card>
  )
}
