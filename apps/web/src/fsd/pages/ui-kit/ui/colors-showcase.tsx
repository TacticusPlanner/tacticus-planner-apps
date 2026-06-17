import { useEffect, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"

import { oklchToHex } from "../lib/color"
import { colorTokenGroups } from "../model/ui-kit"
import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

const colorTokens = colorTokenGroups.flatMap((group) => group.tokens)

function resolveCssVariableValue(
  styles: CSSStyleDeclaration,
  value: string,
  seen = new Set<string>()
) {
  const trimmedValue = value.trim()
  const match = trimmedValue.match(/^var\((--[^,)]+)\)$/)

  if (!match || seen.has(match[1])) {
    return trimmedValue
  }

  seen.add(match[1])

  return resolveCssVariableValue(
    styles,
    styles.getPropertyValue(match[1]),
    seen
  )
}

function readColorValues() {
  const styles = getComputedStyle(document.documentElement)

  return Object.fromEntries(
    colorTokens.map((token) => [
      token.cssVariable,
      oklchToHex(
        resolveCssVariableValue(
          styles,
          styles.getPropertyValue(token.cssVariable)
        )
      ),
    ])
  )
}

function getTokenId(name: string) {
  return name.toLowerCase().replaceAll(" ", "-")
}

export function ColorsShowcase() {
  const [colorValues, setColorValues] = useState<Record<string, string>>(() => {
    if (typeof document === "undefined") {
      return {}
    }

    return readColorValues()
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColorValues(readColorValues())
    })

    observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <UiKitShowcaseCard
      description="Semantic theme tokens and planner domain colors from the active theme."
      title="Theme tokens"
    >
      <div className="flex flex-col gap-6">
        {colorTokenGroups.map((group) => (
          <section
            className="flex flex-col gap-3"
            data-testid={`color-group-${getTokenId(group.name)}`}
            key={group.name}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">{group.name}</h3>
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.tokens.map((token) => (
                <div
                  className="flex flex-col gap-2 rounded-2xl border p-3"
                  data-testid={`color-token-${getTokenId(token.name)}`}
                  key={token.cssVariable}
                >
                  <div
                    className="h-16 rounded-xl border border-border/50"
                    style={{ backgroundColor: `var(${token.cssVariable})` }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-sm font-medium">{token.name}</span>
                      <code className="text-xs text-muted-foreground">
                        {colorValues[token.cssVariable] ?? token.cssVariable}
                      </code>
                    </div>
                    <Badge variant="outline">
                      {token.utility?.replace("bg-", "") ?? token.cssVariable}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </UiKitShowcaseCard>
  )
}
