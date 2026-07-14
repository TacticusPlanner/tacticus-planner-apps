import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useGoals } from "../model/use-goals"
import { CreateGoalSheet } from "./create-goal-sheet"

/**
 * Goals page: renders one of three states from useGoals' discriminator, plus a "Create goal"
 * trigger (header + empty state) that opens CreateGoalSheet. See the V2 Goals plan's phase 2 —
 * Characters only, one goal type per creation, no chains yet.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const { fetchState, isLoading, retry } = useGoals()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <main
      className="mx-auto flex w-full max-w-400 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10"
      data-testid="goals-page"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("goals.title")}</h1>
        <Button
          data-testid="goals-page-create-button"
          onClick={() => setIsCreateOpen(true)}
        >
          {t("goals.createButton")}
        </Button>
      </div>

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
          <Button onClick={retry} size="sm" variant="outline">
            {t("goals.retry")}
          </Button>
        </div>
      ) : null}

      {fetchState.status === "success" && fetchState.goals.length === 0 ? (
        <Card data-testid="goals-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.empty.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            {t("goals.empty.description")}
            <Button
              data-testid="goals-page-empty-create-button"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              {t("goals.empty.createButton")}
            </Button>
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

      <CreateGoalSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={retry}
      />
    </main>
  )
}
