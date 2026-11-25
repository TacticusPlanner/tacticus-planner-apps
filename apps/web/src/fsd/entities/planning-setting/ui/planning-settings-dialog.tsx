import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Slider } from "@workspace/ui/components/slider"

import { ApiError } from "@/shared/api"
import { useCatalogDataset } from "@/shared/local-data"
import {
  energyIconUrl,
  EntityIcon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { energySourceLabel, toDailyEnergyTiers } from "../model/energy-tiers"
import { xpBookRarityOptions } from "../model/types"
import { usePlanningSettingsEditor } from "../model/use-planning-settings-editor"

/**
 * The one Planning Settings dialog, reused from both Plan > Goals (`/plan/goals`) and Dailies >
 * Raids (Today) and Plan > Schedule, each opened from its page header's Settings button. Lives here rather than under a page so neither page imports the other
 * (`expose-planning-settings-from-dailies`). Callers own their own open state; this component is
 * only mounted while `open` should be true.
 */
export function PlanningSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation(["common", "progression"])
  const [error, setError] = useState<string | null>(null)
  const editor = usePlanningSettingsEditor((caught) => {
    setError(
      caught instanceof ApiError
        ? caught.message
        : t("goals.planningSettings.error")
    )
  })
  const tiersRead = useCatalogDataset("global-values", toDailyEnergyTiers)
  const tiers = tiersRead.status === "ready" ? tiersRead.data : null
  const { dailyEnergy } = editor
  const tier = tiers?.find((candidate) => candidate.energy === dailyEnergy)
  // An energy value off the ladder only parks the slider at its first tier.
  const tierIndex = tier && tiers ? tiers.indexOf(tier) : 0
  const tierEnergy = (index: number | undefined) =>
    index === undefined ? undefined : tiers?.[index]?.energy

  return (
    <ResponsiveDialog
      data-testid="planning-settings-dialog"
      width="narrow"
      onOpenChange={onOpenChange}
      open={open}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("goals.planningSettings.title")}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {t("goals.planningSettings.description")}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <ResponsiveDialogBody className="gap-6">
        <Field>
          <FieldLabel>{t("goals.planningSettings.dailyEnergy")}</FieldLabel>
          <p
            className="flex items-center gap-1.5 text-sm font-medium"
            data-testid="planning-settings-energy-value"
          >
            <EntityIcon
              size="icon"
              alt=""
              className="shrink-0"
              src={energyIconUrl}
            />
            {tier
              ? `${tier.energy} · ${energySourceLabel(tier.source)}`
              : dailyEnergy}
          </p>
          {tiers ? (
            <>
              <Slider
                aria-label={t("goals.planningSettings.dailyEnergy")}
                data-testid="planning-settings-energy"
                min={0}
                max={tiers.length - 1}
                step={1}
                value={[tierIndex]}
                onValueChange={([value]) => {
                  const energy = tierEnergy(value)
                  if (energy !== undefined) editor.previewDailyEnergy(energy)
                }}
                onValueCommit={([value]) => {
                  const energy = tierEnergy(value)
                  if (energy === undefined) return
                  setError(null)
                  editor.commitDailyEnergy(energy)
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{tiers[0]?.energy}</span>
                <span>{tiers.at(-1)?.energy}</span>
              </div>
            </>
          ) : (
            // Until global-values loads there are no tiers to slide between.
            <Skeleton
              className="h-9 w-full"
              data-testid="planning-settings-energy-loading"
            />
          )}
        </Field>

        <Field>
          <FieldLabel>{t("goals.planningSettings.xpBookRarity")}</FieldLabel>
          <Select
            onValueChange={(value) => {
              setError(null)
              editor.changeXpBookRarity(value as Rarity)
            }}
            value={editor.xpBookRarity}
          >
            <SelectTrigger
              className="w-full"
              data-testid="planning-settings-xp-book-rarity"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {xpBookRarityOptions.map((rarity) => (
                <SelectItem key={rarity} value={rarity}>
                  {t(`progression:rarities.${rarity}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t("goals.planningSettings.xpBookRarityHint")}
          </p>
        </Field>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button
          data-testid="planning-settings-done"
          onClick={() => onOpenChange(false)}
        >
          {t("goals.planningSettings.done")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
