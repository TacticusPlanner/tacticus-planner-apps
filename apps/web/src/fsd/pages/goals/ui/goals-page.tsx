import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useMsal } from "@azure/msal-react"

import { listGoals, type GoalSummary } from "@/entities/goal"
import { ApiError } from "@/shared/api"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: GoalSummary[] }

/**
 * Goals page: loads GET /api/v1/me/goals once on open and renders one of three states from its
 * discriminator. There is no creation UI yet — this ships the persisted, unified goal list only (see the
 * V2 Goals plan's phase 1); creation lands in a later phase. Mirrors GuildPage's direct-fetch pattern (no
 * Dexie/react-query — goals are user-owned mutable server data, matching ADR 0003).
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId
  const abortRef = useRef<AbortController | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const load = useCallback(() => {
    if (!account) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setFetchState({ status: "idle" })

    void listGoals(instance, account, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({ status: "success", goals: data.goals })
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("goals.loadError"),
        })
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, account])

  useEffect(() => {
    const currentAccount = instance.getActiveAccount() ?? accounts[0]
    if (!currentAccount) {
      return
    }

    let active = true
    const controller = new AbortController()
    abortRef.current = controller

    void listGoals(instance, currentAccount, controller.signal).then(
      (data) => {
        if (!active) {
          return
        }

        setFetchState({ status: "success", goals: data.goals })
      },
      (error: unknown) => {
        if (!active) {
          return
        }

        setFetchState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("goals.loadError"),
        })
      }
    )

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, instance, accounts])

  const isLoading = useMemo(
    () => fetchState.status === "idle",
    [fetchState.status]
  )

  return (
    <main
      className="mx-auto flex w-full max-w-400 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10"
      data-testid="goals-page"
    >
      <h1 className="text-2xl font-semibold">{t("goals.title")}</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3" data-testid="goals-page-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {fetchState.status === "error" ? (
        <div
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          data-testid="goals-page-error"
          role="alert"
        >
          <p className="text-destructive">{fetchState.message}</p>
          <Button onClick={load} size="sm" variant="outline">
            {t("goals.retry")}
          </Button>
        </div>
      ) : null}

      {fetchState.status === "success" && fetchState.goals.length === 0 ? (
        <Card data-testid="goals-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.empty.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("goals.empty.description")}
          </CardContent>
        </Card>
      ) : null}

      {fetchState.status === "success" && fetchState.goals.length > 0 ? (
        <div className="flex flex-col gap-3" data-testid="goals-page-list">
          {fetchState.goals.map((goal) => (
            <Card key={goal.goalId}>
              <CardHeader>
                <CardTitle className="text-base">
                  {goal.entityType} · {goal.goalType} · {goal.entityId}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {goal.status}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </main>
  )
}
