import type { Rarity } from "@workspace/game-domain"

import {
  parseAbilityText,
  resolveVariable,
  type AbilityContext,
  type AstNode,
  type VariableNode,
} from "./ability-text"
import type { AbilityTextEntry } from "./use-ability-text"

export type AbilitySeries = {
  /** Variable names, one for a single value, two (min, max) for a range. */
  names: string[]
  /** The words that follow the value in the rules text ("Psychic Damage"), for the chart title. */
  label: string
  /** Per level 1…`levels`, one value for a single value, `[min, max]` for a range. */
  values: number[][]
  /** The same at every level: not charted, described in one line instead. */
  constant: boolean
}

type Token =
  { kind: "var"; node: VariableNode } | { kind: "text"; text: string }

/** The description's variables and text, in reading order, with styling flattened away. */
function flatten(nodes: AstNode[], out: Token[] = []): Token[] {
  for (const node of nodes) {
    if (node.type === "text") out.push({ kind: "text", text: node.value })
    else if (node.type === "var") out.push({ kind: "var", node })
    else flatten(node.children, out)
  }
  return out
}

const RANGE_SEPARATOR = /^\s*[-–]\s*$/

const LINKING_WORD = /^(by|to|of|for|with|and|up|is|at|a|an|the)$/i

const capitalise = (text: string) =>
  text ? text[0].toLocaleUpperCase() + text.slice(1) : text

/**
 * What a value measures, for its chart title: the words that follow it in the rules text ("349–419
 * Psychic Damage"), else the words just before it ("reduces incoming Psychic Damage by 101"), without
 * the linking word. Empty when the text gives neither.
 */
function labelFor(tokens: Token[], first: number, last: number): string {
  const next = tokens[last + 1]
  if (next?.kind === "text") {
    const words = next.text
      .split(/[.,;:\n(]/)[0]
      .trim()
      .split(/\s+/)
      .filter((word) => /\p{L}/u.test(word))
    if (words.length > 0) return capitalise(words.slice(0, 4).join(" "))
  }
  // Styling splits a sentence into several text tokens; join the ones since the previous value.
  let before = ""
  for (let index = first - 1; index >= 0; index--) {
    const token = tokens[index]
    if (token.kind !== "text") break
    before = token.text + before
  }
  if (before) {
    const words = before
      .split(/[.,;:\n)]/)
      .at(-1)!
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    while (words.length > 0 && LINKING_WORD.test(words.at(-1)!)) words.pop()
    if (words.length > 0) return capitalise(words.slice(-3).join(" "))
  }
  return ""
}

/**
 * The level-dependent values of an ability's rules text, in reading order, resolved exactly as the
 * rendered text resolves them (rarity scaling and `name[i]` splits included), so a chart never
 * disagrees with the text above it. A `{min}-{max}` pair becomes one range series. Values that
 * aren't numbers at every level (names, damage types) are left out. Each variable appears once.
 */
export function buildAbilitySeries(
  entry: AbilityTextEntry,
  rarity: Rarity,
  levels = 60
): AbilitySeries[] {
  const context = (level: number): AbilityContext => ({
    level,
    variables: entry.variables,
    constants: entry.constants,
    scaledVariableNames: new Set(entry.scaled),
    rarity,
    unitName: "",
    factionId: "",
  })
  const numericSeries = (node: VariableNode): number[] | undefined => {
    if (!node.name || node.isUnitName) return undefined
    if (!(node.name in entry.variables)) return undefined
    const values: number[] = []
    for (let level = 1; level <= levels; level++) {
      const value = Number(resolveVariable(node, context(level)))
      if (!Number.isFinite(value)) return undefined
      values.push(value)
    }
    return values
  }
  const keyOf = (node: VariableNode) =>
    node.splitIndex === undefined
      ? node.name
      : `${node.name}[${node.splitIndex}]`

  const tokens = flatten(parseAbilityText(entry.description))
  const seen = new Set<string>()
  const series: AbilitySeries[] = []

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.kind !== "var" || seen.has(keyOf(token.node))) continue
    const first = numericSeries(token.node)
    if (!first) continue
    seen.add(keyOf(token.node))

    const separator = tokens[index + 1]
    const second = tokens[index + 2]
    if (
      separator?.kind === "text" &&
      RANGE_SEPARATOR.test(separator.text) &&
      second?.kind === "var"
    ) {
      const max = numericSeries(second.node)
      if (max) {
        seen.add(keyOf(second.node))
        const values = first.map((min, level) => [min, max[level]])
        series.push({
          names: [keyOf(token.node), keyOf(second.node)],
          label: labelFor(tokens, index, index + 2),
          values,
          constant: values.every(
            ([min, top]) => min === values[0][0] && top === values[0][1]
          ),
        })
        index += 2
        continue
      }
    }

    series.push({
      names: [keyOf(token.node)],
      label: labelFor(tokens, index, index),
      values: first.map((value) => [value]),
      constant: first.every((value) => value === first[0]),
    })
  }
  return series
}

/** The series to chart: the first `limit` that change with level. */
export function chartedSeries(
  series: AbilitySeries[],
  limit = 2
): AbilitySeries[] {
  return series.filter((entry) => !entry.constant).slice(0, limit)
}
