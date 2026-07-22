import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
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

import type { UnitId } from "@workspace/game-domain"
import {
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  accountQueries,
  importV1Profile,
  useCurrentUser,
  type ImportV1ProfileResult,
} from "@/entities/account"
import { ApiError } from "@/shared/api"
import {
  buildCreateGoalSnapshot,
  createCombinedGoals,
  goalQueries,
  type CreateCombinedGoalsRequest,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import {
  campaignEventProgressQueries,
  onslaughtProgressQueries,
} from "@/entities/player-data-override"

/**
 * Attaches an initial-state snapshot to every goal in an imported unit's spec — the backend
 * deliberately leaves `Snapshot` null (it has no client-side estimate engine), so this resolves it
 * the same way the regular create-goal flow does: `buildCreateGoalSnapshot` fed the unit's live
 * synced record. `missingUpgrades`/`estimatePreview` are left empty/null — those need the full
 * resource-requirement/estimate engine (`pages/goals`), out of reach from this lower-layer feature.
 */
async function resolveImportedGoalSnapshot(
  spec: CreateCombinedGoalsRequest
): Promise<CreateCombinedGoalsRequest> {
  const entityType = spec.entityType as "Character" | "Mow"
  const entityId = spec.entityId as UnitId
  const playerEntity =
    entityType === "Mow"
      ? await getPlayerMow(entityId)
      : await getPlayerCharacter(entityId)
  // `playerEntity`'s runtime shape always matches `entityType` (fetched via that same branch above) —
  // TS can't correlate the two separately-computed values, so this cast documents an invariant the
  // types alone can't express (mirrors use-create-goal-form.ts's identical cast).
  const playerCharacter =
    entityType === "Character"
      ? (playerEntity as PlayerDataChunkDto<"characters">[number] | undefined)
      : undefined
  const currentActiveAbility = playerEntity?.abilities?.[0]?.level ?? 1
  const currentPassiveAbility = playerEntity?.abilities?.[1]?.level ?? 1

  return {
    ...spec,
    goals: spec.goals.map((goal) => ({
      ...goal,
      snapshot: buildCreateGoalSnapshot({
        spec: goal,
        entityType,
        playerEntity,
        playerCharacter,
        currentActiveAbility,
        currentPassiveAbility,
        missingUpgrades: [],
        estimatePreview: null,
      }),
    })),
  }
}

const parts = [
  ["personalTacticusApiKey", "goals.v1Import.parts.personalKey"],
  ["tacticusUserId", "goals.v1Import.parts.userId"],
  ["guildApiToken", "goals.v1Import.parts.guildKey"],
  ["goals", "goals.v1Import.parts.goals"],
  ["onslaughtProgress", "goals.v1Import.parts.onslaughtProgress"],
  ["campaignEventProgress", "goals.v1Import.parts.campaignEventProgress"],
] as const

type Selection = Record<(typeof parts)[number][0], boolean>

/** Client-derived outcome of submitting the imported goal specs through the standard
 * `createCombinedGoals` mutation — one spec per unit, so a failure on one unit doesn't block the
 * others (see `handleSubmit`'s `Promise.allSettled`). */
type GoalImportSummary = { created: number; skipped: number; failed: number }

export function ImportV1Dialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { refetch } = useCurrentUser()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selection, setSelection] = useState<Selection>({
    personalTacticusApiKey: true,
    tacticusUserId: true,
    guildApiToken: true,
    goals: true,
    onslaughtProgress: true,
    campaignEventProgress: true,
  })
  const [status, setStatus] = useState<
    "idle" | "submitting" | "error" | "success"
  >("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportV1ProfileResult | null>(null)
  const [goalSummary, setGoalSummary] = useState<GoalImportSummary | null>(null)
  const importProfile = useMutation({ mutationFn: importV1Profile })
  const createGoals = useMutation({ mutationFn: createCombinedGoals })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      !username.trim() ||
      !password ||
      !Object.values(selection).some(Boolean)
    )
      return
    setStatus("submitting")
    setError(null)
    setResult(null)
    setGoalSummary(null)
    try {
      const imported = await importProfile.mutateAsync({
        username: username.trim(),
        password,
        import: selection,
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
      if (selection.goals) {
        // The backend only parses V1 goals into create-request specs — it no longer creates them,
        // nor resolves each goal's initial-state snapshot (no client-side estimate engine there).
        // Submit each unit's spec through the same mutation the regular create-goal flow uses, one
        // per unit, so one unit's failure doesn't block the rest.
        const specs = imported.goalSpecs ?? []
        const outcomes = await Promise.allSettled(
          specs.map(async (spec) =>
            createGoals.mutateAsync(await resolveImportedGoalSnapshot(spec))
          )
        )
        setGoalSummary({
          created: outcomes.filter((outcome) => outcome.status === "fulfilled")
            .length,
          skipped: imported.goalsSkipped,
          failed: outcomes.filter((outcome) => outcome.status === "rejected")
            .length,
        })
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
          {result ? (
            <ImportResult goalSummary={goalSummary} result={result} />
          ) : null}
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

function ImportResult({
  result,
  goalSummary,
}: {
  result: ImportV1ProfileResult
  // Null when the "Goals" part wasn't selected — nothing was submitted, so there's no count to show.
  goalSummary: GoalImportSummary | null
}) {
  const { t } = useTranslation()
  const rows = [
    [t("goals.v1Import.parts.personalKey"), result.personalTacticusApiKey],
    [t("goals.v1Import.parts.userId"), result.tacticusUserId],
    [t("goals.v1Import.parts.guildKey"), result.guildApiToken],
    [t("goals.v1Import.parts.goals"), result.goals],
    [t("goals.v1Import.parts.onslaughtProgress"), result.onslaughtProgress],
    [
      t("goals.v1Import.parts.campaignEventProgress"),
      result.campaignEventProgress,
    ],
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
      {goalSummary ? (
        <p className="text-xs text-muted-foreground">
          {t("goals.v1Import.goalCounts", {
            created: goalSummary.created,
            skipped: goalSummary.skipped,
            failed: goalSummary.failed,
          })}
        </p>
      ) : null}
    </div>
  )
}
