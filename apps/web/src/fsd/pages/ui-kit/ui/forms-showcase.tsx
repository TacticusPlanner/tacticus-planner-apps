import { Search } from "lucide-react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group"
import { Textarea } from "@workspace/ui/components/textarea"

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

export function FormsShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UiKitShowcaseCard title="Fields">
        <FieldGroup data-testid="form-fields">
          <Field>
            <FieldLabel htmlFor="ui-kit-name">Name</FieldLabel>
            <Input id="ui-kit-name" placeholder="Tacticus Planner" />
            <FieldDescription>Use a clear display name.</FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="ui-kit-email">Email</FieldLabel>
            <Input
              aria-invalid
              id="ui-kit-email"
              placeholder="invalid@example"
              type="email"
            />
            <FieldError>Enter a valid email address.</FieldError>
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor="ui-kit-disabled">Disabled</FieldLabel>
            <Input disabled id="ui-kit-disabled" placeholder="Locked value" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ui-kit-notes">Notes</FieldLabel>
            <Textarea id="ui-kit-notes" placeholder="Add context..." />
          </Field>
        </FieldGroup>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Input groups">
        <FieldGroup data-testid="input-groups">
          <Field>
            <FieldLabel htmlFor="ui-kit-search">Search</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                id="ui-kit-search"
                placeholder="Search components"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton>Go</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="ui-kit-summary">Summary</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="ui-kit-summary"
                placeholder="Longer text in a grouped textarea"
                rows={4}
              />
            </InputGroup>
          </Field>
        </FieldGroup>
      </UiKitShowcaseCard>
    </div>
  )
}
