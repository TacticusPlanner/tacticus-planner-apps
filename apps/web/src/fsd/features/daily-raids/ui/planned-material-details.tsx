import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Pressable } from "@workspace/ui/components/pressable"

import { DetailsOverlay } from "@/shared/ui"

import type { DailyRaidResourceVisual } from "../model/daily-raids.domain"
import type { MaterialDetailsSource } from "../model/material-details-context"
import { useDailyRaids } from "../model/use-daily-raids"
import { TodaysMaterialDetails } from "./material-details"
import { ResourceIcon } from "./resource-icon"

/**
 * A material's icon outside the Raids pages (Plan > Insights): opens the same material details as
 * Raids, reading the project's plan run only once the details are open.
 */
export function PlannedMaterialDetails({
  projectId,
  resourceId,
  label,
  visual,
  LockedNodes,
}: {
  projectId: string | null
  resourceId: string
  label: string
  visual: DailyRaidResourceVisual
  LockedNodes?: MaterialDetailsSource["LockedNodes"]
}) {
  return (
    <DetailsOverlay
      testId={`material-details-${resourceId}-overlay`}
      title={label}
      tooltip={label}
      trigger={
        <Pressable
          aria-label={label}
          className="shrink-0 rounded-sm border-0 bg-transparent p-0"
        >
          <ResourceIcon label={label} size="icon-lg" visual={visual} />
        </Pressable>
      }
    >
      <PlannedMaterialDetailsBody
        LockedNodes={LockedNodes}
        projectId={projectId}
        resourceId={resourceId}
      />
    </DetailsOverlay>
  )
}

function PlannedMaterialDetailsBody({
  projectId,
  resourceId,
  LockedNodes,
}: {
  projectId: string | null
  resourceId: string
  LockedNodes?: MaterialDetailsSource["LockedNodes"]
}) {
  const { t } = useTranslation("dailies")
  const raids = useDailyRaids(projectId ?? undefined)
  if (raids.status === "loading") {
    return (
      <div
        aria-busy="true"
        className="grid gap-2"
        data-testid={`material-details-${resourceId}-loading`}
      >
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }
  if (raids.status !== "ready") {
    return (
      <p className="text-sm text-muted-foreground">
        {t("materialDetails.unavailable")}
      </p>
    )
  }
  return (
    <TodaysMaterialDetails
      resourceId={resourceId}
      source={{ raids, LockedNodes }}
      testId={`material-details-${resourceId}`}
    />
  )
}
