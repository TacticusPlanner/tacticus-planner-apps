import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
} from '@workspace/ui'

export function Default() {
  return (
    <FieldGroup style={{ width: 360 }}>
      <Field>
        <FieldLabel htmlFor="name">Full name</FieldLabel>
        <Input id="name" placeholder="Ada Lovelace" />
        <FieldDescription>As it appears on your ID.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="email-f">Email</FieldLabel>
        <Input id="email-f" type="email" placeholder="ada@example.com" />
      </Field>
    </FieldGroup>
  )
}

export function Fieldset() {
  return (
    <FieldSet style={{ width: 360 }}>
      <FieldLegend>Notifications</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="addr">Street address</FieldLabel>
          <Input id="addr" placeholder="123 Main St" />
        </Field>
        <FieldDescription>We only use this for shipping.</FieldDescription>
      </FieldGroup>
    </FieldSet>
  )
}
