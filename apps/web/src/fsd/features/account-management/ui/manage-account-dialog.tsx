import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"

import {
  purgeAccount,
  updateTacticusIntegration,
  useCurrentUser,
  type CurrentUser,
} from "@/entities/account"
import { ApiError } from "@/shared/api"
import { signOut } from "@/shared/auth"

const PURGE_CONFIRMATION_WORD = "Confirm"

type ManageAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "Manage Account" dialog reachable from the user menu: Tacticus Integration (view masked values, update the
 * key, update/remove the user id) and Account (purge — requires typing the literal word "Confirm").
 */
export function ManageAccountDialog({
  open,
  onOpenChange,
}: ManageAccountDialogProps) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const { refetch, state } = useCurrentUser()

  if (!account || state.status !== "success") {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        data-testid="manage-account-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("manageAccount.title")}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="integration">
          <TabsList className="w-full">
            <TabsTrigger
              data-testid="manage-account-tab-integration"
              value="integration"
            >
              {t("manageAccount.tabs.integration")}
            </TabsTrigger>
            <TabsTrigger
              data-testid="manage-account-tab-account"
              value="account"
            >
              {t("manageAccount.tabs.account")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="integration">
            <TacticusIntegrationTab onSaved={refetch} user={state.user} />
          </TabsContent>
          <TabsContent value="account">
            <AccountTab
              account={account}
              instance={instance}
              onPurged={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function TacticusIntegrationTab({
  onSaved,
  user,
}: {
  onSaved: () => void
  user: CurrentUser
}) {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState("")
  const [userId, setUserId] = useState("")
  const [removeUserId, setRemoveUserId] = useState(false)
  const [status, setStatus] = useState<
    "idle" | "submitting" | "error" | "success"
  >("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await updateIntegration.mutateAsync({
        clearTacticusUserId: removeUserId,
        tacticusApiKey: apiKey.trim() || undefined,
        tacticusUserId: removeUserId ? undefined : userId.trim() || undefined,
      })
      setApiKey("")
      setUserId("")
      setRemoveUserId(false)
      setStatus("success")
      onSaved()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("manageAccount.integration.genericError")
      )
    }
  }

  return (
    <form
      className="flex flex-col gap-4 pt-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="grid gap-2 rounded-2xl border p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">
            {t("manageAccount.integration.currentApiKey")}
          </span>
          <span data-testid="manage-account-current-api-key">
            {user.tacticusApiKeyMasked ??
              t("manageAccount.integration.notConfigured")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">
            {t("manageAccount.integration.currentUserId")}
          </span>
          <span data-testid="manage-account-current-user-id">
            {user.tacticusUserIdMasked ??
              t("manageAccount.integration.notConfigured")}
          </span>
        </div>
      </div>

      <Field data-invalid={status === "error"}>
        <FieldLabel htmlFor="manage-account-api-key">
          {t("manageAccount.integration.apiKeyLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="manage-account-api-key"
            data-testid="manage-account-api-key-input"
            autoComplete="off"
            placeholder={t("manageAccount.integration.apiKeyPlaceholder")}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <FieldDescription>
            {t("manageAccount.integration.apiKeyDescription")}
          </FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="manage-account-user-id">
          {t("manageAccount.integration.userIdLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="manage-account-user-id"
            data-testid="manage-account-user-id-input"
            autoComplete="off"
            disabled={removeUserId}
            placeholder={t("manageAccount.integration.userIdPlaceholder")}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </FieldContent>
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="manage-account-remove-user-id"
          data-testid="manage-account-remove-user-id"
          checked={removeUserId}
          onCheckedChange={(checked) => setRemoveUserId(checked === true)}
        />
        <FieldLabel
          className="font-normal text-muted-foreground"
          htmlFor="manage-account-remove-user-id"
        >
          {t("manageAccount.integration.removeUserId")}
        </FieldLabel>
      </Field>

      {status === "error" && errorMessage ? (
        <FieldError data-testid="manage-account-integration-error">
          {errorMessage}
        </FieldError>
      ) : null}
      {status === "success" ? (
        <p
          className="text-sm text-primary"
          data-testid="manage-account-integration-success"
        >
          {t("manageAccount.integration.saved")}
        </p>
      ) : null}

      <Button
        data-testid="manage-account-integration-submit"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? <Spinner /> : null}
        {t("manageAccount.integration.save")}
      </Button>
    </form>
  )
}

function AccountTab({
  account,
  instance,
  onPurged,
}: {
  account: AccountInfo
  instance: IPublicClientApplication
  onPurged: () => void
}) {
  const { t } = useTranslation()
  const [confirmation, setConfirmation] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const purge = useMutation({ mutationFn: purgeAccount })

  const canPurge = confirmation === PURGE_CONFIRMATION_WORD

  const handlePurge = async () => {
    if (!canPurge) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await purge.mutateAsync()
      onPurged()
      await signOut(instance, account)
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("manageAccount.account.purgeGenericError")
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div
        className="flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        role="alert"
      >
        <p className="font-medium text-destructive">
          {t("manageAccount.account.purgeWarningTitle")}
        </p>
        <p className="text-muted-foreground">
          {t("manageAccount.account.purgeWarningDescription")}
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="manage-account-purge-confirmation">
          {t("manageAccount.account.purgeConfirmLabel", {
            word: PURGE_CONFIRMATION_WORD,
          })}
        </FieldLabel>
        <FieldContent>
          <Input
            id="manage-account-purge-confirmation"
            data-testid="manage-account-purge-confirmation-input"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </FieldContent>
      </Field>

      {status === "error" && errorMessage ? (
        <FieldError data-testid="manage-account-purge-error">
          {errorMessage}
        </FieldError>
      ) : null}

      <Button
        data-testid="manage-account-purge-submit"
        disabled={!canPurge || status === "submitting"}
        variant="destructive"
        onClick={() => void handlePurge()}
      >
        {status === "submitting" ? <Spinner /> : null}
        {t("manageAccount.account.purgeSubmit")}
      </Button>
    </div>
  )
}
