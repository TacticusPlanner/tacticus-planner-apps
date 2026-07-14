import { useTranslation } from "react-i18next"
import { Field, FieldContent, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"

import { rankOrder, type Progression, type Rank } from "@workspace/game-domain"

import { ProgressionSelect, RankSelect } from "@/shared/ui"

export type MissingUpgrade = { id: string; label: string; missing: number }

/** Target-rank fields + the resource-requirement preview (plan §16 phase 2 — Rank only). */
export function RankGoalFields({
  rankStart,
  rankEnd,
  rankEndOptions,
  rankStartPointFive,
  rankEndPointFive,
  onRankStartChange,
  onRankEndChange,
  onRankStartPointFiveChange,
  onRankEndPointFiveChange,
  missingUpgrades,
}: {
  rankStart: Rank
  rankEnd: Rank
  rankEndOptions: Rank[]
  rankStartPointFive: boolean
  rankEndPointFive: boolean
  onRankStartChange: (rank: Rank) => void
  onRankEndChange: (rank: Rank) => void
  onRankStartPointFiveChange: (value: boolean) => void
  onRankEndPointFiveChange: (value: boolean) => void
  missingUpgrades: MissingUpgrade[]
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <RankSelect
          label={t("goals.create.rank.start")}
          value={rankStart}
          options={[...rankOrder]}
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

      {missingUpgrades.length > 0 ? (
        <div
          className="grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-preview"
        >
          <p className="font-medium">{t("goals.create.previewTitle")}</p>
          <ul className="grid gap-0.5 text-muted-foreground">
            {missingUpgrades.map((entry) => (
              <li key={entry.id}>
                {entry.label} × {entry.missing}
              </li>
            ))}
          </ul>
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
  onProgressionStartChange,
  onProgressionEndChange,
}: {
  progressionStart: Progression
  progressionEnd: Progression
  onProgressionStartChange: (value: Progression) => void
  onProgressionEndChange: (value: Progression) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3">
      <ProgressionSelect
        label={t("goals.create.ascension.start")}
        value={progressionStart}
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
}: {
  activeStart: number
  activeEnd: number
  passiveStart: number
  passiveEnd: number
  onActiveStartChange: (value: number) => void
  onActiveEndChange: (value: number) => void
  onPassiveStartChange: (value: number) => void
  onPassiveEndChange: (value: number) => void
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
      <p className="col-span-2 text-xs text-muted-foreground">
        {t("goals.create.previewUnavailable")}
      </p>
    </div>
  )
}

export function ShardsGoalFields({
  count,
  onCountChange,
}: {
  count: number
  onCountChange: (value: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3">
      <Field>
        <FieldLabel>{t("goals.create.shards.count")}</FieldLabel>
        <FieldContent>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={(event) => onCountChange(Number(event.target.value))}
          />
        </FieldContent>
      </Field>
      <p className="text-xs text-muted-foreground">
        {t("goals.create.previewUnavailable")}
      </p>
    </div>
  )
}
