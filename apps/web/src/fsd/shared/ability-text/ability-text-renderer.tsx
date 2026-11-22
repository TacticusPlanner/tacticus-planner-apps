import { useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import type { Rarity } from "@workspace/game-domain"

import {
  ABILITY_COLORS,
  FACTION_COLORS,
  getStyleSpec,
  parseAbilityText,
  resolveDynamicStyle,
  resolveI2p,
  resolveVariable,
} from "./ability-text"
import type {
  AbilityContext,
  AstNode,
  StyledNode,
  VariableNode,
} from "./ability-text"
import { EntityIcon } from "../ui"
import { useRarityFactor } from "./rarity-factor"
import { styleIcon } from "./style-icon"

// Ported from V1 `ability-text-renderer.tsx`. Styled tokens keep their color / underline / italic, and
// a token whose style names a game thing (a damage type, trait, faction, alliance, stat, status effect
// or hex) gets that thing's inline icon in front, as in the game. The icon is decorative: the word
// after it names the same thing.

// Level-dependent values, highlighted on request (unit pages): emphasis only, the number is the
// content.
const HIGHLIGHT_CLASS = "rounded-sm bg-hl px-1 font-semibold tabular-nums"

function renderVariable(
  node: VariableNode,
  context: AbilityContext,
  inheritStyle: boolean,
  highlight: boolean
): ReactNode {
  if (node.isUnitName) {
    if (inheritStyle) return context.unitName
    const color = FACTION_COLORS[context.factionId] ?? ABILITY_COLORS.stat
    return <span style={{ color }}>{context.unitName}</span>
  }
  const value = resolveVariable(node, context)
  if (value === undefined) return undefined
  if (highlight && node.name in context.variables)
    return <strong className={HIGHLIGHT_CLASS}>{value}</strong>
  if (inheritStyle) return value
  return <span style={{ color: ABILITY_COLORS.stat }}>{value}</span>
}

function renderStyled(
  node: StyledNode,
  context: AbilityContext,
  keyPrefix: string,
  highlight: boolean
): ReactNode {
  const styleName = node.isDynamic
    ? resolveDynamicStyle(node.styleName, context.constants)
    : node.styleName
  const spec = getStyleSpec(styleName)
  const children = renderNodes(
    node.children,
    context,
    keyPrefix,
    true,
    highlight
  )

  const icon = styleIcon(styleName)
  const iconNode = icon ? (
    <EntityIcon
      size="inline"
      src={icon}
      alt=""
      className="mr-0.5 inline-block align-text-bottom"
    />
  ) : null

  if (!spec) {
    return (
      <span key={keyPrefix}>
        {iconNode}
        {children}
      </span>
    )
  }

  const outerStyle: CSSProperties = {}
  if (spec.gradient) {
    outerStyle.backgroundImage = spec.gradient
    outerStyle.WebkitBackgroundClip = "text"
    outerStyle.WebkitTextFillColor = "transparent"
    outerStyle.backgroundClip = "text"
  } else if (spec.color) {
    outerStyle.color = spec.color
  }
  if (spec.italic) outerStyle.fontStyle = "italic"

  const content = spec.overrideText ?? children

  return (
    <span key={keyPrefix} style={outerStyle}>
      {iconNode}
      {spec.underline ? (
        <span
          style={{
            borderBottom: "1px solid currentColor",
            paddingBottom: "1px",
          }}
        >
          {content}
        </span>
      ) : (
        content
      )}
    </span>
  )
}

function renderNodes(
  nodes: AstNode[],
  context: AbilityContext,
  keyPrefix: string,
  inheritStyle = false,
  highlight = false
): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`
    if (node.type === "text") return <span key={key}>{node.value}</span>
    if (node.type === "var")
      return (
        <span key={key}>
          {renderVariable(node, context, inheritStyle, highlight)}
        </span>
      )
    return renderStyled(node, context, key, highlight)
  })
}

export interface AbilityTextProps {
  text: string
  level: number
  variables: Record<string, (string | number)[]>
  constants?: Record<string, string>
  scaledVariableNames?: readonly string[]
  /** Scales rarity-affected values; undefined (still loading) shows them as pending. */
  rarity: Rarity | undefined
  unitName?: string
  factionId?: string
  /** Highlight values that depend on the ability level. */
  highlightValues?: boolean
  className?: string
}

/** Renders an ability / trait description string with its `{[variable]}` tokens resolved for `level`. */
export function AbilityText({
  text,
  level,
  variables,
  constants = {},
  scaledVariableNames = [],
  rarity,
  unitName = "",
  factionId = "",
  highlightValues = false,
  className = "text-xs leading-relaxed text-muted-foreground",
}: AbilityTextProps) {
  const rarityFactor = useRarityFactor(rarity)
  const ast = useMemo(
    () => parseAbilityText(resolveI2p(text, level, variables)),
    [text, level, variables]
  )
  const scaledSet = useMemo(
    () => new Set(scaledVariableNames),
    [scaledVariableNames]
  )
  const context: AbilityContext = {
    level,
    variables,
    constants,
    scaledVariableNames: scaledSet,
    rarityFactor,
    unitName,
    factionId,
  }
  return (
    <p className={className}>
      {renderNodes(ast, context, "root", false, highlightValues)}
    </p>
  )
}
