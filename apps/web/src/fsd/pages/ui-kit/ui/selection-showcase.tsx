import { useState } from "react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { energyIconUrl, EntityIcon } from "@/shared/ui"

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

export function SelectionShowcase() {
  const [density, setDensity] = useState("comfortable")
  const [energy, setEnergy] = useState([65])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UiKitShowcaseCard title="Choices">
        <FieldGroup data-testid="selection-choices">
          <FieldSet>
            <FieldLegend>Visible columns</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox id="ui-kit-goals" defaultChecked />
                <FieldLabel htmlFor="ui-kit-goals">Goals</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="ui-kit-raids" />
                <FieldLabel htmlFor="ui-kit-raids">Raids</FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Theme density</FieldLegend>
            <RadioGroup defaultValue="comfortable">
              <Field orientation="horizontal">
                <RadioGroupItem id="density-compact" value="compact" />
                <FieldLabel htmlFor="density-compact">Compact</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem id="density-comfortable" value="comfortable" />
                <FieldLabel htmlFor="density-comfortable">
                  Comfortable
                </FieldLabel>
              </Field>
            </RadioGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Switch id="ui-kit-switch" defaultChecked />
            <FieldContent>
              <FieldLabel htmlFor="ui-kit-switch">
                Show completed items
              </FieldLabel>
              <FieldDescription>
                Applies to list and table examples.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Selectors">
        <FieldGroup data-testid="selection-selectors">
          <Field>
            <FieldLabel>Sort by</FieldLabel>
            <Select defaultValue="priority">
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="date">Date added</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Density</FieldLabel>
            <ToggleGroup
              onValueChange={(value) => {
                if (value) setDensity(value)
              }}
              type="single"
              value={density}
              variant="outline"
            >
              <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
              <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
              <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel className="flex items-center gap-1.5">
              Daily energy:
              <EntityIcon
                alt=""
                className="size-4 shrink-0"
                src={energyIconUrl}
              />
              {energy[0]}
            </FieldLabel>
            <Slider
              max={100}
              onValueChange={setEnergy}
              step={5}
              value={energy}
            />
          </Field>
        </FieldGroup>
      </UiKitShowcaseCard>
    </div>
  )
}
