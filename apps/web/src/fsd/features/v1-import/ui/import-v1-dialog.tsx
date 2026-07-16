import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMsal } from "@azure/msal-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import {
  accountQueries,
  importV1Profile,
  useCurrentUser,
  type ImportV1ProfileResult,
} from "@/entities/account"
import { ApiError } from "@/shared/api"
import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"

const parts = [
  ["personalTacticusApiKey", "goals.v1Import.parts.personalKey"],
  ["tacticusUserId", "goals.v1Import.parts.userId"],
  ["guildApiToken", "goals.v1Import.parts.guildKey"],
  ["goals", "goals.v1Import.parts.goals"],
] as const

type Selection = Record<(typeof parts)[number][0], boolean>

export function ImportV1Dialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const { refetch } = useCurrentUser()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selection, setSelection] = useState<Selection>({
    personalTacticusApiKey: true,
    tacticusUserId: true,
    guildApiToken: true,
    goals: true,
  })
  const [status, setStatus] = useState<
    "idle" | "submitting" | "error" | "success"
  >("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportV1ProfileResult | null>(null)
  const importProfile = useMutation({ mutationFn: importV1Profile })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      !account ||
      !username.trim() ||
      !password ||
      !Object.values(selection).some(Boolean)
    )
      return
    setStatus("submitting")
    setError(null)
    setResult(null)
    try {
      const imported = await importProfile.mutateAsync({
        username: username.trim(),
        password,
        import: selection,
      })
      setResult(imported)
      refetch()
      await queryClient.invalidateQueries({ queryKey: accountQueries.all() })
      if (selection.goals) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
          queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
        ])
      }
      setPassword("")
      setStatus("success")
    } catch (caught) {
      setStatus("error")
      setError(
        caught instanceof ApiError ? caught.message : t("goals.v1Import.error")
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="v1-import-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("goals.v1Import.title")}</DialogTitle>
          <DialogDescription>
            {t("goals.v1Import.description")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Field>
            <FieldLabel htmlFor="v1-import-username">
              {t("goals.v1Import.username")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="v1-import-username"
                data-testid="v1-import-username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="v1-import-password">
              {t("goals.v1Import.password")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="v1-import-password"
                data-testid="v1-import-password"
                autoComplete="current-password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FieldContent>
          </Field>
          <fieldset className="grid gap-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-medium">
              {t("goals.v1Import.selectParts")}
            </legend>
            {parts.map(([key, label]) => (
              <label className="flex items-center gap-3 text-sm" key={key}>
                <Checkbox
                  data-testid={`v1-import-${key}`}
                  checked={selection[key]}
                  onCheckedChange={(checked) =>
                    setSelection((current) => ({
                      ...current,
                      [key]: checked === true,
                    }))
                  }
                />
                {t(label)}
              </label>
            ))}
          </fieldset>
          {error ? <FieldError role="alert">{error}</FieldError> : null}
          {result ? <ImportResult result={result} /> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("goals.v1Import.close")}
            </Button>
            <Button
              data-testid="v1-import-submit"
              disabled={
                status === "submitting" ||
                !Object.values(selection).some(Boolean)
              }
              type="submit"
            >
              {status === "submitting" ? <Spinner /> : null}
              {t("goals.v1Import.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ImportResult({ result }: { result: ImportV1ProfileResult }) {
  const { t } = useTranslation()
  const rows = [
    [t("goals.v1Import.parts.personalKey"), result.personalTacticusApiKey],
    [t("goals.v1Import.parts.userId"), result.tacticusUserId],
    [t("goals.v1Import.parts.guildKey"), result.guildApiToken],
    [t("goals.v1Import.parts.goals"), result.goals],
  ] as const
  return (
    <div
      className="grid gap-2 rounded-xl bg-muted p-3 text-sm"
      data-testid="v1-import-result"
    >
      {rows.map(([label, part]) => (
        <div className="flex justify-between gap-3" key={label}>
          <span>{label}</span>
          <span className="font-medium">{part.status}</span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {t("goals.v1Import.goalCounts", {
          imported: result.goalsImported,
          replaced: result.goalsReplaced,
          skipped: result.goalsSkipped,
        })}
      </p>
    </div>
  )
}
