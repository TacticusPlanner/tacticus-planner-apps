import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Check, Copy, ExternalLink } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
  createStagingTransferCode,
  importFromProduction,
} from "@/entities/account"
import { ApiError } from "@/shared/api"
import { STAGING_APP_URL } from "@/shared/config"

import {
  minutesUntil,
  type StagingTransferMode,
} from "../model/staging-transfer"

/** The account dialog's Staging tab: mint a code in production, or redeem one on staging. */
export function StagingTransferTab({ mode }: { mode: StagingTransferMode }) {
  return mode === "export" ? <ExportPanel /> : <ImportPanel />
}

type CopyState = "idle" | "copied" | "failed"

function ExportPanel() {
  const { t } = useTranslation()
  const [copyState, setCopyState] = useState<CopyState>("idle")
  // Worked out when the code arrives: the code is fresh, so this is its lifetime.
  const [minutesLeft, setMinutesLeft] = useState(0)
  const create = useMutation({
    mutationFn: createStagingTransferCode,
    onMutate: () => setCopyState("idle"),
    onSuccess: (result) =>
      setMinutesLeft(minutesUntil(result.expiresAt, Date.now())),
  })

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {t("manageAccount.staging.exportDescription")}
      </p>

      {create.data ? (
        <Field>
          <FieldLabel htmlFor="manage-account-staging-code">
            {t("manageAccount.staging.codeLabel")}
          </FieldLabel>
          <FieldContent>
            <div className="flex gap-2">
              <Input
                className="font-mono text-xs"
                data-testid="manage-account-staging-code"
                id="manage-account-staging-code"
                readOnly
                value={create.data.code}
                onFocus={(event) => event.target.select()}
              />
              <Button
                data-testid="manage-account-staging-copy"
                type="button"
                variant="outline"
                onClick={() => void copy(create.data.code)}
              >
                {copyState === "copied" ? <Check /> : <Copy />}
                {copyState === "copied"
                  ? t("manageAccount.staging.copied")
                  : t("manageAccount.staging.copy")}
              </Button>
            </div>
            <FieldDescription>
              {t("manageAccount.staging.codeExpires", {
                count: minutesLeft,
              })}
            </FieldDescription>
            {copyState === "failed" ? (
              <FieldError>{t("manageAccount.staging.copyFailed")}</FieldError>
            ) : null}
          </FieldContent>
        </Field>
      ) : null}

      {create.error ? (
        <FieldError data-testid="manage-account-staging-error">
          {create.error instanceof ApiError
            ? create.error.message
            : t("manageAccount.staging.genericError")}
        </FieldError>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          data-testid="manage-account-staging-create"
          disabled={create.isPending}
          type="button"
          variant={create.data ? "outline" : "default"}
          onClick={() => create.mutate()}
        >
          {create.isPending ? <Spinner /> : null}
          {create.data
            ? t("manageAccount.staging.createAnother")
            : t("manageAccount.staging.create")}
        </Button>
        <Button asChild variant="ghost">
          <a href={STAGING_APP_URL} rel="noopener noreferrer" target="_blank">
            {t("manageAccount.staging.openStaging")}
            <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </div>
  )
}

function ImportPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [code, setCode] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const importData = useMutation({
    mutationFn: importFromProduction,
    onSuccess: () => {
      setCode("")
      setConfirmed(false)
      // Goals, projects, plans, settings and overrides all changed underneath every cached view.
      void queryClient.invalidateQueries()
    },
  })
  const trimmed = code.trim()
  const canImport = trimmed !== "" && confirmed && !importData.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (canImport) importData.mutate(trimmed)
  }

  return (
    <form className="flex flex-col gap-4 pt-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        {t("manageAccount.staging.importDescription")}
      </p>

      <Field data-invalid={Boolean(importData.error)}>
        <FieldLabel htmlFor="manage-account-staging-import-code">
          {t("manageAccount.staging.codeLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            autoComplete="off"
            className="font-mono text-xs"
            data-testid="manage-account-staging-import-code"
            id="manage-account-staging-import-code"
            placeholder={t("manageAccount.staging.codePlaceholder")}
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              if (importData.error) importData.reset()
            }}
          />
          {importData.error ? (
            <FieldError data-testid="manage-account-staging-import-error">
              {importData.error instanceof ApiError
                ? importData.error.message
                : t("manageAccount.staging.genericError")}
            </FieldError>
          ) : null}
        </FieldContent>
      </Field>

      <div
        className="flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        role="alert"
      >
        <p className="font-medium text-destructive">
          {t("manageAccount.staging.replaceWarningTitle")}
        </p>
        <p className="text-muted-foreground">
          {t("manageAccount.staging.replaceWarningDescription")}
        </p>
      </div>

      <Field orientation="horizontal">
        <Checkbox
          checked={confirmed}
          data-testid="manage-account-staging-confirm"
          id="manage-account-staging-confirm"
          onCheckedChange={(checked) => setConfirmed(checked === true)}
        />
        <FieldLabel
          className="font-normal"
          htmlFor="manage-account-staging-confirm"
        >
          {t("manageAccount.staging.confirm")}
        </FieldLabel>
      </Field>

      {importData.data ? (
        <p
          className="text-sm text-primary"
          data-testid="manage-account-staging-import-success"
        >
          {t("manageAccount.staging.imported", {
            goals: importData.data.goals,
            projects: importData.data.projects,
            plans: importData.data.legendaryEventPlans,
          })}
        </p>
      ) : null}

      <Button
        data-testid="manage-account-staging-import-submit"
        disabled={!canImport}
        type="submit"
      >
        {importData.isPending ? <Spinner /> : null}
        {t("manageAccount.staging.import")}
      </Button>
    </form>
  )
}
