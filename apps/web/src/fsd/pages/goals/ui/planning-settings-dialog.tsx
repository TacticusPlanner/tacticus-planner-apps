import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { Slider } from "@workspace/ui/components/slider"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  dailyEnergyTiers,
  usePlanningSettings,
} from "@/entities/planning-setting"
import { ApiError } from "@/shared/api"

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

export function PlanningSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { settings, save } = usePlanningSettings()
  const [tierIndex, setTierIndex] = useState(() =>
    Math.max(
      0,
      dailyEnergyTiers.indexOf(
        settings.dailyEnergy as (typeof dailyEnergyTiers)[number]
      )
    )
  )
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setStatus("saving")
    setError(null)
    try {
      await save({
        dailyEnergy: dailyEnergyTiers[tierIndex],
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
              className="text-sm font-medium"
              data-testid="planning-settings-energy-value"
            >
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
