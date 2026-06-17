import { Label, Textarea } from '@workspace/ui'

export function Default() {
  return <Textarea placeholder="Type your message here." style={{ width: 320 }} />
}

export function WithLabel() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        defaultValue="Frontend engineer based in Berlin. I build design systems and care a lot about accessibility."
        rows={4}
      />
    </div>
  )
}

export function Disabled() {
  return (
    <Textarea
      disabled
      defaultValue="This field is read-only."
      style={{ width: 320 }}
    />
  )
}
