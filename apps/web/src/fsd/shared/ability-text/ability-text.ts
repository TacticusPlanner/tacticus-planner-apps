import { type Rarity } from "@workspace/game-domain"

// Ported from V1 `3-features/character-details/ability-text.ts`. The parser and variable resolver are
// faithful; the style layer is reduced to color/underline/italic/gradient — V2 does not bundle the
// per-token icon set, and the raid-boss spec accepts a plain-text rendering that still substitutes
// the scaled values (see openspec/changes/add-raid-boss-ability-text).

// ── Colors ───────────────────────────────────────────────────────────────────

export const ABILITY_COLORS = {
  stat: "#2dd4bf",
  buff: "#22c55e",
  debuff: "#dc2626",
  red: "#dc2626",
  purple: "#a855f7",
} as const

const DMG_TYPE_COLORS: Record<string, string> = {
  Acid: "#7dd3fc",
  Bio: "#a855f7",
  Blast: "#f97316",
  Bolter: "#eab308",
  Chain: "#fef08a",
  DirectDamage: "#7dd3fc",
  Energy: "#22c55e",
  Enmitic: "#7dd3fc",
  Eviscerate: "#9ca3af",
  Flame: "#ea580c",
  Gauss: "#22c55e",
  HeavyRound: "#eab308",
  Las: "#dc2626",
  Melta: "#f87171",
  None: "#7dd3fc",
  Particle: "#22c55e",
  Physical: "#60a5fa",
  Piercing: "#e2e8f0",
  Plasma: "#7dd3fc",
  Power: "#38bdf8",
  Projectile: "#eab308",
  Psychic: "#d946ef",
  Pulse: "#7dd3fc",
  Toxic: "#22c55e",
}

// Keys match the id after "Faction_" in a style name.
export const FACTION_COLORS: Record<string, string> = {
  Ultramarines: "#3A81E8",
  Sisterhood: "#9D2C23",
  AdeptusAstartes: "#9D2C23",
  Necrons: "#65C088",
  AstraMilitarum: "#A5A586",
  BlackLegion: "#900405",
  DeathGuard: "#87993D",
  Orks: "#FDE038",
  BlackTemplars: "#5E6265",
  Aeldari: "#A82426",
  Tau: "#F2A55C",
  SpaceWolves: "#94C5DC",
  ThousandSons: "#F9CB00",
  DarkAngels: "#72A67C",
  Tyranids: "#DF6DE6",
  AdeptusMechanicus: "#A82426",
  WorldEaters: "#900405",
  BloodAngels: "#D8001C",
  Genestealers: "#FF8500",
  Custodes: "#E6703D",
  EmperorsChildren: "#DB7093",
  LeaguesOfVotann: "#94C5DC",
  Votann: "#94C5DC",
}

// ── Style spec ────────────────────────────────────────────────────────────────

export interface StyleSpec {
  color?: string
  /** gradient CSS value for background-image (used instead of color) */
  gradient?: string
  underline?: boolean
  italic?: boolean
  /** Override the rendered text content regardless of inner content */
  overrideText?: string
}

const TRAIT_STYLE_NAMES = new Set([
  "Act_Of_Faith",
  "Battle_Fatigue",
  "Big_Target",
  "BlessingsOfKhorne",
  "Camouflage",
  "ContagionsOfNurgle",
  "Daemon",
  "Decoy",
  "Emplacement",
  "FinalJustice",
  "Flying",
  "Heavy_Weapon",
  "Immune",
  "Indirect_Fire",
  "Infiltrate",
  "Living_Metal",
  "Mechanic",
  "Mechanical",
  "Mk_Gravis",
  "Overwatch",
  "PrioritisedEfficiency",
  "Psyker",
  "RangedSpecialist",
  "RapidAssault",
  "Resilient",
  "Steppable",
  "Summon",
  "Suppressive_Fire",
  "Synapse",
  "Teleport_Strike_short",
  "Terminator_Armor",
  "ThrillSeekers",
  "Unstoppable",
  "Vehicle",
])

export function getStyleSpec(styleName: string): StyleSpec | undefined {
  if (styleName.startsWith("Faction_")) {
    const factionId = styleName.slice("Faction_".length)
    return { color: FACTION_COLORS[factionId] ?? "#ffffff" }
  }

  if (styleName.startsWith("Aliance_")) {
    return { color: ABILITY_COLORS.purple, underline: true }
  }

  if (styleName.startsWith("DMG_")) {
    const dmgType = styleName.slice("DMG_".length)
    return {
      color: DMG_TYPE_COLORS[dmgType] ?? "#7dd3fc",
      underline: true,
    }
  }

  if (styleName.startsWith("Stat_")) {
    return { color: ABILITY_COLORS.stat }
  }

  if (styleName === "STAT" || styleName === "Stat" || styleName === "stat") {
    return { color: ABILITY_COLORS.stat }
  }

  if (styleName.startsWith("Debuff_")) {
    return { color: ABILITY_COLORS.debuff, underline: true }
  }

  if (styleName === "BUFF_no_underscore" || styleName.startsWith("Buff_")) {
    return { color: ABILITY_COLORS.buff, underline: true }
  }

  if (styleName === "Effect_Fire" || styleName === "Effect_Ice") {
    return { color: ABILITY_COLORS.red, underline: true }
  }

  if (styleName.startsWith("Tile_")) {
    const purple = new Set(["Tile_Floe", "Tile_Grass", "Tile_Trench"])
    return {
      color: purple.has(styleName) ? ABILITY_COLORS.purple : ABILITY_COLORS.red,
      underline: true,
    }
  }

  if (styleName.startsWith("Resource_")) {
    return { color: ABILITY_COLORS.buff }
  }

  if (TRAIT_STYLE_NAMES.has(styleName)) {
    const color = styleName === "Decoy" ? ABILITY_COLORS.purple : undefined
    return { color, underline: true }
  }

  if (styleName === "Character" || styleName === "MoW") {
    return { color: ABILITY_COLORS.purple }
  }
  if (styleName === "NonCharacter") {
    return { color: ABILITY_COLORS.purple, overrideText: "Non-Character" }
  }
  if (styleName === "Object2") {
    return { color: ABILITY_COLORS.purple, underline: true }
  }
  if (styleName === "Summon2") {
    return { color: FACTION_COLORS.ThousandSons }
  }

  const purpleUnderlineNoIcon = new Set([
    "Charging",
    "Displacement",
    "Healing",
    "NormalAttack",
    "Obliterated",
    "Regenerate",
    "Repairing",
    "FloatingDeath",
    "KEY",
    "Piercing_Ratio",
    "Overkill",
  ])
  if (purpleUnderlineNoIcon.has(styleName)) {
    return {
      color: ABILITY_COLORS.purple,
      underline: true,
      italic: styleName === "FloatingDeath",
    }
  }
  if (styleName === "Cooldown") {
    return { color: ABILITY_COLORS.stat }
  }
  if (styleName === "HexEffect") {
    return { color: ABILITY_COLORS.red, underline: true }
  }
  if (styleName === "Rarity_Mythic") {
    return { gradient: "linear-gradient(to bottom, #f97316, #dc2626)" }
  }
  if (styleName === "__italic__") return { italic: true }

  return undefined
}

// ── i2p (integer-to-plural) preprocessing ────────────────────────────────────

const I2P_PLURAL_MARKER = "[i2p_Plural]"
const I2P_ONE_MARKER = "[i2p_One]"

/** Resolve [i2p_Plural]/[i2p_One] sections by checking the first variable value. */
export function resolveI2p(
  text: string,
  level: number,
  variables: Record<string, (string | number)[]>
): string {
  const pluralIndex = text.indexOf(I2P_PLURAL_MARKER)
  if (pluralIndex === -1) return text
  const oneIndex = text.indexOf(I2P_ONE_MARKER)
  if (oneIndex === -1) return text

  const prefix = text.slice(0, pluralIndex)
  const pluralContent = text.slice(
    pluralIndex + I2P_PLURAL_MARKER.length,
    oneIndex
  )
  const oneContent = text.slice(oneIndex + I2P_ONE_MARKER.length)

  const variableMatch = /\{\[(\w+)\]\}/.exec(text)
  if (!variableMatch) return prefix + pluralContent

  const variableName = variableMatch[1]
  const values = variables[variableName]
  const valueAtLevel = Number(
    values?.[Math.min(level - 1, (values?.length ?? 1) - 1)] ?? 1
  )
  return prefix + (valueAtLevel === 1 ? oneContent : pluralContent)
}

// ── AST ───────────────────────────────────────────────────────────────────────

type TextNode = { type: "text"; value: string }
export type VariableNode = {
  type: "var"
  name: string
  /** numeric index for {[varName[0]]} syntax */
  splitIndex?: number
  /** true for {[UnitName]} */
  isUnitName?: boolean
}
export type StyledNode = {
  type: "styled"
  styleName: string
  isDynamic: boolean
  children: AstNode[]
}
export type AstNode = TextNode | VariableNode | StyledNode

// ── Parser ────────────────────────────────────────────────────────────────────

const TOKEN_RE =
  /(<style="[^"]*">|<style=\{[^}]+\}>|<style=[^"{}<>]+>|<\/style>|<i>|<\/i>|\{[^}]+\})/g

function parseToken(
  raw: string
):
  | { open?: string; isDynamic?: boolean }
  | { close: true }
  | { variable: string } {
  if (raw === "</style>" || raw === "</i>") return { close: true }
  if (raw === "<i>") return { open: "__italic__" }
  const openQuoted = /^<style="([^"]*)">\s*$/.exec(raw)
  if (openQuoted) return { open: openQuoted[1] }
  const openDynamic = /^<style=\{([^}]+)\}>\s*$/.exec(raw)
  if (openDynamic) return { open: openDynamic[1], isDynamic: true }
  const openBare = /^<style=([^"{}<>]+)>\s*$/.exec(raw)
  if (openBare) return { open: openBare[1] }
  const variableMatch = /^\{([^}]+)\}$/.exec(raw)
  if (variableMatch) return { variable: variableMatch[1] }
  return { variable: raw }
}

function parseVariableContent(inner: string): VariableNode {
  if (inner === "[UnitName]")
    return { type: "var", isUnitName: true, name: "UnitName" }
  const splitMatch = /^\[(\w+)\[(\d+)\]\]$/.exec(inner)
  if (splitMatch)
    return {
      type: "var",
      name: splitMatch[1],
      splitIndex: Number(splitMatch[2]),
    }
  if (/^\[S\//.test(inner)) return { type: "var", name: "" }
  const nameMatch = /^\[([^\]]+)\]$/.exec(inner)
  if (nameMatch) return { type: "var", name: nameMatch[1] }
  return { type: "var", name: inner }
}

export function parseAbilityText(text: string): AstNode[] {
  const stack: AstNode[][] = [[]]
  const styleStack: Array<{ styleName: string; isDynamic: boolean }> = []
  let lastIndex = 0

  for (const match of text.matchAll(TOKEN_RE)) {
    const before = text.slice(lastIndex, match.index)
    if (before) stack.at(-1)!.push({ type: "text", value: before })
    lastIndex = match.index! + match[0].length

    const token = parseToken(match[0])

    if ("close" in token) {
      const children = stack.pop()!
      const style = styleStack.pop()
      if (stack.length === 0 || !style) {
        throw new Error(
          `Unmatched </style> tag in "${text}" at index ${lastIndex}`
        )
      }
      stack.at(-1)!.push({ type: "styled", ...style, children })
    } else if ("open" in token) {
      styleStack.push({
        styleName: token.open!,
        isDynamic: token.isDynamic ?? false,
      })
      stack.push([])
    } else {
      stack
        .at(-1)!
        .push(parseVariableContent((token as { variable: string }).variable))
    }
  }

  const trailing = text.slice(lastIndex)
  if (trailing) stack.at(-1)!.push({ type: "text", value: trailing })

  return stack[0]
}

// ── Rarity scaling ────────────────────────────────────────────────────────────

const RARITY_FACTOR: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.2,
  Rare: 1.4,
  Epic: 1.6,
  Legendary: 1.8,
  Mythic: 2,
}

// ── Variable resolver ─────────────────────────────────────────────────────────

/** Matches `DamageProfileType`, `DamageProfileTypeStyle`, `DamageProfileType_2`, etc. */
const DAMAGE_PROFILE_TYPE_RE = /^DamageProfileType(Style)?(_\d+)?$/

export interface AbilityContext {
  level: number
  variables: Record<string, (string | number)[]>
  constants: Record<string, string>
  /** Variable names multiplied by the rarity factor */
  scaledVariableNames: ReadonlySet<string>
  rarity: Rarity
  unitName: string
  factionId: string
}

/** Some generated ability data has trailing whitespace in variable/constant keys; tolerate it. */
function lookupTrimmed<T>(
  record: Record<string, T>,
  name: string
): T | undefined {
  if (record[name] !== undefined) return record[name]
  const match = Object.keys(record).find((key) => key.trim() === name)
  return match === undefined ? undefined : record[match]
}

export function resolveVariable(
  node: VariableNode,
  context: AbilityContext
): string | undefined {
  if (node.isUnitName) return context.unitName
  if (!node.name) return undefined

  const constantValue = lookupTrimmed(context.constants, node.name)
  if (constantValue !== undefined) {
    if (node.splitIndex !== undefined) {
      return String(constantValue).split(",")[node.splitIndex] ?? ""
    }
    return constantValue
  }

  const damageProfileTypeMatch = DAMAGE_PROFILE_TYPE_RE.exec(node.name)
  if (damageProfileTypeMatch && !damageProfileTypeMatch[1]) {
    const suffix = damageProfileTypeMatch[2] ?? ""
    const profile = lookupTrimmed(context.constants, `damageProfile${suffix}`)
    if (profile) {
      const words = profile
        .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
        .replaceAll(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      return words.endsWith("Damage") ? words : `${words} Damage`
    }
  }

  const array = lookupTrimmed(context.variables, node.name)
  if (!array) return `{${node.name}}`
  const rawValue = array[context.level - 1] ?? array.at(-1)
  const asString = String(rawValue)

  const part =
    node.splitIndex === undefined
      ? asString
      : (asString.split(",")[node.splitIndex] ?? "")

  if (context.scaledVariableNames.has(node.name)) {
    const numeric = Number(part)
    if (!Number.isNaN(numeric)) {
      return String(Math.round(numeric * RARITY_FACTOR[context.rarity]))
    }
  }

  return part
}

/** Resolve a dynamic style variable (`DamageProfileTypeStyle(_N)`) → actual style name. */
export function resolveDynamicStyle(
  variableContent: string,
  constants: Record<string, string>
): string {
  const nameMatch = /^\[([^\]]+)\]$/.exec(variableContent)
  const variableName = nameMatch?.[1] ?? variableContent
  const damageProfileStyleMatch = DAMAGE_PROFILE_TYPE_RE.exec(variableName)
  if (damageProfileStyleMatch && damageProfileStyleMatch[1]) {
    const suffix = damageProfileStyleMatch[2] ?? ""
    const profile = lookupTrimmed(constants, `damageProfile${suffix}`)
    return profile ? `DMG_${profile}` : "DMG_Unknown"
  }
  return lookupTrimmed(constants, variableName) ?? variableName
}
