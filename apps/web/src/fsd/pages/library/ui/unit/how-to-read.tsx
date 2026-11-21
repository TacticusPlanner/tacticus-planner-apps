import type { ReactNode } from "react"

/** A chart's reading notes, closed until opened (copy rule 3: explanations collapsed by default). */
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
      <summary className="cursor-pointer font-medium text-foreground">
        {summary}
      </summary>
      <p className="mt-1">{children}</p>
    </details>
  )
}
