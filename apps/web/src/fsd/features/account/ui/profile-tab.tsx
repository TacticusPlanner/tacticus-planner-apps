import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  DISPLAY_NAME_MAX_LENGTH,
  useUpdateDisplayName,
  validateDisplayName,
  type CurrentUser,
} from "@/entities/account"

/**
 * Edits the confirmed public planner name only — sign-in identity and email are untouched. The
 * shown name stays the saved server value until a save succeeds, and a failed save keeps the draft.
 */
export function ProfileTab({ user }: { user: CurrentUser }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle")
  const updateDisplayName = useUpdateDisplayName()

  const value = draft ?? user.displayName ?? ""
  const problem = value ? validateDisplayName(value) : null
  const canSubmit = !updateDisplayName.isPending && !validateDisplayName(value)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setStatus("idle")

    try {
      await updateDisplayName.mutateAsync(value.trim())
      setDraft(null)
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <form
      className="flex flex-col gap-4 pt-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field data-invalid={problem !== null || status === "error"}>
        <FieldLabel htmlFor="manage-account-display-name">
          {t("manageAccount.profile.displayNameLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            autoComplete="nickname"
            data-testid="manage-account-display-name-input"
            // Locked while saving so an edit typed mid-request is not discarded on success.
            disabled={updateDisplayName.isPending}
            id="manage-account-display-name"
            onChange={(event) => {
              setDraft(event.target.value)
              setStatus("idle")
            }}
            value={value}
          />
          <FieldDescription>
            {t("manageAccount.profile.displayNameDescription", {
              max: DISPLAY_NAME_MAX_LENGTH,
            })}
          </FieldDescription>
        </FieldContent>
      </Field>

      {problem ? (
        <FieldError data-testid="manage-account-display-name-problem">
          {t(`manageAccount.profile.problems.${problem}`, {
            max: DISPLAY_NAME_MAX_LENGTH,
          })}
        </FieldError>
      ) : null}
      {status === "error" ? (
        <FieldError data-testid="manage-account-display-name-error">
          {t("manageAccount.profile.saveFailed")}
        </FieldError>
      ) : null}
      {status === "success" ? (
        <p
          className="text-sm text-primary"
          data-testid="manage-account-display-name-success"
        >
          {t("manageAccount.profile.saved")}
        </p>
      ) : null}

      <Button
        data-testid="manage-account-display-name-submit"
        disabled={!canSubmit || value.trim() === user.displayName}
        type="submit"
      >
        {updateDisplayName.isPending ? <Spinner /> : null}
        {t("manageAccount.profile.save")}
      </Button>
    </form>
  )
}
