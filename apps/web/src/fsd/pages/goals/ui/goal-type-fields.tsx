import { useTranslation } from "react-i18next"
import { Field, FieldContent, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"

import type { Progression, Rank } from "@workspace/game-domain"

import { ProgressionSelect, RankSelect } from "@/shared/ui"
import type { EstimateOutcome } from "../model/estimate/estimate.domain"

export type MissingUpgrade = { id: string; label: string; missing: number }
export type EstimatePreview = EstimateOutcome

/** Target-rank fields + the resource-requirement preview (plan §16 phase 2 — Rank only) + the
 * isolated day-by-day estimate for that same range (plan §16 phase 4). */
export function RankGoalFields({
  rankStart,
  rankEnd,
  rankEndOptions,
  rankStartOptions,
  rankStartPointFive,
  rankEndPointFive,
  onRankStartChange,
  onRankEndChange,
  onRankStartPointFiveChange,
  onRankEndPointFiveChange,
  missingUpgrades,
  estimate,
  dailyEnergy,
}: {
  rankStart: Rank
  rankEnd: Rank
  rankEndOptions: Rank[]
  rankStartOptions: Rank[]
  rankStartPointFive: boolean
  rankEndPointFive: boolean
  onRankStartChange: (rank: Rank) => void
  onRankEndChange: (rank: Rank) => void
  onRankStartPointFiveChange: (value: boolean) => void
  onRankEndPointFiveChange: (value: boolean) => void
  missingUpgrades: MissingUpgrade[]
  estimate: EstimatePreview | null
  dailyEnergy: number
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <RankSelect
          label={t("goals.create.rank.start")}
          value={rankStart}
          options={rankStartOptions}
          onChange={onRankStartChange}
        />
        <RankSelect
          label={t("goals.create.rank.end")}
          value={rankEnd}
          options={rankEndOptions}
          onChange={onRankEndChange}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field orientation="horizontal">
          <Switch
            checked={rankStartPointFive}
            onCheckedChange={onRankStartPointFiveChange}
          />
          <FieldLabel className="font-normal text-muted-foreground">
            {t("goals.create.rank.startPointFive")}
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch
            checked={rankEndPointFive}
            onCheckedChange={onRankEndPointFiveChange}
          />
          <FieldLabel className="font-normal text-muted-foreground">
            {t("goals.create.rank.endPointFive")}
          </FieldLabel>
        </Field>
      </div>

      {missingUpgrades.length > 0 || estimate ? (
        <div
          className="grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-preview"
        >
          {missingUpgrades.length > 0 ? (
            <>
              <p className="font-medium">{t("goals.create.previewTitle")}</p>
              <ul className="grid gap-0.5 text-muted-foreground">
                {missingUpgrades.map((entry) => (
                  <li key={entry.id}>
                    {entry.label} × {entry.missing}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {estimate && estimate.status !== "Blocked" ? (
            <div
              className="grid gap-0.5 font-medium"
              data-testid="create-goal-estimate"
            >
              <p>
                {t("goals.create.previewEstimate", {
                  days: estimate.days,
                  date: estimate.date,
                })}
              </p>
              <p>
                {t("goals.create.previewEnergy", {
                  energy: estimate.energyTotal,
                  raids: estimate.raidsTotal,
                  dailyEnergy,
                })}
              </p>
            </div>
          ) : estimate?.status === "Blocked" ? (
            <p
              className="font-medium text-amber-700"
              data-testid="create-goal-estimate-blocked"
            >
              {t(`goals.estimate.blocked.${estimate.reason}`)}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {t("goals.create.previewDisclaimer")}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function AscensionGoalFields({
  progressionStart,
  progressionEnd,
  progressionStartOptions,
  onProgressionStartChange,
  onProgressionEndChange,
}: {
  progressionStart: Progression
  progressionEnd: Progression
  progressionStartOptions: readonly Progression[]
  onProgressionStartChange: (value: Progression) => void
  onProgressionEndChange: (value: Progression) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3">
      <ProgressionSelect
        label={t("goals.create.ascension.start")}
        value={progressionStart}
        options={progressionStartOptions}
        onChange={onProgressionStartChange}
      />
      <ProgressionSelect
        label={t("goals.create.ascension.end")}
        value={progressionEnd}
        onChange={onProgressionEndChange}
      />
    </div>
  )
}

export function AbilityGoalFields({
  activeStart,
  activeEnd,
  passiveStart,
  passiveEnd,
  onActiveStartChange,
  onActiveEndChange,
  onPassiveStartChange,
  onPassiveEndChange,
  missingUpgrades,
  estimate,
  dailyEnergy,
  costingSupported,
}: {
  activeStart: number
  activeEnd: number
  passiveStart: number
  passiveEnd: number
  onActiveStartChange: (value: number) => void
  onActiveEndChange: (value: number) => void
  onPassiveStartChange: (value: number) => void
  onPassiveEndChange: (value: number) => void
  missingUpgrades: MissingUpgrade[]
  estimate: EstimatePreview | null
  dailyEnergy: number
  costingSupported: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field>
        <FieldLabel>{t("goals.create.ability.activeStart")}</FieldLabel>
        <FieldContent>
          <Input
            type="number"
            min={0}
            value={activeStart}
            onChange={(event) =>
              onActiveStartChange(Number(event.target.value))
            }
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("goals.create.ability.activeEnd")}</FieldLabel>
        <FieldContent>
          <Input
            type="number"
            min={0}
            value={activeEnd}
            onChange={(event) => onActiveEndChange(Number(event.target.value))}
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("goals.create.ability.passiveStart")}</FieldLabel>
        <FieldContent>
          <Input
            type="number"
            min={0}
            value={passiveStart}
            onChange={(event) =>
              onPassiveStartChange(Number(event.target.value))
            }
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("goals.create.ability.passiveEnd")}</FieldLabel>
        <FieldContent>
          <Input
            type="number"
            min={0}
            value={passiveEnd}
            onChange={(event) => onPassiveEndChange(Number(event.target.value))}
          />
        </FieldContent>
      </Field>
      {costingSupported ? (
        <div
          className="col-span-2 grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-ability-preview"
        >
          <p className="font-medium">{t("goals.create.previewTitle")}</p>
          {missingUpgrades.length ? (
            <ul className="grid gap-0.5 text-muted-foreground">
              {missingUpgrades.map((entry) => (
                <li key={entry.id}>
                  {entry.label} × {entry.missing}
                </li>
              ))}
            </ul>
          ) : null}
          {estimate && estimate.status !== "Blocked" ? (
            <>
              <p className="font-medium">
                {t("goals.create.previewEstimate", {
                  days: estimate.days,
                  date: estimate.date,
                })}
              </p>
              <p className="font-medium">
                {t("goals.create.previewEnergy", {
                  energy: estimate.energyTotal,
                  raids: estimate.raidsTotal,
                  dailyEnergy,
                })}
              </p>
            </>
          ) : null}
        </div>
      ) : (
        <p className="col-span-2 text-xs text-muted-foreground">
          {t("goals.create.characterAbilityCostUnsupported")}
        </p>
      )}
    </div>
  )
}
