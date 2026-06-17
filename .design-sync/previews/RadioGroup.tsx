import { Label, RadioGroup, RadioGroupItem } from '@workspace/ui'

export function Default() {
  return (
    <RadioGroup defaultValue="comfortable" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  )
}

export function Disabled() {
  return (
    <RadioGroup defaultValue="a" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="a" id="d1" />
        <Label htmlFor="d1">Available</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="b" id="d2" disabled />
        <Label htmlFor="d2">Unavailable</Label>
      </div>
    </RadioGroup>
  )
}
