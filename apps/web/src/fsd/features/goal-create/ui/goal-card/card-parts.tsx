import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Rank, UpgradeId } from "@workspace/game-domain"

import {
  rowCount,
  type RankAdditionalTarget,
} from "@/features/goal-farming/@x/goal-create"
import { RankBadge, UpgradeIcon } from "@/shared/ui"

import { PreviewSection, type PreviewState } from "../shared/preview-section"

export type MissingUpgrade = { id: string; label: string; missing: number }

/** A card's resource preview, as both dialogs compute it: its state, the materials still to farm and,
 * when there is one, the estimated days line. */
export type ResourcePreview = {
  state: PreviewState
  missingUpgrades: readonly MissingUpgrade[]
  days?: ReactNode
}

const RESOURCES_NEEDED_VISIBLE_COUNT = 3

/** "Resources needed" upgrade list, collapsed to the first 3 entries until expanded. */
export function ResourcesNeededList({
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
            <UpgradeIcon className="size-6" id={entry.id as UpgradeId} />
            {entry.label} × {entry.missing}
          </li>
        ))}
      </ul>
      {missingUpgrades.length > RESOURCES_NEEDED_VISIBLE_COUNT ? (
        <button
          className="justify-self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
          data-testid="create-goal-resources-needed-toggle"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded
            ? t("goals.create.showLess")
            : t("goals.create.showAll", { count: missingUpgrades.length })}
        </button>
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
      {preview.days ? (
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

export function AdditionalTargetLabel({
  rank,
  value,
}: {
  rank: Rank
  value: RankAdditionalTarget
}) {
  const { t } = useTranslation()
  if (value === "None") {
    return <>{t("goals.create.rank.additionalTarget.none")}</>
  }

  let count = rowCount(value)
  if (value === "TopRow1") count = 1
  if (value === "TopRow2") count = 2
  if (value === "TopRow") count = 3

  return (
    <span className="inline-flex items-center gap-1">
      <RankBadge rank={rank} />
      {count !== null ? (
        <>
          {" "}
          <span>({count}/6)</span>
        </>
      ) : null}
    </span>
  )
}
