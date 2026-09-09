import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table"

import {
  describeModifier,
  humanizeToken,
  type ModifierContext,
  type RaidBoss,
  type RaidBossEncounterModifier,
} from "@/entities/raid-boss"

import { RaidBossAbilityPanel } from "./raid-boss-ability-panel"
import {
  RaidBossAdjustedStats,
  type RaidBossAdjustedProps,
} from "./raid-boss-adjusted-stats"

export type RaidBossDetailProps = {
  unit: RaidBoss
  name: string
  stepIndex: number
  onStepChange: (index: number) => void
  modifierContext: ModifierContext
  fieldEnemyNames: string[]
  /** The boss-only adjusted-stats model + its HP-lost controls; `null` for a prime or no encounter. */
  adjusted: RaidBossAdjustedProps | null
  compact?: boolean
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{label}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {value}
      </TableCell>
    </TableRow>
  )
}

function ModifierRows({
  modifiers,
}: {
  modifiers: RaidBossEncounterModifier[]
}) {
  const { t } = useTranslation("library")

  // The raw `hpLost` values are an `i/N` fraction of an authoring-time HP baseline, not a usable
  // absolute or percent (see V1's `scaleModifierHpLost`). They only order the schedule, so the row
  // shows the positional threshold: the k-th of N modifiers activates at k/N of the unit's HP lost.
  const total = modifiers.length

  return (
    <ul className="flex flex-col gap-1">
      {modifiers.map((modifier, index) => {
        const described = describeModifier(modifier)
        return (
          <li
            key={`${modifier.modifierId}-${index}`}
            className="flex justify-between gap-3"
          >
            <span className="text-muted-foreground">
              {t("raidBosses.atHpLost", {
                hpLost: Math.round((100 * (index + 1)) / total),
              })}
            </span>
            <span className="text-right font-medium">
              {described.kind === "amount"
                ? described.text
                : t(
                    described.direction === "increases"
                      ? "raidBosses.modifierIncreases"
                      : "raidBosses.modifierReduces",
                    { name: described.label }
                  )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function RaidBossDetail({
  unit,
  name,
  stepIndex,
  onStepChange,
  modifierContext,
  fieldEnemyNames,
  adjusted,
  compact = false,
}: RaidBossDetailProps) {
  const { t } = useTranslation("library")

  const ladder = unit.statProgression
  const clamped = Math.min(
    Math.max(stepIndex, 0),
    Math.max(ladder.length - 1, 0)
  )
  const step = ladder[clamped]

  return (
    <div className="flex flex-col gap-6" data-testid="raid-boss-detail">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{name}</h2>
        {unit.isPrimarch ? (
          <Badge variant="secondary">{t("raidBosses.primarch")}</Badge>
        ) : null}
        <Badge variant="outline">{humanizeToken(unit.factionId)}</Badge>
      </div>

      {ladder.length > 1 ? (
        <label
          className="flex flex-wrap items-center gap-3 text-sm"
          data-testid="raid-boss-progression"
        >
          <span className="text-muted-foreground">
            {t("raidBosses.progression")}
          </span>
          <Select
            value={String(clamped)}
            onValueChange={(value) => onStepChange(Number(value))}
          >
            <SelectTrigger
              className="w-56"
              data-testid="raid-boss-progression-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ladder.map((entry, index) => (
                <SelectItem key={index} value={String(index)}>
                  {t("raidBosses.progressionStep", {
                    step: index + 1,
                    total: ladder.length,
                    rarity: humanizeToken(entry.baseRarity),
                    stars: entry.starLevel,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      <div
        className={compact ? "" : "grid gap-6 md:grid-cols-2"}
        data-testid="raid-boss-stats"
      >
        <div>
          <h3 className="mb-2 text-sm font-semibold">
            {t("raidBosses.stats")}
          </h3>
          <Table>
            <TableBody>
              <StatRow
                label={t("raidBosses.health")}
                value={step.health.toLocaleString()}
              />
              <StatRow
                label={t("raidBosses.damage")}
                value={step.damage.toLocaleString()}
              />
              <StatRow
                label={t("raidBosses.armor")}
                value={step.fixedArmor.toLocaleString()}
              />
              <StatRow label={t("raidBosses.rank")} value={step.rank} />
              <StatRow label={t("raidBosses.stars")} value={step.starLevel} />
              <StatRow
                label={t("raidBosses.baseRarity")}
                value={humanizeToken(step.baseRarity)}
              />
              <StatRow
                label={t("raidBosses.abilityLevel")}
                value={step.abilityLevel}
              />
              <StatRow label={t("raidBosses.movement")} value={unit.movement} />
              {step.critChance != null ? (
                <StatRow
                  label={t("raidBosses.critChance")}
                  value={`${Math.round(step.critChance * 100)}%`}
                />
              ) : null}
              {step.critDamage != null ? (
                <StatRow
                  label={t("raidBosses.critDamage")}
                  value={`${Math.round(step.critDamage * 100)}%`}
                />
              ) : null}
              {step.blockChance != null ? (
                <StatRow
                  label={t("raidBosses.blockChance")}
                  value={`${Math.round(step.blockChance * 100)}%`}
                />
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-4">
          {unit.weapons?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {t("raidBosses.weapons")}
              </h3>
              <ul className="flex flex-col gap-1 text-sm">
                {unit.weapons.map((weapon, index) => (
                  <li key={index} className="flex justify-between gap-2">
                    <span>{humanizeToken(weapon.damageProfile)}</span>
                    <span className="text-muted-foreground">
                      {weapon.range != null
                        ? t("raidBosses.rangedHits", {
                            hits: weapon.hits,
                            range: weapon.range,
                          })
                        : t("raidBosses.meleeHits", { hits: weapon.hits })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <RaidBossAbilityPanel
            unit={unit}
            step={step}
            name={name}
            activeModifiers={adjusted?.view.activeModifiers}
          />
        </div>
      </div>

      <Separator />

      {fieldEnemyNames.length ? (
        <div data-testid="raid-boss-field-enemies">
          <h3 className="mb-1 text-sm font-semibold">
            {t("raidBosses.fieldEnemies")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fieldEnemyNames.join(", ")}
          </p>
        </div>
      ) : null}

      <div data-testid="raid-boss-prime-modifiers">
        <h3 className="mb-2 text-sm font-semibold">
          {modifierContext.kind === "boss"
            ? t("raidBosses.primeModifiers")
            : t("raidBosses.modifiers")}
        </h3>

        {modifierContext.kind === "none" ? (
          <p className="text-sm text-muted-foreground">
            {t("raidBosses.noEncounterData")}
          </p>
        ) : modifierContext.kind === "prime" ? (
          modifierContext.modifiers.length ? (
            <ModifierRows modifiers={modifierContext.modifiers} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("raidBosses.noModifiers")}
            </p>
          )
        ) : modifierContext.primes.some((prime) => prime.modifiers.length) ? (
          <ul className="flex flex-col gap-4">
            {modifierContext.primes.map((prime) => (
              <li
                key={prime.unitSetId}
                className="rounded-lg border p-3 text-sm"
              >
                <h4 className="mb-2 font-medium">{prime.name}</h4>
                {prime.modifiers.length ? (
                  <ModifierRows modifiers={prime.modifiers} />
                ) : (
                  <p className="text-muted-foreground">
                    {t("raidBosses.noModifiers")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("raidBosses.noPrimeModifiers")}
          </p>
        )}
      </div>

      {adjusted && adjusted.view.primes.length ? (
        <>
          <Separator />
          <RaidBossAdjustedStats
            unit={unit}
            step={step}
            compact={compact}
            {...adjusted}
          />
        </>
      ) : null}
    </div>
  )
}
