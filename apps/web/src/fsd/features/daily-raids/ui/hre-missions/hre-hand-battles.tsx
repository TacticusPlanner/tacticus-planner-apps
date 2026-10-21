import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

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
 * ability uses, lineup wins): raids count none of them. Notes say why, which nodes are kept, that
 * Arena and Onslaught battles count too, and whether the counts are estimates or open-ended.
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
  const parts = [
    t("raids.battles.note"),
    notes.slots ? t("raids.battles.slots", { slots: notes.slots }) : null,
    notes.alliance
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
  ].filter((part): part is string => !!part)
  return (
    <div className="space-y-2" data-testid="hre-battles">
      <h3 className="font-medium">{t("raids.battles.title")}</h3>
      <p
        className="text-sm text-muted-foreground"
        data-testid="hre-battles-note"
      >
        {parts.join(" ")}
      </p>
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
                {t("raids.battleCount", { count: plan.totalBattles })}
              </Badge>
              <Badge variant="outline">
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
