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
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
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
  isTacticusUserId,
  purgeAccount,
  tacticusUserIdProblem,
  updateTacticusIntegration,
  useCurrentUser,
  type CurrentUser,
} from "@/entities/account"
import { ApiError } from "@/shared/api"
import { getAccountEmail, getSignInMethod, signOut } from "@/shared/auth"

import { rememberSignInAccountKept } from "../model/sign-in-account-kept-notice"
import { ProfileTab } from "./profile-tab"

const PURGE_CONFIRMATION_WORD = "Confirm"

const PURGE_SCOPES = ["plannerData", "signInAccount"] as const
type PurgeScope = (typeof PURGE_SCOPES)[number]

function isPurgeScope(value: string): value is PurgeScope {
  return (PURGE_SCOPES as readonly string[]).includes(value)
}

export type ManageAccountTab = "integration" | "profile" | "account"

type ManageAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The tab shown each time the dialog opens; lets a shortcut (e.g. the name edit icon) land on it. */
  initialTab?: ManageAccountTab
}

/**
 * "Account settings" dialog reachable from the user menu: Tacticus Integration (view masked values, update the
 * key, update/remove the user id) and Account (sign-in method and
 * email, then purge — planner data only, or also the sign-in account; requires typing the literal word
 * "Confirm").
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

/** Saving writes the response's masked key/user id into the cached current user (no `GET /account`). */
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
  // The API's user-id answer was about the id just submitted, so editing the id drops it.
  const clearUserIdAnswer = () => {
    if (tacticusUserIdProblem(updateIntegration.error))
      updateIntegration.reset()
  }
  const trimmedUserId = removeUserId ? "" : userId.trim()
  const userIdFormatInvalid =
    trimmedUserId !== "" && !isTacticusUserId(trimmedUserId)
  const userIdProblem = userIdFormatInvalid
    ? "invalid"
    : tacticusUserIdProblem(updateIntegration.error)
  const errorMessage =
    updateIntegration.error && !userIdProblem
      ? updateIntegration.error instanceof ApiError
        ? updateIntegration.error.message
        : t("manageAccount.integration.genericError")
      : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (userIdFormatInvalid) return
    updateIntegration.mutate({
      clearTacticusUserId: removeUserId,
      tacticusApiKey: apiKey.trim() || null,
      tacticusUserId: trimmedUserId || null,
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

      <Field data-invalid={Boolean(userIdProblem)}>
        <FieldLabel htmlFor="manage-account-user-id">
          {t("manageAccount.integration.userIdLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="manage-account-user-id"
            data-testid="manage-account-user-id-input"
            aria-invalid={Boolean(userIdProblem)}
            autoComplete="off"
            disabled={removeUserId}
            placeholder={t("manageAccount.integration.userIdPlaceholder")}
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value)
              clearUserIdAnswer()
            }}
          />
          {userIdProblem ? (
            <FieldError data-testid="manage-account-user-id-error">
              {t(`tacticusUserId.${userIdProblem}`)}
            </FieldError>
          ) : null}
        </FieldContent>
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="manage-account-remove-user-id"
          data-testid="manage-account-remove-user-id"
          checked={removeUserId}
          onCheckedChange={(checked) => {
            setRemoveUserId(checked === true)
            clearUserIdAnswer()
          }}
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
        disabled={updateIntegration.isPending || userIdFormatInvalid}
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
  const [scope, setScope] = useState<PurgeScope>("plannerData")
  const purge = useMutation({
    mutationFn: async () => {
      const deleteSignInAccount = scope === "signInAccount"
      const { signInAccountDeleted } = await purgeAccount({
        deleteSignInAccount,
      })
      // Sign out after any purge, even when the sign-in account was kept: staying signed in would let
      // the next `GET /account` provision a new, empty planner account. The landing page shows the notice.
      if (deleteSignInAccount && !signInAccountDeleted) {
        rememberSignInAccountKept()
      }
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
  const signInMethod = getSignInMethod(account)
  const accountEmail = getAccountEmail(account)

  const handlePurge = () => {
    if (canPurge) purge.mutate()
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="grid gap-2 rounded-2xl border p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">
            {t("manageAccount.account.signInMethod")}
          </span>
          <span data-testid="manage-account-sign-in-method">
            {t(`manageAccount.account.signInMethods.${signInMethod}`)}
          </span>
        </div>
        {accountEmail ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {t("manageAccount.account.email")}
            </span>
            <span
              className="min-w-0 truncate"
              data-testid="manage-account-email"
              title={accountEmail}
            >
              {accountEmail}
            </span>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t("manageAccount.account.signInMethodNote")}
        </p>
      </div>

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

      <RadioGroup
        aria-label={t("manageAccount.account.purgeScopeLabel")}
        data-testid="manage-account-purge-scope"
        disabled={purge.isPending}
        value={scope}
        onValueChange={(value) => {
          if (isPurgeScope(value)) setScope(value)
        }}
      >
        {PURGE_SCOPES.map((option) => (
          <Field key={option} orientation="horizontal">
            <RadioGroupItem
              data-testid={`manage-account-purge-scope-${option}`}
              id={`manage-account-purge-scope-${option}`}
              value={option}
            />
            <FieldContent>
              <FieldLabel htmlFor={`manage-account-purge-scope-${option}`}>
                {t(`manageAccount.account.purgeScopes.${option}.label`)}
              </FieldLabel>
              <FieldDescription>
                {t(`manageAccount.account.purgeScopes.${option}.description`)}
              </FieldDescription>
            </FieldContent>
          </Field>
        ))}
      </RadioGroup>

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
