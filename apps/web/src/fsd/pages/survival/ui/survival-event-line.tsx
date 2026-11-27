import { useTranslation } from "react-i18next"
import { characterIcon, factionIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import type {
  SurvivalEvent,
  SurvivalEventStatus,
} from "../model/survival-event"
import {
  EntityIcon,
  HintTrigger,
  HowToRead,
  formatEventWindow,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

/**
 * One line under the switcher: the featured hero, the dates (or "Dates to be announced"), the allowed
 * factions as icons named in hints, and the Machine of War rule.
 */
export function SurvivalEventLine({
  event,
  status,
}: {
  event: SurvivalEvent
  status: SurvivalEventStatus
}) {
  const { t, i18n } = useTranslation(["survival", "factions"])
  const unitName = useUnitName()
  const hero = unitName("Character", event.featuredCharacterId)
  const { rules } = event
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm"
      data-testid="survival-event-line"
    >
      <span className="flex items-center gap-2">
        <EntityIcon
          alt=""
          size="portrait-sm"
          src={characterIcon(event.featuredCharacterId as UnitId)}
        />
        <span>{t("line.featured", { hero })}</span>
      </span>
      <span className="text-muted-foreground" data-testid="survival-dates">
        {event.startUtc !== null && event.endUtc !== null
          ? formatEventWindow(
              { startUtc: event.startUtc, endUtc: event.endUtc },
              i18n.language
            )
          : t("line.tba")}
        {status === "running" ? ` · ${t("line.running")}` : null}
      </span>
      <span className="flex flex-wrap items-center gap-1">
        <span className="text-muted-foreground">{t("line.factions")}</span>
        <ul className="contents" data-testid="survival-factions">
          {rules.allowedFactionIds.map((faction) => {
            const name = t(`factions:${faction}`, { defaultValue: faction })
            return (
              <li key={faction}>
                <HintTrigger label={name}>
                  <EntityIcon alt="" size="icon" src={factionIcon(faction)} />
                </HintTrigger>
              </li>
            )
          })}
        </ul>
      </span>
      <span className="text-muted-foreground">
        {rules.mowsAllowed ? t("line.mows") : t("line.noMows")}
      </span>
    </div>
  )
}

/** "How this event works", closed: stamina, Stat Boost, Last Stand, the summon and enemy rarity-ups. */
export function HowEventWorks({ event }: { event: SurvivalEvent }) {
  const { t, i18n } = useTranslation(["survival", "progression"])
  const unitName = useUnitName()
  const { rules } = event
  const list = new Intl.ListFormat(i18n.language, { type: "conjunction" })
  const stats = list.format(
    rules.statBoostStats.map((stat) =>
      t(`survival:stats.${stat}` as never, { defaultValue: stat })
    )
  )
  const levels = rules.summon?.levels.map((level) => level.abilityLevel) ?? []
  return (
    <HowToRead
      data-testid="survival-how-it-works"
      summary={t("survival:howItWorks.summary")}
    >
      <ul className="flex list-disc flex-col gap-1 pl-5">
        <li>
          {t("survival:howItWorks.team", {
            count: rules.maxCharacters,
            hero: unitName("Character", event.featuredCharacterId),
          })}
        </li>
        <li>
          {t("survival:howItWorks.stamina", {
            start: rules.stamina.start,
            max: rules.stamina.max,
            amount: rules.stamina.regenAmount,
            hours: Math.round(rules.stamina.regenSeconds / 3600),
          })}
        </li>
        {rules.statBoostPct > 0 ? (
          <li>
            {t("survival:howItWorks.statBoost", {
              pct: rules.statBoostPct,
              stats,
            })}
          </li>
        ) : null}
        {rules.lastStand ? (
          <li>
            {t("survival:howItWorks.lastStand", {
              buff: t(`survival:buffs.${rules.lastStand.buffId}` as never, {
                defaultValue: rules.lastStand.buffId,
              }),
              multiplier: rules.lastStand.strategicMultiplier,
            })}
          </li>
        ) : null}
        {rules.summon ? (
          <li>
            {t("survival:howItWorks.summon", {
              unit: t(`survival:summons.${rules.summon.unitId}` as never, {
                defaultValue: rules.summon.unitId,
              }),
              min: Math.min(...levels),
              max: Math.max(...levels),
            })}
          </li>
        ) : null}
        {rules.persistentRarityUps.map((up) => (
          <li key={up.wave}>
            {t("survival:howItWorks.rarityUp", {
              rarity: t(`progression:rarities.${up.rarity}` as never, {
                defaultValue: up.rarity,
              }),
              wave: up.wave,
            })}
          </li>
        ))}
      </ul>
    </HowToRead>
  )
}
