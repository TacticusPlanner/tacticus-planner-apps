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
} from "@/entities/account"

/**
 * Confirms the public planner name. A suggestion (provider name or V1 username) only prefills the
 * field: nothing is confirmed until the user submits, and a draft they already typed is never
 * overwritten by a suggestion that arrives later. A failed save keeps the draft and can be retried.
 *
 * `onCompleted` only reports success; the route guard performs the navigation once `/me` confirms.
 */
export function DisplayNameForm({
  onCompleted,
  suggestion,
}: {
  onCompleted: () => void
  suggestion?: string
}) {
  const { t } = useTranslation()
  // null = untouched, so the field follows the suggestion until the user types.
  const [draft, setDraft] = useState<string | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const updateDisplayName = useUpdateDisplayName()

  const value = draft ?? suggestion ?? ""
  const problem = value ? validateDisplayName(value) : null
  const canSubmit = !updateDisplayName.isPending && !validateDisplayName(value)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setSaveFailed(false)

    try {
      await updateDisplayName.mutateAsync(value.trim())
      onCompleted()
    } catch {
      setSaveFailed(true)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="account-setup-name-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field data-invalid={problem !== null || saveFailed}>
        <FieldLabel htmlFor="account-setup-display-name">
          {t("onboarding.name.label")}
        </FieldLabel>
        <FieldContent>
          <Input
            autoComplete="nickname"
            data-testid="account-setup-name-input"
            id="account-setup-display-name"
            onChange={(event) => setDraft(event.target.value)}
            value={value}
          />
          <FieldDescription>
            {t("onboarding.name.description", {
              max: DISPLAY_NAME_MAX_LENGTH,
            })}
          </FieldDescription>
        </FieldContent>
      </Field>

      {problem ? (
        <FieldError data-testid="account-setup-name-problem">
          {t(`onboarding.name.problems.${problem}`, {
            max: DISPLAY_NAME_MAX_LENGTH,
          })}
        </FieldError>
      ) : null}
      {saveFailed ? (
        <FieldError data-testid="account-setup-name-error">
          {t("onboarding.name.saveFailed")}
        </FieldError>
      ) : null}

      <Button
        data-testid="account-setup-name-submit"
        disabled={!canSubmit}
        type="submit"
      >
        {updateDisplayName.isPending ? <Spinner /> : null}
        {t("onboarding.name.submit")}
      </Button>
    </form>
  )
}
