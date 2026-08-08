import type { TFunction } from "i18next"

import type { EventEntryViewModel } from "./events-calendar.types"

function stringParam(
  parameters: Record<string, unknown> | null,
  key: string
): string | undefined {
  const value = parameters?.[key]
  return typeof value === "string" ? value : undefined
}

/**
 * Every event's display name is resolved from its `definitionId` (and, for a few parameterized types,
 * a faction/character id carried in `parameters`) — never from a stored display string. Mirrors the
 * `t(\`characters:${id}\`, { defaultValue: id })` id-based resolution pattern already used elsewhere in
 * this app (e.g. Character Lookup), reusing the existing `characters`/`factions` namespaces so events
 * referencing a character or faction don't need their own translated copy of those names.
 */
export function resolveEventDisplayName(
  t: TFunction<["events", "characters", "factions"]>,
  entry: EventEntryViewModel
): string {
  const baseName = t(`events:definitions.${entry.definitionId}`, {
    defaultValue: entry.definitionId,
  })

  const targetFactionId = stringParam(entry.parameters, "targetFactionId")
  if (targetFactionId) {
    return t("events:withFaction", {
      name: baseName,
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
    return t("events:withCharacter", {
      name: baseName,
      character: t(`characters:${featuredCharacterId}`, {
        defaultValue: featuredCharacterId,
      }),
    })
  }

  const version = stringParam(entry.parameters, "version")
  if (version) {
    return t("events:withVersion", { name: baseName, version })
  }

  return baseName
}
