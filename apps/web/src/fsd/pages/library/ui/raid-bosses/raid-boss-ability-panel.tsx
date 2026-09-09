import { useTranslation } from "react-i18next"
import { type Rarity } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import {
  useRaidBossLabels,
  useRaidBossText,
  type RaidBoss,
  type RaidBossStatStep,
} from "@/entities/raid-boss"
import { AbilityText } from "@/shared/ability-text"

// Internal engine ability with no player-facing description — V1 hides it the same way.
const HIDDEN_ABILITY_IDS = new Set(["GuildBossRunAway"])

function AbilityGroup({
  label,
  ids,
  level,
  rarity,
  unitName,
  factionId,
}: {
  label: string
  ids: string[] | undefined
  level: number
  rarity: Rarity
  unitName: string
  factionId: string
}) {
  const { abilityName } = useRaidBossLabels()
  const { abilityText } = useRaidBossText()
  const shown = (ids ?? []).filter((id) => !HIDDEN_ABILITY_IDS.has(id))
  if (shown.length === 0) return null

  return (
    <div>
      <h4 className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </h4>
      <div className="flex flex-col gap-2">
        {shown.map((id) => {
          const text = abilityText(id)
          return (
            <div key={id} className="flex flex-col gap-1">
              <Badge variant="secondary" className="self-start">
                {abilityName(id)}
              </Badge>
              {text ? (
                <AbilityText
                  text={text.description}
                  level={level}
                  variables={text.variables}
                  constants={text.constants}
                  scaledVariableNames={text.scaled}
                  rarity={rarity}
                  unitName={unitName}
                  factionId={factionId}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The Abilities and Traits panels of the detail view, with each id's rules-text resolved and its
 *  `{[variable]}` tokens scaled to the selected step's ability level. */
export function RaidBossAbilityPanel({
  unit,
  step,
  name,
}: {
  unit: RaidBoss
  step: RaidBossStatStep
  name: string
}) {
  const { t } = useTranslation("library")
  const { traitName, hasTraitName } = useRaidBossLabels()
  const { traitText } = useRaidBossText()

  const rarity = step.baseRarity as Rarity
  const traitIds = (unit.traitIds ?? []).filter(hasTraitName)
  const hasAbilities =
    (unit.activeAbilityIds?.length ?? 0) +
      (unit.passiveAbilityIds?.length ?? 0) +
      (unit.relicAbilityIds?.length ?? 0) >
    0

  return (
    <>
      {hasAbilities ? (
        <div data-testid="raid-boss-abilities">
          <h3 className="mb-1 text-sm font-semibold">
            {t("raidBosses.abilities")}
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            {t("raidBosses.abilityTextLevelCaption", {
              level: step.abilityLevel,
            })}
          </p>
          <div className="flex flex-col gap-3">
            <AbilityGroup
              label={t("raidBosses.abilitiesActive")}
              ids={unit.activeAbilityIds}
              level={step.abilityLevel}
              rarity={rarity}
              unitName={name}
              factionId={unit.factionId}
            />
            <AbilityGroup
              label={t("raidBosses.abilitiesPassive")}
              ids={unit.passiveAbilityIds}
              level={step.abilityLevel}
              rarity={rarity}
              unitName={name}
              factionId={unit.factionId}
            />
            <AbilityGroup
              label={t("raidBosses.abilitiesRelic")}
              ids={unit.relicAbilityIds}
              level={step.abilityLevel}
              rarity={rarity}
              unitName={name}
              factionId={unit.factionId}
            />
          </div>
        </div>
      ) : null}

      {traitIds.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">
            {t("raidBosses.traits")}
          </h3>
          <div className="flex flex-col gap-3">
            {traitIds.map((id) => {
              const text = traitText(id)
              return (
                <div key={id} className="flex flex-col gap-1">
                  <Badge variant="outline" className="self-start">
                    {traitName(id)}
                  </Badge>
                  {text ? (
                    <AbilityText
                      text={text.description}
                      level={1}
                      variables={text.variables}
                      rarity={rarity}
                      unitName={name}
                      factionId={unit.factionId}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </>
  )
}
