import { useEffect, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"

import { oklchToHex } from "../lib/color"
import { colorTokens } from "../model/ui-kit"
import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

function readColorValues() {
  const styles = getComputedStyle(document.documentElement)

  return Object.fromEntries(
    colorTokens.map((token) => [
      token.cssVariable,
      oklchToHex(styles.getPropertyValue(token.cssVariable)),
    ])
  )
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
      description="Semantic tokens from the active shadcn theme."
      title="Theme tokens"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {colorTokens.map((token) => (
          <div
            className="flex flex-col gap-2 rounded-2xl border p-3"
            data-testid={`color-token-${token.name.toLowerCase().replace(" ", "-")}`}
            key={token.name}
          >
            <div className={`h-16 rounded-xl ${token.className}`} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium">{token.name}</span>
                <code className="text-xs text-muted-foreground">
                  {colorValues[token.cssVariable] ?? token.cssVariable}
                </code>
              </div>
              <Badge variant="outline">
                {token.className.replace("bg-", "")}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </UiKitShowcaseCard>
  )
}
