import type { ReactNode } from "react"

/**
 * Notes that explain a figure or a chart (how it is worked out, how to read it), closed until opened:
 * the style guide's copy rule keeps explanations collapsed by default.
 */
export function HowToRead({
  summary,
  children,
  "data-testid": testId,
}: {
  summary: string
  children: ReactNode
  "data-testid"?: string
}) {
  return (
    <details className="text-xs text-muted-foreground" data-testid={testId}>
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        {summary}
      </summary>
      <div className="mt-1 text-sm">{children}</div>
    </details>
  )
}
