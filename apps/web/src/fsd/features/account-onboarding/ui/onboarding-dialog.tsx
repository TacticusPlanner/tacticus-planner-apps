import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { useMsal } from "@azure/msal-react"

import {
  importV1Profile,
  updateTacticusIntegration,
  useCurrentUser,
} from "@/entities/account"
import { ApiError } from "@/shared/api"

type FormStatus = "idle" | "submitting" | "error"

type FormProps = { onCompleted: () => void }

/**
 * Blocking onboarding dialog: shown by `OnboardingGate` whenever the signed-in user has no Tacticus API key
 * configured yet. It cannot be dismissed without completing one of the two options below — no close button,
 * and both escape and outside-click are suppressed.
 */
export function OnboardingDialog() {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]

  if (!account) {
    return null
  }

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-lg"
        data-testid="onboarding-dialog"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("onboarding.title")}</DialogTitle>
          <DialogDescription>{t("onboarding.description")}</DialogDescription>
        </DialogHeader>
        <OnboardingOptions />
      </DialogContent>
    </Dialog>
  )
}

// Two clearly separate, independent paths — not tabs — so it's obvious the user only needs to complete one
// of them, not navigate between them. Each has its own heading and its own submit button.
function OnboardingOptions() {
  const { t } = useTranslation()
  const { refetch } = useCurrentUser()
  // Refetching the current user after either path succeeds flips hasCompletedOnboarding, and the gate
  // (which is the only thing that renders this dialog) unmounts it on its own — there's no local
  // "completed" state to render here.
  const onCompleted = refetch

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col gap-3"
        data-testid="onboarding-sign-up-section"
      >
        <h3 className="text-sm font-semibold">{t("onboarding.tabs.signUp")}</h3>
        <SignUpForm onCompleted={onCompleted} />
      </div>

      <FieldSeparator>{t("onboarding.or")}</FieldSeparator>

      <div
        className="flex flex-col gap-3"
        data-testid="onboarding-import-section"
      >
        <h3 className="text-sm font-semibold">
          {t("onboarding.tabs.importProfile")}
        </h3>
        <ImportProfileForm onCompleted={onCompleted} />
      </div>
    </div>
  )
}

function SignUpForm({ onCompleted }: FormProps) {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState("")
  const [userId, setUserId] = useState("")
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedApiKey = apiKey.trim()
    if (!trimmedApiKey) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await updateIntegration.mutateAsync({
        tacticusApiKey: trimmedApiKey,
        tacticusUserId: userId.trim() || undefined,
      })
      onCompleted()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError ? error.message : t("onboarding.genericError")
      )
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field data-invalid={status === "error"}>
        <FieldLabel htmlFor="onboarding-api-key">
          {t("onboarding.signUp.apiKeyLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="onboarding-api-key"
            data-testid="onboarding-api-key-input"
            autoComplete="off"
            required
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <FieldDescription>
            {t("onboarding.signUp.apiKeyDescription")}
          </FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="onboarding-user-id">
          {t("onboarding.signUp.userIdLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="onboarding-user-id"
            data-testid="onboarding-user-id-input"
            autoComplete="off"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
          <FieldDescription>
            {t("onboarding.signUp.userIdDescription")}
          </FieldDescription>
        </FieldContent>
      </Field>

      {status === "error" && errorMessage ? (
        <FieldError data-testid="onboarding-sign-up-error">
          {errorMessage}
        </FieldError>
      ) : null}

      <Button
        data-testid="onboarding-sign-up-submit"
        disabled={status === "submitting" || !apiKey.trim()}
        type="submit"
      >
        {status === "submitting" ? <Spinner /> : null}
        {t("onboarding.signUp.submit")}
      </Button>
    </form>
  )
}

function ImportProfileForm({ onCompleted }: FormProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const importProfile = useMutation({ mutationFn: importV1Profile })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await importProfile.mutateAsync({
        username: username.trim(),
        password,
        import: {
          personalTacticusApiKey: true,
          tacticusUserId: true,
          guildApiToken: false,
          goals: false,
        },
      })
      onCompleted()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError ? error.message : t("onboarding.genericError")
      )
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <FieldDescription>{t("onboarding.import.description")}</FieldDescription>

      <Field data-invalid={status === "error"}>
        <FieldLabel htmlFor="onboarding-v1-username">
          {t("onboarding.import.usernameLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="onboarding-v1-username"
            data-testid="onboarding-v1-username-input"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FieldContent>
      </Field>

      <Field data-invalid={status === "error"}>
        <FieldLabel htmlFor="onboarding-v1-password">
          {t("onboarding.import.passwordLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="onboarding-v1-password"
            data-testid="onboarding-v1-password-input"
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FieldContent>
      </Field>

      {status === "error" && errorMessage ? (
        <FieldError data-testid="onboarding-import-error">
          {errorMessage}
        </FieldError>
      ) : null}

      <Button
        data-testid="onboarding-import-submit"
        disabled={status === "submitting" || !username.trim() || !password}
        type="submit"
      >
        {status === "submitting" ? <Spinner /> : null}
        {t("onboarding.import.submit")}
      </Button>
    </form>
  )
}
