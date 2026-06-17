import type { ReactNode } from "react"

type UiKitSectionProps = {
  children: ReactNode
  description: string
  id: string
  title: string
}

export function UiKitSection({
  children,
  description,
  id,
  title,
}: UiKitSectionProps) {
  return (
    <section
      className="flex scroll-mt-24 flex-col gap-4"
      data-testid={`ui-kit-section-${id}`}
      id={id}
    >
      <div className="flex max-w-3xl flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
