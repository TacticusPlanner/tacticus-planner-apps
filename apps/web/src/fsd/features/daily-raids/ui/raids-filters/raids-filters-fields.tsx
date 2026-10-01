import type { ReactNode } from "react"

import { Field, FieldLabel } from "@workspace/ui/components/field"

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">{children}</div>
    </section>
  )
}

export function LabeledField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Field>
  )
}
