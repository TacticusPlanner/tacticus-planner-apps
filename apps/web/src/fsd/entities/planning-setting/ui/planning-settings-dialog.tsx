import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  dailyEnergyTiers,
  normalizeXpBookRarity,
  usePlanningSettings,
  xpBookRarityOptions,
} from "@/entities/planning-setting"
import { ApiError } from "@/shared/api"
import { energyIconUrl, EntityIcon } from "@/shared/ui"

const tierLabels = [
  "Free",
  "Ad",
  "25 BS",
  "50 BS",
  "110 BS",
  "250 BS",
  "500 BS",
  "1000 BS",
]

/**
 * The one Planning Settings dialog, reused from both Plan > Goals (`/plan/goals`) and Dailies >
 * Raids (`RaidsLayout`, Today/Raids Plan) — see `PlanningSettingsTrigger` for the matching shared
 * trigger. Lives here rather than under a page so neither page imports the other
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
  const { settings, save } = usePlanningSettings()
  const [tierIndex, setTierIndex] = useState(() =>
    Math.max(
      0,
      dailyEnergyTiers.indexOf(
        settings.dailyEnergy as (typeof dailyEnergyTiers)[number]
      )
    )
  )
  const [xpBookRarity, setXpBookRarity] = useState<Rarity>(() =>
    normalizeXpBookRarity(settings.xpBookRarity)
  )
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setStatus("saving")
    setError(null)
    try {
      await save({
        dailyEnergy: dailyEnergyTiers[tierIndex],
        xpBookRarity,
        revision: settings.revision,
      })
      onOpenChange(false)
    } catch (caught) {
      setStatus("error")
      setError(
        caught instanceof ApiError
          ? caught.message
          : t("goals.planningSettings.error")
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="planning-settings-dialog">
        <DialogHeader>
          <DialogTitle>{t("goals.planningSettings.title")}</DialogTitle>
          <DialogDescription>
            {t("goals.planningSettings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <Field>
            <FieldLabel>{t("goals.planningSettings.dailyEnergy")}</FieldLabel>
            <p
              className="flex items-center gap-1.5 text-sm font-medium"
              data-testid="planning-settings-energy-value"
            >
              <EntityIcon
                alt=""
                className="size-5 shrink-0"
                src={energyIconUrl}
              />
              {dailyEnergyTiers[tierIndex]} · {tierLabels[tierIndex]}
            </p>
            <Slider
              aria-label={t("goals.planningSettings.dailyEnergy")}
              data-testid="planning-settings-energy"
              min={0}
              max={dailyEnergyTiers.length - 1}
              step={1}
              value={[tierIndex]}
              onValueChange={([value]) => setTierIndex(value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>288</span>
              <span>938</span>
            </div>
          </Field>

          <Field>
            <FieldLabel>{t("goals.planningSettings.xpBookRarity")}</FieldLabel>
            <Select
              onValueChange={(value) => setXpBookRarity(value as Rarity)}
              value={xpBookRarity}
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
            <p className="text-xs text-muted-foreground">
              {t("goals.planningSettings.xpBookRarityHint")}
            </p>
          </Field>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("goals.planningSettings.cancel")}
          </Button>
          <Button
            data-testid="planning-settings-save"
            disabled={status === "saving"}
            onClick={() => void handleSave()}
          >
            {status === "saving" ? <Spinner /> : null}
            {t("goals.planningSettings.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
