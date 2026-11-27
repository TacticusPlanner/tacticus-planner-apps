import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Rank, UpgradeId } from "@workspace/game-domain"

import { rowCount } from "@/entities/goal-farming"
import type { RankAdditionalTarget } from "@/entities/goal-farming"
import { RankBadge, UpgradeIcon } from "@/shared/ui"

import { PreviewSection } from "../shared/preview-section"
import type { PreviewState } from "../shared/preview-section"
import { hasNode } from "@/shared/lib"
import { Button } from "@workspace/ui/components/button"

type MissingUpgrade = { id: string; label: string; missing: number }

/** A card's resource preview, as both dialogs compute it: its state, the materials still to farm and,
 * when there is one, the estimated days line. */
export type ResourcePreview = {
  state: PreviewState
  missingUpgrades: readonly MissingUpgrade[]
  days?: ReactNode
}

const RESOURCES_NEEDED_VISIBLE_COUNT = 3

/** "Resources needed" upgrade list, collapsed to the first 3 entries until expanded. */
function ResourcesNeededList({
  missingUpgrades,
}: {
  missingUpgrades: readonly MissingUpgrade[]
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  if (missingUpgrades.length === 0) return null

  const visible = expanded
    ? missingUpgrades
    : missingUpgrades.slice(0, RESOURCES_NEEDED_VISIBLE_COUNT)

  return (
    <>
      <ul className="grid gap-0.5 text-muted-foreground">
        {visible.map((entry) => (
          <li className="flex items-center gap-1.5" key={entry.id}>
            <UpgradeIcon id={entry.id as UpgradeId} />
            {entry.label} × {entry.missing}
          </li>
        ))}
      </ul>
      {missingUpgrades.length > RESOURCES_NEEDED_VISIBLE_COUNT ? (
        <Button
          variant="link"
          className="h-auto justify-self-start rounded-sm p-0 text-xs font-medium whitespace-normal text-primary underline-offset-2"
          data-testid="create-goal-resources-needed-toggle"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded
            ? t("goals.create.showLess")
            : t("goals.create.showAll", { count: missingUpgrades.length })}
        </Button>
      ) : null}
    </>
  )
}

/** The card's "Resources needed" box: loading, failed, nothing to farm, or the list and days. */
export function ResourcePreviewSection({
  preview,
  emptyText,
  testId,
  disclaimer = false,
}: {
  preview: ResourcePreview
  emptyText: string
  testId: string
  disclaimer?: boolean
}) {
  const { t } = useTranslation()
  return (
    <PreviewSection emptyText={emptyText} state={preview.state} testId={testId}>
      <ResourcesNeededList missingUpgrades={preview.missingUpgrades} />
      {hasNode(preview.days) ? (
        <p className="font-medium" data-testid="goal-card-estimate-days">
          {preview.days}
        </p>
      ) : null}
      {disclaimer ? (
        <p className="text-xs text-muted-foreground">
          {t("goals.create.previewDisclaimer")}
        </p>
      ) : null}
    </PreviewSection>
  )
}

/**
 * "Gold II → Diamond II · 12 materials" beside a ladder: the selected range and what it needs, read
 * from the card's own preview, or that the preview is loading or failed.
 */
export function TargetRangeLine({
  start,
  end,
  state,
  resources,
}: {
  start: string
  end: string
  state: PreviewState
  /** What the range needs, once the preview has content. */
  resources: string
}) {
  const { t } = useTranslation()
  const detail =
    state === "loading"
      ? t("goals.create.previewLoading")
      : state === "failed"
        ? t("goals.create.previewFailed")
        : state === "empty"
          ? t("goals.card.range.nothing")
          : resources
  return (
    <p
      aria-live="polite"
      className="text-sm text-muted-foreground"
      data-state={state}
      data-testid="goal-card-range"
    >
      <span className="font-medium text-foreground">
        {t("goals.card.range.span", { start, end })}
      </span>
      {" · "}
      {detail}
    </p>
  )
}

/** "Diamond II (4/6)", plus "· Level 48" when the XP level the target needs is known. */
export function AdditionalTargetLabel({
  rank,
  value,
  level,
}: {
  rank: Rank
  value: RankAdditionalTarget
  level?: number
}) {
  const { t } = useTranslation()
  if (value === "None") {
    return <>{t("goals.create.rank.additionalTarget.none")}</>
  }

  const count = rowCount(value)

  return (
    <span className="inline-flex items-center gap-1">
      <RankBadge rank={rank} />
      {count !== null ? (
        <>
          {" "}
          <span>({count}/6)</span>
        </>
      ) : null}
      {level === undefined ? null : (
        <span className="text-muted-foreground">
          {"· "}
          {t("goals.create.rank.additionalTarget.level", { level })}
        </span>
      )}
    </span>
  )
}
