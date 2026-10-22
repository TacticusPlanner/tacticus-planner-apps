import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
  applyTacticusIntegrationResult,
  purgeAccount,
  updateTacticusIntegration,
  useCurrentUser,
  type CurrentUser,
} from "@/entities/account"
import { ApiError } from "@/shared/api"
import { signOut } from "@/shared/auth"

import { ProfileTab } from "./profile-tab"

const PURGE_CONFIRMATION_WORD = "Confirm"

export type ManageAccountTab = "integration" | "profile" | "account"

type ManageAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The tab shown each time the dialog opens; lets a shortcut (e.g. the name edit icon) land on it. */
  initialTab?: ManageAccountTab
}

/**
 * "Account settings" dialog reachable from the user menu: Tacticus Integration (view masked values, update the
 * key, update/remove the user id) and Account (purge — requires typing the literal word "Confirm").
 */
export function ManageAccountDialog({
  open,
  onOpenChange,
  initialTab = "integration",
}: ManageAccountDialogProps) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const { state } = useCurrentUser()

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
        <Tabs defaultValue={initialTab}>
          <TabsList className="w-full">
            <TabsTrigger
              data-testid="manage-account-tab-integration"
              value="integration"
            >
              {t("manageAccount.tabs.integration")}
            </TabsTrigger>
            <TabsTrigger
              data-testid="manage-account-tab-profile"
              value="profile"
            >
              {t("manageAccount.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger
              data-testid="manage-account-tab-account"
              value="account"
            >
              {t("manageAccount.tabs.account")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="integration">
            <TacticusIntegrationTab user={state.user} />
          </TabsContent>
          <TabsContent value="profile">
            <ProfileTab user={state.user} />
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

/** Saving writes the response's masked key/user id into the cached current user (no `GET /me`). */
function TacticusIntegrationTab({ user }: { user: CurrentUser }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState("")
  const [userId, setUserId] = useState("")
  const [removeUserId, setRemoveUserId] = useState(false)
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
    onSuccess: (result) => {
      setApiKey("")
      setUserId("")
      setRemoveUserId(false)
      applyTacticusIntegrationResult(queryClient, result)
    },
  })
  const errorMessage = updateIntegration.error
    ? updateIntegration.error instanceof ApiError
      ? updateIntegration.error.message
      : t("manageAccount.integration.genericError")
    : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    updateIntegration.mutate({
      clearTacticusUserId: removeUserId,
      tacticusApiKey: apiKey.trim() || undefined,
      tacticusUserId: removeUserId ? undefined : userId.trim() || undefined,
    })
  }

  return (
    <form className="flex flex-col gap-4 pt-4" onSubmit={handleSubmit}>
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

      <Field data-invalid={Boolean(errorMessage)}>
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
          <Button asChild className="self-start" size="xs" variant="outline">
            <a
              data-testid="manage-account-get-key-link"
              href="https://api.tacticusgame.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("manageAccount.integration.getKey")}
              <ExternalLink data-icon="inline-end" />
            </a>
          </Button>
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

      {errorMessage ? (
        <FieldError data-testid="manage-account-integration-error">
          {errorMessage}
        </FieldError>
      ) : null}
      {updateIntegration.isSuccess ? (
        <p
          className="text-sm text-primary"
          data-testid="manage-account-integration-success"
        >
          {t("manageAccount.integration.saved")}
        </p>
      ) : null}

      <Button
        data-testid="manage-account-integration-submit"
        disabled={updateIntegration.isPending}
        type="submit"
      >
        {updateIntegration.isPending ? <Spinner /> : null}
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
  const purge = useMutation({
    mutationFn: async () => {
      await purgeAccount()
      onPurged()
      await signOut(instance, account.homeAccountId)
    },
  })
  const errorMessage = purge.error
    ? purge.error instanceof ApiError
      ? purge.error.message
      : t("manageAccount.account.purgeGenericError")
    : null

  const canPurge = confirmation === PURGE_CONFIRMATION_WORD

  const handlePurge = () => {
    if (canPurge) purge.mutate()
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

      {errorMessage ? (
        <FieldError data-testid="manage-account-purge-error">
          {errorMessage}
        </FieldError>
      ) : null}

      <Button
        data-testid="manage-account-purge-submit"
        disabled={!canPurge || purge.isPending}
        variant="destructive"
        onClick={handlePurge}
      >
        {purge.isPending ? <Spinner /> : null}
        {t("manageAccount.account.purgeSubmit")}
      </Button>
    </div>
  )
}
