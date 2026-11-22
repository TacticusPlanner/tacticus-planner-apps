import type { HreObjective, HreObjectiveKind } from "@/entities/hre-mission"

/** The token mode each "play battles in" objective names, for the hint's `{[GAME_MODE]}`. */
const GAME_MODE_OF: Partial<Record<HreObjectiveKind, string>> = {
  arenaBattles: "arena",
  guildRaids: "guildRaid",
  onslaught: "onslaught",
  salvageRuns: "salvageRun",
}

/** The objective's token mode (`arena`, `guildRaid`, …), or undefined for any other kind. */
export const hintGameMode = (objective: HreObjective) =>
  GAME_MODE_OF[objective.kind]

/**
 * The objective's in-game hint: the first of its hint keys that `lookup` finds (the served loca key,
 * then the guesses from the task name), with its `{[NAME]}` placeholders filled from `values`. A
 * placeholder without a value stays as written; `<style>` markup is kept for the renderer. Undefined
 * when no key has a hint.
 */
export function objectiveHint(
  objective: HreObjective,
  lookup: (key: string) => string | undefined,
  values: Readonly<Record<string, string>>
): string | undefined {
  for (const key of objective.hintKeys ?? []) {
    const template = lookup(key)
    if (template)
      return template.replaceAll(
        /\{\[(\w+)\]\}/g,
        (placeholder, name: string) =>
          name in values ? (values[name] ?? placeholder) : placeholder
      )
  }
  return undefined
}

/**
 * Reads a hint key in the first of `languages` that has it, then English. `languages` is i18next's
 * resolved chain ("es-ES", "es", …), so a region locale finds the language's hints.
 */
export function hintLookup(
  languages: readonly string[],
  getResource: (language: string, key: string) => unknown
) {
  return (key: string): string | undefined => {
    for (const language of [...languages, "en"]) {
      const hint = getResource(language, key)
      if (typeof hint === "string") return hint
    }
    return undefined
  }
}
