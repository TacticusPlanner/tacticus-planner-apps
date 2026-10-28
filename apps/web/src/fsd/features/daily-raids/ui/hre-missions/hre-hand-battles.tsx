import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { battleGlyphIcon, energyIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { MissionBattlesPlan } from "../../model/mission-raids"
import { RaidRows, type RaidRowsView } from "./hre-raids-extras"

/** How the HRE page words the battles to fight by hand. */
export type HreHandBattlesNotes = {
  /** Only nodes with this many deployment slots. */
  slots?: number
  /** The localized alliance the nodes are kept to. */
  alliance: string | null
  /** The localized faction the nodes are kept to (the featured hero's). */
  heroFaction?: string | null
  /** The localized faction whose enemies the nodes must have. */
  faction: string | null
  preferLightning: boolean
  countsAsWins: boolean
}

/**
 * The battles to fight by hand for the current mission's manual objectives (kills, damage, healing,
 * ability uses, lineup wins): raids count none of them. One visible line says why; "Node rules"
 * folds the rest: which nodes are kept, that Arena and Onslaught battles count too, and whether the
 * counts are estimates or open-ended.
 */
export function HreHandBattles({
  plan,
  notes,
  view,
}: {
  plan: MissionBattlesPlan
  notes: HreHandBattlesNotes
  view: RaidRowsView
}) {
  const { t } = useTranslation("hre")
  // The hero's faction rule already implies the alliance rule, so only one of them is listed.
  const rules = [
    notes.slots ? t("raids.battles.slots", { slots: notes.slots }) : null,
    notes.alliance && !notes.heroFaction
      ? t("raids.battles.alliance", { alliance: notes.alliance })
      : null,
    notes.heroFaction
      ? t("raids.battles.heroFaction", { faction: notes.heroFaction })
      : null,
    notes.faction
      ? t("raids.battles.faction", { faction: notes.faction })
      : null,
    notes.preferLightning ? t("raids.battles.lightning") : null,
    notes.countsAsWins ? t("raids.battles.countsAsWins") : null,
    plan.openEnded ? t("raids.battles.openEnded") : t("raids.battles.estimate"),
    t("raids.battles.modes"),
  ].filter((rule): rule is string => !!rule)
  return (
    <div className="space-y-2" data-testid="hre-battles">
      <h3 className="font-medium">{t("raids.battles.title")}</h3>
      <p
        className="text-sm text-muted-foreground"
        data-testid="hre-battles-note"
      >
        {t("raids.battles.note")}
      </p>
      <details className="text-sm" data-testid="hre-battles-rules">
        <summary className="cursor-pointer font-medium">
          {t("raids.battles.rulesTitle")}
        </summary>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </details>
      {plan.rows.length > 0 ? (
        <>
          <RaidRows
            battles
            openEnded={plan.openEnded}
            rows={plan.rows}
            testId="hre-battles-list"
            view={view}
          />
          {plan.openEnded ? null : (
            <div
              className="flex flex-wrap items-center gap-2"
              data-testid="hre-battles-totals"
            >
              <Badge variant="secondary">
                <EntityIcon
                  alt=""
                  className="size-3.5"
                  src={battleGlyphIcon("campaignBattle")}
                />
                {t("raids.battleCount", { count: plan.totalBattles })}
              </Badge>
              <Badge variant="outline">
                <EntityIcon alt="" className="size-3.5" src={energyIcon()} />
                {t("raids.energy", { energy: plan.totalEnergy })}
              </Badge>
              {plan.moreNeeded ? (
                <span
                  className="text-sm text-muted-foreground"
                  data-testid="hre-battles-more"
                >
                  {t("raids.battles.more")}
                </span>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <p
          className="text-sm text-muted-foreground"
          data-testid={`hre-battles-empty-${plan.empty ?? "no-candidates"}`}
        >
          {plan.empty === "no-energy"
            ? t("raids.empty.noEnergy")
            : plan.empty === "no-attempts"
              ? t("raids.empty.noAttempts")
              : t("raids.battles.none")}
        </p>
      )}
    </div>
  )
}
