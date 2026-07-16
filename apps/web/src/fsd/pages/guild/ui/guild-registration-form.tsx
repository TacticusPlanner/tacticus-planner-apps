import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { useMsal } from "@azure/msal-react"

import { registerGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

type Props = {
  onRegistered: () => void
}

/**
 * Shown when the caller has a configured Tacticus User ID but no linked registered guild. The token field
 * is password-style and is cleared immediately on success — it is never cached or persisted client-side.
 */
export function GuildRegistrationForm({ onRegistered }: Props) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const registration = useMutation({ mutationFn: registerGuild })

  if (!account) {
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmed = token.trim()
    if (!trimmed) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await registration.mutateAsync({ guildApiToken: trimmed })
      setToken("")
      onRegistered()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("guild.unregistered.genericError")
      )
    }
  }

  return (
    <Card data-testid="guild-unregistered">
      <CardHeader>
        <CardTitle>{t("guild.unregistered.title")}</CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <p>{t("guild.unregistered.description")}</p>
          <p>{t("guild.unregistered.leaderPrompt")}</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          data-testid="guild-registration-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Field data-invalid={status === "error"}>
            <FieldLabel htmlFor="guild-api-token">
              {t("guild.unregistered.tokenLabel")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="guild-api-token"
                data-testid="guild-api-token-input"
                autoComplete="off"
                placeholder={t("guild.unregistered.tokenPlaceholder")}
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </FieldContent>
          </Field>

          {status === "error" && errorMessage ? (
            <FieldError data-testid="guild-registration-error">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button
            data-testid="guild-register-submit"
            disabled={status === "submitting" || !token.trim()}
            type="submit"
          >
            {status === "submitting" ? <Spinner /> : null}
            {status === "submitting"
              ? t("guild.unregistered.registering")
              : t("guild.unregistered.register")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
