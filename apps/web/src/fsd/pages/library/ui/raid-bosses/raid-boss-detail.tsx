import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  useRaidBossLabels,
  type RaidBoss,
  type RaidBossEncounter,
} from "@/entities/raid-boss"

export type RaidBossDetailProps = {
  unit: RaidBoss
  name: string
  stepIndex: number
  onStepChange: (index: number) => void
  encounters: RaidBossEncounter[]
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

export function RaidBossDetail({
  unit,
  name,
  stepIndex,
  onStepChange,
  encounters,
  compact = false,
}: RaidBossDetailProps) {
  const { t } = useTranslation("library")
  const { abilityName, traitName } = useRaidBossLabels()

  const ladder = unit.statProgression
  const clamped = Math.min(
    Math.max(stepIndex, 0),
    Math.max(ladder.length - 1, 0)
  )
  const step = ladder[clamped]

  const abilityIds = [
    ...(unit.activeAbilityIds ?? []),
    ...(unit.passiveAbilityIds ?? []),
    ...(unit.relicAbilityIds ?? []),
  ]

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
        <div
          className="flex items-center gap-3"
          data-testid="raid-boss-progression"
        >
          <span className="text-sm text-muted-foreground">
            {t("raidBosses.progression")}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label={t("raidBosses.progressionPrev")}
            disabled={clamped <= 0}
            onClick={() => onStepChange(clamped - 1)}
          >
            −
          </Button>
          <span className="min-w-16 text-center text-sm font-medium tabular-nums">
            {clamped + 1} / {ladder.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label={t("raidBosses.progressionNext")}
            disabled={clamped >= ladder.length - 1}
            onClick={() => onStepChange(clamped + 1)}
          >
            +
          </Button>
        </div>
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

          {abilityIds.length ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {t("raidBosses.abilities")}
              </h3>
              <div className="flex flex-wrap gap-1">
                {abilityIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {abilityName(id)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {unit.traitIds?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {t("raidBosses.traits")}
              </h3>
              <div className="flex flex-wrap gap-1">
                {unit.traitIds.map((id) => (
                  <Badge key={id} variant="outline">
                    {traitName(id)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Separator />

      <div data-testid="raid-boss-encounters">
        <h3 className="mb-2 text-sm font-semibold">
          {t("raidBosses.encounters")}
        </h3>
        {encounters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("raidBosses.noEncounterData")}
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {encounters.map((encounter, index) => (
              <li
                key={`${encounter.encounterIndex}-${index}`}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {t("raidBosses.encounterType", {
                      type: humanizeToken(encounter.encounterType),
                    })}
                  </Badge>
                  {encounter.disallowedFactionIds.map((factionId) => (
                    <Badge key={factionId} variant="secondary">
                      {t("raidBosses.disallowed", {
                        faction: humanizeToken(factionId),
                      })}
                    </Badge>
                  ))}
                </div>

                {encounter.fieldNpcIds.length ? (
                  <p className="mb-2 text-muted-foreground">
                    {t("raidBosses.fieldEnemies")}:{" "}
                    {encounter.fieldNpcIds.map(humanizeToken).join(", ")}
                  </p>
                ) : null}

                {encounter.modifiers.length ? (
                  <ul className="flex flex-col gap-1">
                    {encounter.modifiers.map((modifier, modifierIndex) => (
                      <li
                        key={modifierIndex}
                        className="flex justify-between gap-3"
                      >
                        <span className="text-muted-foreground">
                          {t("raidBosses.atHpLost", {
                            hpLost: modifier.hpLost,
                          })}
                        </span>
                        <span className="font-medium">
                          {describeModifier(modifier)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    {t("raidBosses.noModifiers")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
