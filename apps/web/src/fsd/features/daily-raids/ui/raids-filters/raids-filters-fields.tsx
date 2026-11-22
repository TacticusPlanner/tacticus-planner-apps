import type { ReactNode } from "react"

import { Field, FieldLabel } from "@workspace/ui/components/field"

import { FilterLabelIcon } from "@/shared/ui"
import type { FilterLabelIconKind } from "@/shared/ui"

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
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  )
}

export function LabeledField({
  label,
  icon,
  className,
  children,
}: {
  label: string
  /** The filter's game icon, before the label (ui-style-guide rule 3). */
  icon: FilterLabelIconKind
  className?: string
  children: ReactNode
}) {
  return (
    <Field className={className}>
      <FieldLabel className="items-center">
        <FilterLabelIcon kind={icon} />
        {label}
      </FieldLabel>
      {children}
    </Field>
  )
}
