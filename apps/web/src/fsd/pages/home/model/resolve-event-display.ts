import type { TFunction } from "i18next"

import type { EventEntryViewModel } from "./events-calendar.types"

function stringParam(
  parameters: Record<string, unknown> | null,
  key: string
): string | undefined {
  const value = parameters?.[key]
  return typeof value === "string" ? value : undefined
}

function numberParam(
  parameters: Record<string, unknown> | null,
  key: string
): number | undefined {
  const value = parameters?.[key]
  return typeof value === "number" ? value : undefined
}

function booleanParam(
  parameters: Record<string, unknown> | null,
  key: string
): boolean | undefined {
  const value = parameters?.[key]
  return typeof value === "boolean" ? value : undefined
}

/**
 * Every event's display name is resolved from its `definitionId` (and, for a few parameterized types,
 * a faction/character/iteration/season id carried in `parameters`, or a `derived*` field) — never from
 * a stored display string. Mirrors the `t(\`characters:${id}\`, { defaultValue: id })` id-based
 * resolution pattern already used elsewhere in this app (e.g. Character Lookup), reusing the existing
 * `characters`/`factions` namespaces so events referencing a character, MoW, or faction don't need their
 * own translated copy of those names. Suffixes chain (not early-return) so e.g. a Quest entry shows both
 * its featured character and its opposing faction.
 */
export function resolveEventDisplayName(
  t: TFunction<["events", "characters", "factions", "progression"]>,
  entry: EventEntryViewModel
): string {
  let name = t(`events:definitions.${entry.definitionId}`, {
    defaultValue: entry.definitionId,
  })

  // Event/season numbers come right after the base name ("Battle Pass Season 40", "Campaign Event 17"),
  // before who/what is featured, so a featured character reads as "Battle Pass Season 40: Ramus" rather
  // than burying the number at the end behind the character.
  if (entry.derivedEventNumber !== undefined) {
    name = t("events:withEventNumber", {
      name,
      number: entry.derivedEventNumber,
    })
  }
  if (entry.derivedSeasonNumber !== undefined) {
    name = t("events:withSeason", { name, season: entry.derivedSeasonNumber })
  }

  const targetFactionId = stringParam(entry.parameters, "targetFactionId")
  if (targetFactionId) {
    name = t("events:withFaction", {
      name,
      faction: t(`factions:${targetFactionId}`, {
        defaultValue: targetFactionId,
      }),
    })
  }

  const featuredCharacterId = stringParam(
    entry.parameters,
    "featuredCharacterId"
  )
  if (featuredCharacterId) {
    name = t("events:withCharacter", {
      name,
      character: t(`characters:${featuredCharacterId}`, {
        defaultValue: featuredCharacterId,
      }),
    })
  }

  const featuredMowId = stringParam(entry.parameters, "featuredMowId")
  if (featuredMowId) {
    name = t("events:withMow", {
      name,
      mow: t(`characters:${featuredMowId}`, { defaultValue: featuredMowId }),
    })
  }

  const enemyFactionId = stringParam(entry.parameters, "enemyFactionId")
  if (enemyFactionId) {
    name = t("events:withEnemyFaction", {
      name,
      faction: t(`factions:${enemyFactionId}`, {
        defaultValue: enemyFactionId,
      }),
    })
  }

  const version = stringParam(entry.parameters, "version")
  if (version) {
    name = t("events:withVersion", { name, version })
  }

  const iterationNumber = numberParam(entry.parameters, "iterationNumber")
  if (iterationNumber !== undefined) {
    name = t("events:withIteration", { name, iteration: iterationNumber })
  }

  const weekNumber = numberParam(entry.parameters, "weekNumber")
  if (weekNumber !== undefined) {
    name = t("events:withWeek", { name, week: weekNumber })
  }

  const rarityCapId = stringParam(entry.parameters, "rarityCap")
  if (rarityCapId) {
    name = t("events:withRarityCap", {
      name,
      rarityCap: t(`progression:rarities.${rarityCapId}`, {
        defaultValue: rarityCapId,
      }),
    })
  }

  const includesMow = booleanParam(entry.parameters, "includesMow")
  if (includesMow !== undefined) {
    name = t(includesMow ? "events:withMowFlag" : "events:withNoMowFlag", {
      name,
    })
  }

  // Campaign Event slots debut new campaign content; Incursion slots debut a new/revamped MoW — same
  // underlying `newContentDebut` flag, worded per definition since the two mean different things.
  if (booleanParam(entry.parameters, "newContentDebut")) {
    if (entry.definitionId === "campaign-event") {
      name = t("events:withNewCampaign", { name })
    } else if (entry.definitionId === "incursion") {
      name = t("events:withNewMow", { name })
    }
  }

  return name
}
