import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
import {
  campaignEventProgressQueries,
  onslaughtProgressQueries,
} from "@/entities/player-data-override"

import { ImportResult } from "./import-v1-result"

const parts = [
  ["personalTacticusApiKey", "goals.v1Import.parts.personalKey"],
  ["tacticusUserId", "goals.v1Import.parts.userId"],
  ["guildApiToken", "goals.v1Import.parts.guildKey"],
  ["goals", "goals.v1Import.parts.goals"],
  ["onslaughtProgress", "goals.v1Import.parts.onslaughtProgress"],
  ["campaignEventProgress", "goals.v1Import.parts.campaignEventProgress"],
] as const

export type V1ImportSelection = Record<(typeof parts)[number][0], boolean>

/**
 * The whole V1-import experience — credentials, part selection, submit, and the bucketed outcome
 * report — with no chrome of its own. Two hosts wrap this differently: `pages/v1-import` (opened
 * from the account menu, everything unchecked by default) and `app/setup-v1-import.tsx` (part of
 * initial account provisioning, everything checked by default). Only `defaultSelection` and
 * `onSuccess` vary between them; the import mechanics themselves are identical.
 */
export function V1ImportPanel({
  defaultSelection,
  onSuccess,
}: {
  defaultSelection: V1ImportSelection
  onSuccess?: (result: ImportV1ProfileResult) => void
}) {
  const { t } = useTranslation()
  const { refetch } = useCurrentUser()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selection, setSelection] =
    useState<V1ImportSelection>(defaultSelection)
  // Matches the manual create-goal flow's own default (rewrite-v1-goal-import). Not a "part": it has
  // no result row of its own, only an effect on the goal outcomes.
  const [automaticPrerequisites, setAutomaticPrerequisites] = useState(true)
  const [status, setStatus] = useState<
    "idle" | "submitting" | "error" | "success"
  >("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportV1ProfileResult | null>(null)
  const importProfile = useMutation({ mutationFn: importV1Profile })

  // Single source of truth for "can this be submitted" — drives both the submit control's disabled
  // state and the handler's guard, so the two can no longer drift the way they did before (the
  // password condition used to live only in the handler, leaving the control enabled right after a
  // successful run cleared the password — see design.md).
  const canSubmit =
    username.trim().length > 0 &&
    password.length > 0 &&
    Object.values(selection).some(Boolean) &&
    status !== "submitting"

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    // Defensive only: the submit control is disabled whenever this doesn't hold, so a real click
    // can't reach here with `canSubmit` false.
    if (!canSubmit) return
    setStatus("submitting")
    setError(null)
    setResult(null)
    try {
      const imported = await importProfile.mutateAsync({
        username: username.trim(),
        password,
        import: { ...selection, automaticPrerequisites },
      })
      setResult(imported)
      refetch()
      await queryClient.invalidateQueries({ queryKey: accountQueries.all() })
      if (selection.onslaughtProgress) {
        await queryClient.invalidateQueries({
          queryKey: onslaughtProgressQueries.all(),
        })
      }
      if (selection.campaignEventProgress) {
        await queryClient.invalidateQueries({
          queryKey: campaignEventProgressQueries.all(),
        })
      }
      // Unconditional: the import creates goals itself now (rewrite-v1-goal-import removed the
      // client-side creation path), so this no longer depends on this panel's own knowledge of
      // whether the goals part was selected or produced anything.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
      setPassword("")
      setStatus("success")
      onSuccess?.(imported)
    } catch (caught) {
      setStatus("error")
      setError(
        caught instanceof ApiError ? caught.message : t("goals.v1Import.error")
      )
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="v1-import-panel"
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
      <label className="flex items-center gap-3 text-sm">
        <Checkbox
          data-testid="v1-import-automaticPrerequisites"
          checked={automaticPrerequisites}
          onCheckedChange={(checked) =>
            setAutomaticPrerequisites(checked === true)
          }
        />
        {t("goals.v1Import.automaticPrerequisites")}
      </label>
      {error ? <FieldError role="alert">{error}</FieldError> : null}
      {result ? <ImportResult result={result} /> : null}
      {status === "success" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="v1-import-rerun-hint"
        >
          {t("goals.v1Import.rerunRequiresPassword")}
        </p>
      ) : null}
      <Button
        className="self-start"
        data-testid="v1-import-submit"
        disabled={!canSubmit}
        type="submit"
      >
        {status === "submitting" ? <Spinner /> : null}
        {t("goals.v1Import.submit")}
      </Button>
    </form>
  )
}
