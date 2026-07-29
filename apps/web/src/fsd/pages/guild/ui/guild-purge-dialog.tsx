import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { purgeGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

const PURGE_CONFIRMATION_WORD = "Confirm"

type Props = {
  /** @deprecated Authentication is resolved by the shared API client. */
  account?: AccountInfo
  /** @deprecated Authentication is resolved by the shared API client. */
  instance?: IPublicClientApplication
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurged: () => void
}

/**
 * Confirmation dialog for deleting Planner's registration of the caller's guild (Leader/Co-Leader only —
 * gated at the call site by `guild.canSynchronize`). Mirrors ManageAccountDialog's account-purge tab: a
 * destructive warning plus a literal type-to-confirm word, since this only removes Planner's copy of the
 * guild and never touches Tacticus itself.
 */
export function GuildPurgeDialog({ open, onOpenChange, onPurged }: Props) {
  const { t } = useTranslation()
  const [confirmation, setConfirmation] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const purge = useMutation({ mutationFn: purgeGuild })

  const canPurge = confirmation === PURGE_CONFIRMATION_WORD

  const handlePurge = async () => {
    if (!canPurge) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await purge.mutateAsync()
      setConfirmation("")
      setStatus("idle")
      onOpenChange(false)
      onPurged()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("guild.purge.genericError")
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (status !== "submitting") {
          onOpenChange(next)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg" data-testid="guild-purge-dialog">
        <DialogHeader>
          <DialogTitle>{t("guild.purge.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div
            className="flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">
              {t("guild.purge.warningTitle")}
            </p>
            <p className="text-muted-foreground">
              {t("guild.purge.warningDescription")}
            </p>
          </div>

          <Field data-invalid={status === "error"}>
            <FieldLabel htmlFor="guild-purge-confirmation">
              {t("guild.purge.confirmLabel", { word: PURGE_CONFIRMATION_WORD })}
            </FieldLabel>
            <FieldContent>
              <Input
                id="guild-purge-confirmation"
                data-testid="guild-purge-confirmation-input"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </FieldContent>
          </Field>

          {status === "error" && errorMessage ? (
            <FieldError data-testid="guild-purge-error">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button
            data-testid="guild-purge-submit"
            disabled={!canPurge || status === "submitting"}
            variant="destructive"
            onClick={() => void handlePurge()}
          >
            {status === "submitting" ? <Spinner /> : null}
            {t("guild.purge.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
